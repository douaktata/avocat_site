package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.AppointmentRequestDTO;
import com.example.monpremiersite.dto.chat.ChatRequest;
import com.example.monpremiersite.dto.chat.ChatResponse;
import com.example.monpremiersite.entities.ChatMessage;
import com.example.monpremiersite.repository.AvailableSlotRepository;
import com.example.monpremiersite.repository.ChatMessageRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    // Formats de date/heure acceptés pour parseDateTime()
    private static final List<DateTimeFormatter> DT_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy H:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH'h'mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH'h'"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd H:mm")
    );
    private static final List<DateTimeFormatter> TIME_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("H:mm"),
            DateTimeFormatter.ofPattern("HH'h'mm"),
            DateTimeFormatter.ofPattern("HH'h'"),
            DateTimeFormatter.ofPattern("H'h'")
    );
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("d/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
    );
    private static final DateTimeFormatter DATE_FMT_FULL = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Value("${chat.max-history-messages:20}")
    private int maxHistoryMessages;

    private final ChatMessageRepository chatMessageRepository;
    private final GeminiService geminiService;
    private final ChatContextEnricher contextEnricher;
    private final AppointmentAgendaService appointmentAgendaService;
    private final AvailableSlotRepository availableSlotRepository;
    private final ObjectMapper objectMapper;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       GeminiService geminiService,
                       ChatContextEnricher contextEnricher,
                       AppointmentAgendaService appointmentAgendaService,
                       AvailableSlotRepository availableSlotRepository,
                       ObjectMapper objectMapper) {
        this.chatMessageRepository = chatMessageRepository;
        this.geminiService = geminiService;
        this.contextEnricher = contextEnricher;
        this.appointmentAgendaService = appointmentAgendaService;
        this.availableSlotRepository = availableSlotRepository;
        this.objectMapper = objectMapper;
    }

    // ── Point d'entrée principal ───────────────────────────────────────────────

    @Transactional
    public ChatResponse processMessage(Long userId, ChatRequest request) {
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId()
                : UUID.randomUUID().toString();

        // Charger les N derniers messages de cette session
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        if (history.size() > maxHistoryMessages) {
            history = history.subList(history.size() - maxHistoryMessages, history.size());
        }

        // ── [1] Raccourci déterministe : clic sur un créneau ─────────────────
        // Ex : "Lundi 14/04 à 09:00" — pas d'appel API
        Map<String, String> detectedSlot = detectSlotInMessage(request.getMessage());
        if (!detectedSlot.isEmpty()) {
            return handleSlotSelection(userId, sessionId, request.getMessage(), detectedSlot, history);
        }

        // ── [2] Raccourci déterministe : confirmation ("oui", "ok", etc.) ────
        // Uniquement si date + heure ont déjà été extraites dans l'historique
        if (isConfirmationMessage(request.getMessage())) {
            Map<String, Object> pending = mergeExtractedFromHistory(history);
            if (hasValue(pending, "date_preferee") && hasValue(pending, "heure_preferee")) {
                return handleConfirmation(userId, sessionId, request.getMessage(), pending);
            }
        }

        // ── [3] Appel Gemini ──────────────────────────────────────────────────
        boolean isFirstMessage = history.isEmpty();
        String systemPrompt = contextEnricher.buildSystemPrompt(userId, isFirstMessage, Map.of());

        String rawJson = geminiService.chat(systemPrompt, history, request.getMessage());

        // Parse le JSON — valide garanti par responseSchema Gemini
        ChatResponse chatResponse = parseGeminiResponse(rawJson, sessionId);
        chatResponse.setSessionId(sessionId);

        // Filet de sécurité : compléter les champs que Gemini aurait laissés vides
        chatResponse = enrichExtractedFromUserMessage(chatResponse, request.getMessage(), history);

        // Remplacer les créneaux générés par Gemini par les vrais créneaux depuis la DB
        List<String> suggestions = chatResponse.getSuggestions();
        if (suggestions != null && !suggestions.isEmpty()) {
            boolean looksLikeSlots = suggestions.stream().anyMatch(s -> s != null && (
                    s.matches(".*\\d{1,2}/\\d{2}.*\\d{1,2}[hH:]\\d{2}.*") ||
                    s.toLowerCase().matches(".*(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche).*")));
            if (looksLikeSlots) {
                List<String> realSlots = contextEnricher.computeSlotSuggestions();
                chatResponse.setSuggestions(realSlots.isEmpty() ? new ArrayList<>() : realSlots);
            }
        }

        // Sécurité : Gemini ne devrait jamais mettre appointment_confirmed=true
        // (c'est handleConfirmation() qui crée le RDV), mais on gère le cas par précaution
        if (chatResponse.isAppointmentConfirmed() && chatResponse.getExtractedData() != null) {
            Long appointmentId = createAppointmentFromExtracted(userId, chatResponse.getExtractedData());
            chatResponse.setAppointmentRequestId(appointmentId);
        }

        // Persister les deux messages (user + assistant)
        saveMessage(userId, sessionId, ChatMessage.MessageRole.user, request.getMessage(), null);
        String extractedJson = null;
        if (chatResponse.getExtractedData() != null) {
            try { extractedJson = objectMapper.writeValueAsString(chatResponse.getExtractedData()); }
            catch (Exception ignored) {}
        }
        saveMessage(userId, sessionId, ChatMessage.MessageRole.assistant, chatResponse.getMessage(), extractedJson);

        return chatResponse;
    }

    // ── API publique ───────────────────────────────────────────────────────────

    public List<ChatMessage> getSessionHistory(String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional
    public void deleteSession(String sessionId) {
        chatMessageRepository.deleteBySessionId(sessionId);
    }

    /**
     * Retourne la liste de toutes les sessions d'un utilisateur
     * avec un aperçu du premier message et la date du dernier.
     */
    public List<Map<String, Object>> getUserSessions(Long userId) {
        List<String> sessionIds = chatMessageRepository.findDistinctSessionIdsByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (String sid : sessionIds) {
            List<ChatMessage> msgs = chatMessageRepository.findFirstMessageBySessionId(sid);
            if (msgs.isEmpty()) continue;
            String preview = msgs.stream()
                    .filter(m -> m.getRole() == ChatMessage.MessageRole.user)
                    .map(ChatMessage::getContent)
                    .findFirst()
                    .orElse(msgs.get(0).getContent());
            if (preview.length() > 60) preview = preview.substring(0, 57) + "…";
            ChatMessage last = msgs.get(msgs.size() - 1);
            Map<String, Object> session = new HashMap<>();
            session.put("sessionId", sid);
            session.put("preview", preview);
            session.put("lastMessageAt", last.getCreatedAt());
            session.put("messageCount", msgs.size());
            result.add(session);
        }
        return result;
    }

    /**
     * Crée une nouvelle session et retourne le message de bienvenue
     * (sans appel Gemini — message statique pour performance).
     */
    @Transactional
    public ChatResponse startNewSession(Long userId) {
        String sessionId = UUID.randomUUID().toString();
        String prenom = contextEnricher.getUserPrenom(userId);
        String welcome = "Bonjour " + prenom + " ! Comment puis-je vous aider aujourd'hui ?";

        saveMessage(userId, sessionId, ChatMessage.MessageRole.assistant, welcome, null);

        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setMessage(welcome);
        response.setSuggestions(List.of("Prendre un rendez-vous", "Voir mes dossiers", "Poser une question"));
        return response;
    }

    // ── Parse de la réponse Gemini ─────────────────────────────────────────────

    /**
     * Parse le JSON retourné par Gemini (valide garanti par responseSchema).
     * Plus besoin de regex : on parse directement avec Jackson.
     */
    private ChatResponse parseGeminiResponse(String rawJson, String sessionId) {
        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);

        if (rawJson == null || rawJson.isBlank()) {
            response.setMessage("Je n'ai pas pu traiter votre demande. Veuillez réessayer.");
            response.setSuggestions(new ArrayList<>());
            return response;
        }

        try {
            Map<String, Object> parsed = objectMapper.readValue(rawJson, new TypeReference<>() {});

            response.setMessage(getString(parsed, "message", "Je n'ai pas pu traiter votre demande."));
            response.setReadyToConfirm(getBoolean(parsed, "ready_to_confirm"));
            response.setAppointmentConfirmed(getBoolean(parsed, "appointment_confirmed"));

            Object suggestionsObj = parsed.get("suggestions");
            if (suggestionsObj instanceof List<?> list) {
                response.setSuggestions(list.stream().map(Object::toString).collect(Collectors.toList()));
            } else {
                response.setSuggestions(new ArrayList<>());
            }

            Object extractedObj = parsed.get("extracted");
            if (extractedObj instanceof Map<?, ?> map) {
                Map<String, Object> extracted = new HashMap<>();
                map.forEach((k, v) -> extracted.put(String.valueOf(k), v));
                response.setExtractedData(extracted);
            }

        } catch (Exception e) {
            log.warn("Erreur parsing JSON Gemini : {}", e.getMessage());
            response.setMessage("Je n'ai pas pu traiter votre demande. Veuillez réessayer.");
            response.setSuggestions(new ArrayList<>());
        }

        return response;
    }

    // ── Raccourcis déterministes ───────────────────────────────────────────────

    /**
     * L'utilisateur a cliqué sur un créneau suggéré (ex : "Lundi 14/04 à 09:00").
     * On fusionne date/heure avec les données extraites de l'historique
     * et on demande uniquement ce qui manque encore.
     */
    @Transactional
    private ChatResponse handleSlotSelection(Long userId, String sessionId, String userMessage,
                                             Map<String, String> slot, List<ChatMessage> history) {
        Map<String, Object> extracted = mergeExtractedFromHistory(history);
        extracted.put("date_preferee", slot.get("date_preferee"));
        extracted.put("heure_preferee", slot.get("heure_preferee"));

        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setExtractedData(extracted);
        response.setSuggestions(new ArrayList<>());
        response.setAppointmentConfirmed(false);

        String typeAffaire = getString(extracted, "type_affaire", null);
        String description  = getString(extracted, "description",  null);
        boolean hasType = typeAffaire != null && !typeAffaire.isBlank() && !"null".equals(typeAffaire);
        boolean hasDesc = description  != null && !description.isBlank()  && !"null".equals(description);

        if (hasType && hasDesc) {
            response.setReadyToConfirm(true);
            response.setMessage("Voici le récapitulatif de votre demande :\n" +
                    "• Date : " + slot.get("date_preferee") + " à " + slot.get("heure_preferee") + "\n" +
                    "• Type : " + typeAffaire + "\n" +
                    "• Motif : " + description + "\n\n" +
                    "Confirmez-vous ce rendez-vous ?");
        } else if (hasType) {
            response.setReadyToConfirm(false);
            response.setMessage("Créneau noté : le " + slot.get("date_preferee") + " à " + slot.get("heure_preferee") +
                    ". Pouvez-vous décrire brièvement votre situation ?");
        } else {
            response.setReadyToConfirm(false);
            response.setMessage("Créneau noté : le " + slot.get("date_preferee") + " à " + slot.get("heure_preferee") +
                    ". Pour quel type d'affaire souhaitez-vous ce rendez-vous ? (ex : divorce, pénal, droit du travail…)" +
                    " Et décrivez brièvement votre situation.");
        }

        saveMessage(userId, sessionId, ChatMessage.MessageRole.user, userMessage, null);
        try {
            String json = objectMapper.writeValueAsString(extracted);
            saveMessage(userId, sessionId, ChatMessage.MessageRole.assistant, response.getMessage(), json);
        } catch (Exception ignored) {}

        return response;
    }

    /**
     * L'utilisateur a confirmé le rendez-vous ("oui", "je confirme", etc.)
     * et toutes les informations nécessaires sont déjà dans l'historique.
     * On crée le RDV directement — pas d'appel API.
     */
    @Transactional
    private ChatResponse handleConfirmation(Long userId, String sessionId,
                                            String userMsg, Map<String, Object> pending) {
        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setExtractedData(pending);
        response.setSuggestions(new ArrayList<>());
        response.setReadyToConfirm(false);
        response.setAppointmentConfirmed(true);

        Long appointmentId = createAppointmentFromExtracted(userId, pending);
        response.setAppointmentRequestId(appointmentId);
        response.setMessage("Votre demande de rendez-vous a bien été enregistrée !" +
                (appointmentId != null ? " (réf. n°" + appointmentId + ")" : "") +
                " Le cabinet vous contactera pour confirmer la date.");

        saveMessage(userId, sessionId, ChatMessage.MessageRole.user, userMsg, null);
        try {
            saveMessage(userId, sessionId, ChatMessage.MessageRole.assistant,
                    response.getMessage(), objectMapper.writeValueAsString(pending));
        } catch (Exception ignored) {}

        return response;
    }

    // ── Création du rendez-vous ────────────────────────────────────────────────

    /**
     * Crée un AppointmentRequest à partir des données extraites par Gemini.
     * Retourne l'ID de la demande créée, ou null en cas d'erreur.
     */
    private Long createAppointmentFromExtracted(Long userId, Map<String, Object> extracted) {
        try {
            AppointmentRequestDTO dto = new AppointmentRequestDTO();

            // Raison = type_affaire + description
            String typeAffaire = getString(extracted, "type_affaire", "");
            String description = getString(extracted, "description", "");
            dto.reason = typeAffaire.isBlank() ? description
                    : (description.isBlank() ? typeAffaire : typeAffaire + " — " + description);

            // Urgence — Gemini retourne un booléen, les anciens messages peuvent avoir une chaîne
            Object urgenceRaw = extracted.get("urgence");
            boolean isUrgent = (urgenceRaw instanceof Boolean b && b)
                    || (urgenceRaw instanceof String s
                        && (s.equalsIgnoreCase("true") || s.toLowerCase().contains("urgent")));
            dto.urgencyLevel = isUrgent ? "URGENT" : "NORMAL";

            // Date + heure
            String datePref  = getString(extracted, "date_preferee",  null);
            String heurePref = getString(extracted, "heure_preferee", null);
            LocalDateTime appointmentDate = parseDateTime(datePref, heurePref);
            dto.dateSouhaitee = appointmentDate != null ? appointmentDate : LocalDateTime.now().plusDays(1);

            // Trouver l'avocat disponible sur ce créneau
            if (appointmentDate != null) {
                java.time.DayOfWeek dow = appointmentDate.getDayOfWeek();
                LocalDate date = appointmentDate.toLocalDate();
                LocalTime time = appointmentDate.toLocalTime();
                availableSlotRepository.findByActiveTrue().stream()
                        .filter(s -> dow.equals(s.getDayOfWeek())
                                && s.getStartTime() != null && !time.isBefore(s.getStartTime())
                                && s.getEndTime()   != null &&  time.isBefore(s.getEndTime())
                                && (s.getValidFrom()  == null || !date.isBefore(s.getValidFrom()))
                                && (s.getValidUntil() == null || !date.isAfter(s.getValidUntil()))
                                && s.getAvocat() != null)
                        .findFirst()
                        .ifPresent(s -> dto.avocatId = s.getAvocat().getIdu());
            }

            return appointmentAgendaService.submitRequest(dto, userId).id;
        } catch (Exception e) {
            log.error("Erreur création RDV depuis chat : {}", e.getMessage());
            return null;
        }
    }

    // ── Fusion et enrichissement de l'état extrait ────────────────────────────

    /**
     * Reconstruit les données extraites en fusionnant tous les messages assistant
     * de l'historique (prend la dernière valeur non-nulle pour chaque champ).
     */
    private Map<String, Object> mergeExtractedFromHistory(List<ChatMessage> history) {
        Map<String, Object> merged = new HashMap<>();
        for (ChatMessage msg : history) {
            if (msg.getExtractedData() == null || msg.getExtractedData().isBlank()) continue;
            try {
                Map<String, Object> e = objectMapper.readValue(msg.getExtractedData(), new TypeReference<>() {});
                e.forEach((k, v) -> {
                    if (v != null && !"null".equals(String.valueOf(v)) && !String.valueOf(v).isBlank()) {
                        merged.put(k, v);
                    }
                });
            } catch (Exception ignored) {}
        }
        return merged;
    }

    /**
     * Filet de sécurité post-Gemini : complète les champs encore vides
     * en relisant le message brut de l'utilisateur avec les extracteurs Java.
     * Si tous les champs requis sont maintenant présents, promeut en readyToConfirm.
     */
    private ChatResponse enrichExtractedFromUserMessage(ChatResponse response,
                                                        String userMsg,
                                                        List<ChatMessage> history) {
        // Base : historique + ce que Gemini a déjà extrait
        Map<String, Object> extracted = mergeExtractedFromHistory(history);
        if (response.getExtractedData() != null) {
            response.getExtractedData().forEach((k, v) -> {
                if (v != null && !"null".equals(String.valueOf(v)) && !String.valueOf(v).isBlank())
                    extracted.put(k, v);
            });
        }

        // Compléter les champs manquants depuis le message brut
        if (!hasValue(extracted, "type_affaire")) {
            String t = extractTypeFromText(userMsg);
            if (t != null) extracted.put("type_affaire", t);
        }
        if (!hasValue(extracted, "description")) {
            String d = extractDescriptionFromText(userMsg, extracted.get("type_affaire"));
            if (d != null) extracted.put("description", d);
        }
        if (!hasValue(extracted, "date_preferee")) {
            String dt = extractDateFromText(userMsg);
            if (dt != null) extracted.put("date_preferee", dt);
        }
        if (!hasValue(extracted, "heure_preferee")) {
            String h = extractTimeFromText(userMsg);
            if (h != null) extracted.put("heure_preferee", h);
        }
        // Urgence : on peut toujours la promouvoir à true si détectée
        if (isUrgent(userMsg)) extracted.put("urgence", true);

        response.setExtractedData(extracted);

        // Promotion automatique en readyToConfirm si les 4 champs sont présents
        boolean allFilled = hasValue(extracted, "type_affaire")
                && hasValue(extracted, "description")
                && hasValue(extracted, "date_preferee")
                && hasValue(extracted, "heure_preferee");

        if (allFilled && !response.isReadyToConfirm() && !response.isAppointmentConfirmed()) {
            response.setReadyToConfirm(true);
            response.setSuggestions(new ArrayList<>());
            response.setMessage("Voici le récapitulatif de votre demande :\n" +
                    "• Date : " + extracted.get("date_preferee") + " à " + extracted.get("heure_preferee") + "\n" +
                    "• Type : " + extracted.get("type_affaire") + "\n" +
                    "• Motif : " + extracted.get("description") + "\n\n" +
                    "Confirmez-vous ce rendez-vous ?");
        }

        return response;
    }

    // ── Détection de créneau (clic chip frontend) ──────────────────────────────

    /**
     * Détecte si le message de l'utilisateur correspond à un créneau suggéré.
     * Formats supportés :
     *   "Lundi 14/04 à 09:00"    — format principal des chips frontend
     *   "14/04 à 09:00"          — sans nom de jour
     *   "Lundi 14/04 : 09:00"    — séparateur deux-points
     *   "lundi 14/04 à 9h00"     — variante avec heure "Hh"
     *   "Lundi 11h" / "Mardi 9h30" — jour + heure sans date explicite
     *
     * @return map avec "date_preferee" (dd/MM/yyyy) et "heure_preferee" (HH:mm), ou vide
     */
    private Map<String, String> detectSlotInMessage(String message) {
        if (message == null) return Map.of();
        log.debug("detectSlotInMessage — analyse : '{}'", message);

        // ── Pattern 1 : DD/MM[/YYYY] [séparateur quelconque] HH[h/:]MM ────────
        // Couvre : "14/04 à 09:00", "14/04 : 09:00", "Lundi 14/04 à 09:00", "14/04 à 9h00"
        Matcher m1 = Pattern.compile(
                "(\\d{1,2})/(\\d{2})(?:/(\\d{4}))?[^0-9]*?(\\d{1,2})[hH:](\\d{2})",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                .matcher(message);
        if (m1.find()) {
            try {
                int day   = Integer.parseInt(m1.group(1));
                int month = Integer.parseInt(m1.group(2));
                int h     = Integer.parseInt(m1.group(4));
                int min   = Integer.parseInt(m1.group(5));
                LocalDate date = LocalDate.of(LocalDate.now().getYear(), month, day);
                if (date.isBefore(LocalDate.now())) date = date.plusYears(1);
                String dateFmt = date.format(DATE_FMT_FULL);
                String heureFmt = String.format("%02d:%02d", h, min);
                log.info("detectSlotInMessage — créneau pattern 1 : date={} heure={}", dateFmt, heureFmt);
                return Map.of("date_preferee", dateFmt, "heure_preferee", heureFmt);
            } catch (Exception e) {
                log.debug("detectSlotInMessage — échec pattern 1 : {}", e.getMessage());
            }
        }

        // ── Pattern 2 : <nom du jour> [+ HHhMM ou HH:MM] ────────────────────
        // Couvre : "Lundi 11h", "Mardi 9h30", "mercredi à 14:00"
        String[] dayNames = {"lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"};
        java.time.DayOfWeek[] dows = {
            java.time.DayOfWeek.MONDAY, java.time.DayOfWeek.TUESDAY, java.time.DayOfWeek.WEDNESDAY,
            java.time.DayOfWeek.THURSDAY, java.time.DayOfWeek.FRIDAY,
            java.time.DayOfWeek.SATURDAY, java.time.DayOfWeek.SUNDAY
        };
        String lower = message.toLowerCase();
        for (int i = 0; i < dayNames.length; i++) {
            if (!lower.contains(dayNames[i])) continue;

            // Essai format HHhMM (ex : "11h", "9h30")
            Matcher mh = Pattern.compile("(\\d{1,2})[hH](\\d{0,2})").matcher(message);
            if (mh.find()) {
                int h   = Integer.parseInt(mh.group(1));
                int min = mh.group(2).isEmpty() ? 0 : Integer.parseInt(mh.group(2));
                LocalDate date = nextWeekday(LocalDate.now(), dows[i]);
                String dateFmt = date.format(DATE_FMT_FULL);
                String heureFmt = String.format("%02d:%02d", h, min);
                log.info("detectSlotInMessage — créneau pattern 2 (Hh) : jour={} date={} heure={}",
                         dayNames[i], dateFmt, heureFmt);
                return Map.of("date_preferee", dateFmt, "heure_preferee", heureFmt);
            }

            // Essai format HH:MM (ex : "14:00")
            Matcher mc = Pattern.compile("(\\d{1,2}):(\\d{2})").matcher(message);
            if (mc.find()) {
                int h   = Integer.parseInt(mc.group(1));
                int min = Integer.parseInt(mc.group(2));
                LocalDate date = nextWeekday(LocalDate.now(), dows[i]);
                String dateFmt = date.format(DATE_FMT_FULL);
                String heureFmt = String.format("%02d:%02d", h, min);
                log.info("detectSlotInMessage — créneau pattern 2 (H:MM) : jour={} date={} heure={}",
                         dayNames[i], dateFmt, heureFmt);
                return Map.of("date_preferee", dateFmt, "heure_preferee", heureFmt);
            }
        }

        log.debug("detectSlotInMessage — aucun créneau dans : '{}'", message);
        return Map.of();
    }

    // ── Extracteurs de langage naturel (filet de sécurité) ────────────────────

    private static final Map<String, String> TYPE_KEYWORDS = new LinkedHashMap<>() {{
        put("divorce",              "Divorce");
        put("séparation",           "Divorce");
        put("separation",           "Divorce");
        put("garde d'enfant",       "Divorce");
        put("garde enfant",         "Divorce");
        put("pension alimentaire",  "Divorce");
        put("partage des biens",    "Divorce");
        put("plainte",              "Pénal");
        put("garde à vue",          "Pénal");
        put("garde a vue",          "Pénal");
        put("délit",                "Pénal");
        put("delit",                "Pénal");
        put("crime",                "Pénal");
        put("fraude",               "Pénal");
        put("vol",                  "Pénal");
        put("agression",            "Pénal");
        put("pénal",                "Pénal");
        put("penal",                "Pénal");
        put("criminel",             "Pénal");
        put("infraction",           "Pénal");
        put("licenciement",         "Droit du travail");
        put("employeur",            "Droit du travail");
        put("salarié",              "Droit du travail");
        put("salarie",              "Droit du travail");
        put("harcèlement",          "Droit du travail");
        put("harcelement",          "Droit du travail");
        put("prud'hommes",          "Droit du travail");
        put("prud'homme",           "Droit du travail");
        put("contrat de travail",   "Droit du travail");
        put("travail",              "Droit du travail");
        put("loyer",                "Droit immobilier");
        put("bail",                 "Droit immobilier");
        put("propriétaire",         "Droit immobilier");
        put("proprietaire",         "Droit immobilier");
        put("locataire",            "Droit immobilier");
        put("expulsion",            "Droit immobilier");
        put("copropriété",          "Droit immobilier");
        put("copropriete",          "Droit immobilier");
        put("immobilier",           "Droit immobilier");
        put("litige commercial",    "Droit des affaires");
        put("contrat commercial",   "Droit des affaires");
        put("faillite",             "Droit des affaires");
        put("société",              "Droit des affaires");
        put("societe",              "Droit des affaires");
        put("entreprise",           "Droit des affaires");
        put("commercial",           "Droit des affaires");
        put("héritage",             "Droit de la famille");
        put("heritage",             "Droit de la famille");
        put("succession",           "Droit de la famille");
        put("mariage",              "Droit de la famille");
        put("adoption",             "Droit de la famille");
        put("famille",              "Droit de la famille");
        put("filiation",            "Droit de la famille");
        put("administration",       "Droit administratif");
        put("permis",               "Droit administratif");
        put("urbanisme",            "Droit administratif");
        put("fonction publique",    "Droit administratif");
        put("civil",                "Civil");
    }};

    private String extractTypeFromText(String msg) {
        if (msg == null) return null;
        String lower = msg.toLowerCase();
        for (Map.Entry<String, String> e : TYPE_KEYWORDS.entrySet()) {
            if (lower.contains(e.getKey())) return e.getValue();
        }
        return null;
    }

    private String extractDescriptionFromText(String msg, Object type) {
        if (msg == null) return null;
        String desc = msg.trim();
        Matcher m = Pattern.compile(
                "(?:pour|concernant|au sujet de?|à propos de?)\\s+(.+?)(?:\\.|,|$)",
                Pattern.CASE_INSENSITIVE)
                .matcher(msg);
        if (m.find()) desc = capitalise(m.group(1).trim());
        if (desc.length() > 120) desc = desc.substring(0, 120) + "…";
        return desc.isBlank() ? null : desc;
    }

    private String extractDateFromText(String msg) {
        if (msg == null) return null;
        String lower = msg.toLowerCase();
        LocalDate today = LocalDate.now();

        // Priorité : format DD/MM ou DD/MM/YYYY explicite
        Matcher dm = Pattern.compile("(\\d{1,2})/(\\d{2})(?:/(\\d{4}))?").matcher(msg);
        if (dm.find()) {
            try {
                int d  = Integer.parseInt(dm.group(1));
                int mo = Integer.parseInt(dm.group(2));
                int yr = dm.group(3) != null ? Integer.parseInt(dm.group(3)) : today.getYear();
                LocalDate date = LocalDate.of(yr, mo, d);
                if (!date.isAfter(today)) date = date.plusYears(1);
                return date.format(DATE_FMT_FULL);
            } catch (Exception ignored) {}
        }

        // Mots-clés relatifs
        if (lower.contains("demain"))
            return today.plusDays(1).format(DATE_FMT_FULL);
        if (lower.contains("après-demain") || lower.contains("apres-demain"))
            return today.plusDays(2).format(DATE_FMT_FULL);

        // Noms de jours → prochain occurrence
        java.time.DayOfWeek[] dows = {
            java.time.DayOfWeek.MONDAY, java.time.DayOfWeek.TUESDAY, java.time.DayOfWeek.WEDNESDAY,
            java.time.DayOfWeek.THURSDAY, java.time.DayOfWeek.FRIDAY,
            java.time.DayOfWeek.SATURDAY, java.time.DayOfWeek.SUNDAY
        };
        String[] names = {"lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"};
        for (int i = 0; i < names.length; i++) {
            if (lower.contains(names[i])) return nextWeekday(today, dows[i]).format(DATE_FMT_FULL);
        }
        return null;
    }

    private String extractTimeFromText(String msg) {
        if (msg == null) return null;
        // Matches : "10h", "10h30", "10:30", "10 heures"
        Matcher m = Pattern.compile("(\\d{1,2})\\s*[hH:]\\s*(\\d{0,2})").matcher(msg);
        if (m.find()) {
            int hour = Integer.parseInt(m.group(1));
            String minStr = m.group(2).trim();
            int min = minStr.isEmpty() ? 0 : Integer.parseInt(minStr);
            if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59)
                return String.format("%02d:%02d", hour, min);
        }
        return null;
    }

    private boolean isUrgent(String msg) {
        if (msg == null) return false;
        String lower = msg.toLowerCase();
        return lower.contains("urgent") || lower.contains("urgence")
                || lower.contains("pressé") || lower.contains("presse")
                || lower.contains("rapidement") || lower.contains("au plus vite")
                || lower.contains("immédiatement") || lower.contains("immediatement");
    }

    /** Détecte une confirmation de l'utilisateur ("oui", "ok", "je confirme", etc.). */
    private boolean isConfirmationMessage(String msg) {
        if (msg == null) return false;
        String lower = msg.toLowerCase().trim();
        return lower.matches(".*(\\boui\\b|\\bok\\b|\\bparfait\\b|confirme|c'est bon|c est bon" +
                "|je confirme|d'accord|d accord|valide|correct|exact|allons-y|allez).*");
    }

    // ── Utilitaires ────────────────────────────────────────────────────────────

    /** Parse date + heure avec plusieurs formats de secours. */
    private LocalDateTime parseDateTime(String datePref, String heurePref) {
        if (datePref == null || heurePref == null) return null;

        String time = heurePref.trim()
                .replaceAll("(?i)h([0-9]{2})", ":$1")
                .replaceAll("(?i)([0-9]+)h$",  "$1:00")
                .replaceAll("^([0-9]):", "0$1:");

        String combined = datePref.trim() + " " + time;
        for (DateTimeFormatter fmt : DT_FORMATTERS) {
            try { return LocalDateTime.parse(combined, fmt); }
            catch (DateTimeParseException ignored) {}
        }

        LocalDate date = null;
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try { date = LocalDate.parse(datePref.trim(), fmt); break; }
            catch (DateTimeParseException ignored) {}
        }
        if (date == null) {
            try {
                Matcher m = Pattern.compile("(\\d{1,2})/(\\d{2})").matcher(datePref.trim());
                if (m.find()) {
                    int d  = Integer.parseInt(m.group(1));
                    int mo = Integer.parseInt(m.group(2));
                    date = LocalDate.of(LocalDate.now().getYear(), mo, d);
                    if (date.isBefore(LocalDate.now())) date = date.plusYears(1);
                }
            } catch (Exception ignored) {}
        }

        LocalTime localTime = null;
        for (DateTimeFormatter fmt : TIME_FORMATTERS) {
            try { localTime = LocalTime.parse(time, fmt); break; }
            catch (DateTimeParseException ignored) {}
        }

        if (date != null && localTime != null) return date.atTime(localTime);
        return null;
    }

    private void saveMessage(Long userId, String sessionId,
                             ChatMessage.MessageRole role, String content, String extractedData) {
        ChatMessage msg = new ChatMessage();
        msg.setUserId(userId);
        msg.setSessionId(sessionId);
        msg.setRole(role);
        msg.setContent(content);
        msg.setExtractedData(extractedData);
        msg.setCreatedAt(LocalDateTime.now());
        chatMessageRepository.save(msg);
    }

    private boolean hasValue(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null && !"null".equals(String.valueOf(v)) && !String.valueOf(v).isBlank();
    }

    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return (val != null && !val.toString().equals("null")) ? val.toString() : defaultValue;
    }

    private boolean getBoolean(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s)  return Boolean.parseBoolean(s);
        return false;
    }

    private LocalDate nextWeekday(LocalDate from, java.time.DayOfWeek dow) {
        LocalDate d = from.plusDays(1);
        while (d.getDayOfWeek() != dow) d = d.plusDays(1);
        return d;
    }

    private String capitalise(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
