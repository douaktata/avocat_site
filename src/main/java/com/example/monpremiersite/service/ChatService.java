package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.AppointmentRequestDTO;
import com.example.monpremiersite.dto.chat.*;
import com.example.monpremiersite.entities.ChatMessage;
import com.example.monpremiersite.repository.AvailableSlotRepository;
import com.example.monpremiersite.repository.ChatMessageRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final Pattern JSON_PATTERN = Pattern.compile("\\{[\\s\\S]*\\}");

    // Multiple date/time formats the LLM might produce
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

    @Value("${chat.max-history-messages:20}")
    private int maxHistoryMessages;

    private final ChatMessageRepository chatMessageRepository;
    private final OllamaService ollamaService;
    private final ChatContextEnricher contextEnricher;
    private final AppointmentAgendaService appointmentAgendaService;
    private final AvailableSlotRepository availableSlotRepository;
    private final ObjectMapper objectMapper;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       OllamaService ollamaService,
                       ChatContextEnricher contextEnricher,
                       AppointmentAgendaService appointmentAgendaService,
                       AvailableSlotRepository availableSlotRepository,
                       ObjectMapper objectMapper) {
        this.chatMessageRepository = chatMessageRepository;
        this.ollamaService = ollamaService;
        this.contextEnricher = contextEnricher;
        this.appointmentAgendaService = appointmentAgendaService;
        this.availableSlotRepository = availableSlotRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ChatResponse processMessage(Long userId, ChatRequest request) {
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId()
                : UUID.randomUUID().toString();

        // Load last N messages for this session
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        if (history.size() > maxHistoryMessages) {
            history = history.subList(history.size() - maxHistoryMessages, history.size());
        }

        // Build system prompt enriched with client data
        boolean isFirstMessage = history.isEmpty();
        String systemPrompt = contextEnricher.buildSystemPrompt(userId, isFirstMessage);

        // Convert history to OllamaMessages
        List<OllamaMessage> messages = history.stream()
                .map(m -> new OllamaMessage(m.getRole().name(), m.getContent()))
                .collect(Collectors.toList());

        // Add current user message
        messages.add(new OllamaMessage("user", request.getMessage()));

        // Call Ollama
        OllamaChatResponse ollamaResponse = ollamaService.chat(systemPrompt, messages);
        String rawContent = ollamaResponse.getMessage() != null
                ? ollamaResponse.getMessage().getContent()
                : "";

        // Parse LLM response JSON
        ChatResponse chatResponse = parseLlmResponse(rawContent, sessionId);
        chatResponse.setSessionId(sessionId);

        // Override suggestions with real DB slots when the LLM is proposing appointment slots
        // (detected when suggestions contain "à" time pattern — i.e. slot strings)
        List<String> llmSuggestions = chatResponse.getSuggestions();
        boolean llmProposedSlots = llmSuggestions != null && llmSuggestions.stream()
                .anyMatch(s -> s != null && s.contains(" à "));
        if (llmProposedSlots) {
            List<String> realSlots = contextEnricher.computeSlotSuggestions();
            if (!realSlots.isEmpty()) {
                chatResponse.setSuggestions(realSlots);
            }
        }

        // Create appointment if confirmed
        if (chatResponse.isAppointmentConfirmed() && chatResponse.getExtractedData() != null) {
            Long appointmentId = createAppointmentFromExtracted(userId, chatResponse.getExtractedData());
            chatResponse.setAppointmentRequestId(appointmentId);
        }

        // Persist user message
        saveMessage(userId, sessionId, ChatMessage.MessageRole.user, request.getMessage(), null);

        // Persist assistant message (store extracted data as JSON string)
        String extractedJson = null;
        if (chatResponse.getExtractedData() != null) {
            try { extractedJson = objectMapper.writeValueAsString(chatResponse.getExtractedData()); }
            catch (Exception ignored) {}
        }
        saveMessage(userId, sessionId, ChatMessage.MessageRole.assistant, chatResponse.getMessage(), extractedJson);

        return chatResponse;
    }

    public List<ChatMessage> getSessionHistory(String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional
    public void deleteSession(String sessionId) {
        chatMessageRepository.deleteBySessionId(sessionId);
    }

    /**
     * Returns a list of all sessions for a user, each with sessionId, preview text, and date.
     */
    public List<Map<String, Object>> getUserSessions(Long userId) {
        List<String> sessionIds = chatMessageRepository.findDistinctSessionIdsByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (String sid : sessionIds) {
            List<ChatMessage> msgs = chatMessageRepository.findFirstMessageBySessionId(sid);
            if (msgs.isEmpty()) continue;
            // Find first user message for preview
            String preview = msgs.stream()
                    .filter(m -> m.getRole() == ChatMessage.MessageRole.user)
                    .map(ChatMessage::getContent)
                    .findFirst()
                    .orElse(msgs.get(0).getContent());
            // Truncate preview
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
     * Creates a new session and returns the welcome message from Ollama.
     */
    @Transactional
    public ChatResponse startNewSession(Long userId) {
        String sessionId = UUID.randomUUID().toString();

        // Build a static welcome — no Ollama call, no fake user message saved
        String prenom = contextEnricher.getUserPrenom(userId);
        String welcome = "Bonjour " + prenom + " ! Comment puis-je vous aider aujourd'hui ?";

        saveMessage(userId, sessionId, com.example.monpremiersite.entities.ChatMessage.MessageRole.assistant, welcome, null);

        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setMessage(welcome);
        response.setSuggestions(java.util.List.of(
                "Prendre un rendez-vous",
                "Voir mes dossiers",
                "Poser une question"
        ));
        return response;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ChatResponse parseLlmResponse(String rawContent, String sessionId) {
        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);

        // Extract JSON from the raw content (LLM may include extra text)
        String jsonStr = extractJson(rawContent);

        if (jsonStr == null) {
            response.setMessage(rawContent.isBlank()
                    ? "Je n'ai pas pu traiter votre demande. Veuillez réessayer."
                    : rawContent);
            return response;
        }

        try {
            Map<String, Object> parsed = objectMapper.readValue(jsonStr,
                    new TypeReference<Map<String, Object>>() {});

            String message = getString(parsed, "message", "");
            // Guard: LLM sometimes puts the entire JSON block inside the message field
            if (message.contains("\"message\"") && message.contains("{")) {
                String innerJson = extractJson(message);
                if (innerJson != null) {
                    try {
                        Map<String, Object> inner = objectMapper.readValue(innerJson,
                                new TypeReference<Map<String, Object>>() {});
                        String innerMsg = getString(inner, "message", "");
                        if (!innerMsg.isBlank() && !innerMsg.contains("\"message\"")) {
                            message = innerMsg;
                        }
                    } catch (Exception ignored) {}
                }
                // If still looks like JSON, strip it so user sees a fallback
                if (message.trim().startsWith("{")) {
                    message = "Je n'ai pas pu traiter votre demande. Veuillez réessayer.";
                }
            }
            response.setMessage(message);
            response.setReadyToConfirm(getBoolean(parsed, "ready_to_confirm"));
            response.setAppointmentConfirmed(getBoolean(parsed, "appointment_confirmed"));

            Object suggestionsObj = parsed.get("suggestions");
            if (suggestionsObj instanceof List<?> list) {
                response.setSuggestions(list.stream()
                        .map(Object::toString)
                        .collect(Collectors.toList()));
            }

            Object extractedObj = parsed.get("extracted");
            if (extractedObj instanceof Map<?, ?> extractedMap) {
                Map<String, Object> extracted = new HashMap<>();
                extractedMap.forEach((k, v) -> extracted.put(String.valueOf(k), v));
                response.setExtractedData(extracted);
            }

        } catch (Exception e) {
            // JSON parse failed — show generic message, never expose raw JSON to the user
            response.setMessage("Je n'ai pas pu traiter votre demande. Veuillez réessayer.");
        }

        return response;
    }

    private String extractJson(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher matcher = JSON_PATTERN.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private Long createAppointmentFromExtracted(Long userId, Map<String, Object> extracted) {
        try {
            AppointmentRequestDTO dto = new AppointmentRequestDTO();

            // reason = type_affaire + description
            String typeAffaire = getString(extracted, "type_affaire", "");
            String description = getString(extracted, "description", "");
            dto.reason = typeAffaire.isBlank() ? description
                    : (description.isBlank() ? typeAffaire : typeAffaire + " — " + description);

            // urgency — handles "urgent", "très urgent", "flexible", "normal"
            String urgence = getString(extracted, "urgence", "normal").toLowerCase();
            dto.urgencyLevel = urgence.contains("très") || urgence.contains("tres") ? "TRES_URGENT"
                    : urgence.contains("urgent") ? "URGENT"
                    : "NORMAL";

            // Parse date + time with multiple format fallbacks
            String datePref = getString(extracted, "date_preferee", null);
            String heurePref = getString(extracted, "heure_preferee", null);
            LocalDateTime appointmentDate = parseDateTime(datePref, heurePref);
            dto.dateSouhaitee = appointmentDate != null ? appointmentDate : LocalDateTime.now().plusDays(1);

            // Find avocat from the matching available slot for this day/time
            if (appointmentDate != null) {
                java.time.DayOfWeek dow = appointmentDate.getDayOfWeek();
                LocalDate date = appointmentDate.toLocalDate();
                LocalTime time = appointmentDate.toLocalTime();
                availableSlotRepository.findByActiveTrue().stream()
                        .filter(s -> dow.equals(s.getDayOfWeek())
                                && s.getStartTime() != null && !time.isBefore(s.getStartTime())
                                && s.getEndTime() != null && time.isBefore(s.getEndTime())
                                && (s.getValidFrom() == null || !date.isBefore(s.getValidFrom()))
                                && (s.getValidUntil() == null || !date.isAfter(s.getValidUntil()))
                                && s.getAvocat() != null)
                        .findFirst()
                        .ifPresent(s -> dto.avocatId = s.getAvocat().getIdu());
            }

            return appointmentAgendaService.submitRequest(dto, userId).id;
        } catch (Exception e) {
            return null;
        }
    }

    /** Try to parse date + time string using multiple known formats. */
    private LocalDateTime parseDateTime(String datePref, String heurePref) {
        if (datePref == null || heurePref == null) return null;

        // Normalize time: "9h" → "09:00", "9h30" → "09:30"
        String time = heurePref.trim()
                .replaceAll("(?i)h([0-9]{2})", ":$1")
                .replaceAll("(?i)([0-9]+)h$", "$1:00")
                .replaceAll("^([0-9]):","0$1:");

        String combined = datePref.trim() + " " + time;
        for (DateTimeFormatter fmt : DT_FORMATTERS) {
            try { return LocalDateTime.parse(combined, fmt); }
            catch (DateTimeParseException ignored) {}
        }

        // Fallback: parse date and time separately then combine
        LocalDate date = null;
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try { date = LocalDate.parse(datePref.trim(), fmt); break; }
            catch (DateTimeParseException ignored) {}
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

    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return (val != null && !val.toString().equals("null")) ? val.toString() : defaultValue;
    }

    private boolean getBoolean(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return Boolean.parseBoolean(s);
        return false;
    }
}
