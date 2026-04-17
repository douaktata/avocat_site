package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.FreeSlotDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatContextEnricher {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter SHORT_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM");

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AvailableSlotRepository availableSlotRepository;
    private final AppointmentAgendaService appointmentAgendaService;

    public ChatContextEnricher(UserRepository userRepository,
                                CaseRepository caseRepository,
                                AppointmentRepository appointmentRepository,
                                InvoiceRepository invoiceRepository,
                                AppointmentAgendaService appointmentAgendaService,
                                AvailableSlotRepository availableSlotRepository) {
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
        this.appointmentRepository = appointmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.availableSlotRepository = availableSlotRepository;
        this.appointmentAgendaService = appointmentAgendaService;
    }

    public String getUserPrenom(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return "Client";
        String prenom = user.getPrenom() != null ? user.getPrenom() : "";
        String nom = user.getNom() != null ? user.getNom() : "";
        return (prenom + " " + nom).trim();
    }

    public String buildSystemPrompt(Long userId) {
        return buildSystemPrompt(userId, false, Map.of());
    }

    public String buildSystemPrompt(Long userId, boolean isFirstMessage) {
        return buildSystemPrompt(userId, isFirstMessage, Map.of());
    }

    public String buildSystemPrompt(Long userId, boolean isFirstMessage, Map<String, String> detectedSlot) {
        User user = userRepository.findById(userId).orElse(null);
        String clientPrenom = user != null && user.getPrenom() != null ? user.getPrenom() : "Client";
        String clientNom    = user != null && user.getNom()    != null ? user.getNom()    : "";

        String todayFormatted = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String casesList         = buildCasesList(userId);
        String appointmentsList  = buildAppointmentsList(userId);
        String unpaidInvoicesList = buildUnpaidInvoicesList(userId);
        String availableSlotsList = buildAvailableSlotsList();

        String salutationRule = isFirstMessage
                ? "NE salue PAS — le message de bienvenue est déjà affiché. Attends la question du client."
                : "Ne répète pas le bonjour. Réponds directement.";

        String slotHint = "";
        if (detectedSlot != null && !detectedSlot.isEmpty()) {
            slotHint = "\nATTENTION : Le client vient de choisir le créneau suivant (déjà rempli dans 'extracted') :\n" +
                       "  date_preferee=" + detectedSlot.get("date_preferee") +
                       ", heure_preferee=" + detectedSlot.get("heure_preferee") + "\n" +
                       "Ne propose PAS d'autres créneaux. Demande uniquement ce qui manque encore.\n";
        }

        return "Tu es l'assistant virtuel intelligent du cabinet d'avocats JurisHub. " +
               "Tu parles UNIQUEMENT en français. Tu es professionnel, chaleureux et efficace.\n\n" +

               "=== DATE D'AUJOURD'HUI ===\n" +
               todayFormatted + "\n" +
               "Utilise cette date pour calculer 'demain', 'lundi prochain', 'après-demain', etc.\n\n" +

               "=== CLIENT CONNECTÉ ===\n" +
               "Nom : " + clientPrenom + " " + clientNom + "\n" +
               "Dossiers en cours : " + casesList + "\n" +
               "Prochains RDV : " + appointmentsList + "\n" +
               "Factures impayées : " + unpaidInvoicesList + "\n\n" +

               "=== CRÉNEAUX DISPONIBLES ===\n" +
               availableSlotsList + "\n" +
               slotHint + "\n" +

               "=== TYPES D'AFFAIRES RECONNUS ===\n" +
               "- Divorce (divorce, séparation, garde des enfants, pension alimentaire, partage des biens)\n" +
               "- Pénal (infraction, plainte, garde à vue, délit, crime, fraude, vol, agression)\n" +
               "- Droit du travail (licenciement, contrat de travail, employeur, salaire, harcèlement, prud'hommes)\n" +
               "- Droit immobilier (loyer, bail, propriétaire, locataire, expulsion, copropriété)\n" +
               "- Droit des affaires (entreprise, société, litige commercial, contrat commercial, faillite)\n" +
               "- Droit de la famille (mariage, succession, héritage, adoption, filiation)\n" +
               "- Droit administratif (administration, permis, urbanisme, fonction publique)\n" +
               "- Civil (autres litiges civils)\n" +
               "- Autre (si aucune catégorie ne correspond)\n\n" +

               "=== RÈGLES STRICTES ===\n" +
               "1. EXTRACTION INTELLIGENTE : dès le premier message, extrait TOUT ce que le client a mentionné.\n" +
               "   Ex : 'je veux un RDV lundi à 11h pour mon divorce'\n" +
               "   → type_affaire=Divorce, date_preferee=lundi prochain en dd/MM/yyyy, heure_preferee=11:00, description=Consultation divorce\n\n" +
               "2. NE REDEMANDE JAMAIS une information déjà donnée dans la conversation.\n\n" +
               "3. Si des infos manquent, pose UNE seule question pour obtenir les infos manquantes.\n\n" +
               "4. Quand tu as les 4 champs (type_affaire + description + date_preferee + heure_preferee) :\n" +
               "   → mets ready_to_confirm=true et propose un récapitulatif clair.\n\n" +
               "5. Propose MAXIMUM 4 créneaux dans 'suggestions' quand le client n'a pas précisé de date.\n" +
               "   Format exact des créneaux : 'Lundi 14/04 à 09:00' (pour que le frontend les affiche comme boutons).\n\n" +
               "6. Calculs de dates :\n" +
               "   'demain' = " + LocalDate.now().plusDays(1).format(DATE_FMT) + "\n" +
               "   'après-demain' = " + LocalDate.now().plusDays(2).format(DATE_FMT) + "\n" +
               "   'lundi' = prochain lundi après aujourd'hui (calcule à partir de " + todayFormatted + ")\n\n" +
               "7. Urgence : détecte 'urgent', 'urgence', 'pressé', 'rapidement', 'au plus vite', 'immédiatement' → urgence=true.\n\n" +
               "8. appointment_confirmed doit TOUJOURS être false — c'est le backend qui gère la confirmation.\n\n" +
               "9. " + salutationRule + "\n\n" +
               "10. Dans 'message' : texte naturel en français UNIQUEMENT. Jamais de JSON, jamais d'accolades.\n\n" +

               "=== EXEMPLES DE COMPRÉHENSION ===\n" +
               "  'rdv lundi 11h divorce'         → Divorce, " + nextMondayStr() + " 11:00, desc=Consultation divorce\n" +
               "  'problème propriétaire urgent'  → Droit immobilier, urgence=true, desc=Litige propriétaire\n" +
               "  'licenciement abusif demain 14h' → Droit du travail, " + LocalDate.now().plusDays(1).format(DATE_FMT) + " 14:00\n" +
               "  'consulter mon dossier'          → Regarder les dossiers en cours du client, demander lequel si plusieurs\n" +
               "  'bonjour'                        → Saluer par le prénom et demander comment aider\n";
    }

    private String buildCasesList(Long userId) {
        List<CaseEntity> cases = caseRepository.findByUser_Idu(userId);
        if (cases.isEmpty()) return "Aucun dossier en cours.";
        return cases.stream()
                .map(c -> "- Dossier n°" + c.getCase_number()
                        + " (" + c.getCase_type() + ")"
                        + " - Statut : " + c.getStatus())
                .collect(Collectors.joining("\n"));
    }

    private String buildAppointmentsList(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Appointment> appointments = appointmentRepository
                .findByUser_IduAndAppointment_dateBetween(userId, now, now.plusMonths(3));
        if (appointments.isEmpty()) return "Aucun rendez-vous à venir.";
        return appointments.stream()
                .map(a -> "- " + (a.getAppointment_date() != null
                        ? a.getAppointment_date().format(DATETIME_FMT) : "Date inconnue")
                        + " : " + (a.getReason() != null ? a.getReason() : "RDV")
                        + " (" + (a.getRequestStatus() != null ? a.getRequestStatus().name() : a.getStatus()) + ")")
                .collect(Collectors.joining("\n"));
    }

    private String buildUnpaidInvoicesList(Long userId) {
        List<Invoice> invoices = invoiceRepository.findByClient_Idu(userId);
        List<Invoice> unpaid = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.ISSUED || i.getStatus() == InvoiceStatus.PARTIAL)
                .toList();
        if (unpaid.isEmpty()) return "Aucune facture impayée.";
        return unpaid.stream()
                .map(i -> "- Facture " + i.getInvoiceNumber()
                        + " : " + i.getAmountTTC() + " TND"
                        + (i.getDueDate() != null ? " (échéance : " + i.getDueDate().format(DATE_FMT) + ")" : ""))
                .collect(Collectors.joining("\n"));
    }

    /**
     * Returns up to 4 pre-formatted slot suggestion strings from real DB data,
     * checking against existing appointments so only truly free slots are shown.
     * e.g. ["Mardi 08/04 à 09:00", "Mercredi 09/04 à 14:00", ...]
     */
    public List<String> computeSlotSuggestions() {
        List<String> suggestions = new ArrayList<>();
        LocalDate today = LocalDate.now();

        Set<Long> avocatIds = getActiveAvocatIds();
        if (avocatIds.isEmpty()) return fallbackSuggestions();

        for (int i = 1; i <= 30 && suggestions.size() < 4; i++) {
            LocalDate date = today.plusDays(i);
            for (Long avocatId : avocatIds) {
                if (suggestions.size() >= 4) break;
                List<FreeSlotDTO> freeSlots = appointmentAgendaService.getAvailableSlots(avocatId, date);
                for (FreeSlotDTO slot : freeSlots) {
                    if (suggestions.size() >= 4) break;
                    suggestions.add(frenchDayName(date.getDayOfWeek())
                            + " " + date.format(SHORT_DATE_FMT)
                            + " à " + slot.startTime.format(TIME_FMT));
                }
            }
        }

        return suggestions.isEmpty() ? fallbackSuggestions() : suggestions;
    }

    private String buildAvailableSlotsList() {
        LocalDate today = LocalDate.now();
        StringBuilder sb = new StringBuilder();

        Set<Long> avocatIds = getActiveAvocatIds();
        if (avocatIds.isEmpty()) return fallbackSlotsList();

        boolean hasRealSlots = false;
        for (int i = 1; i <= 14; i++) {
            LocalDate date = today.plusDays(i);
            // Collect all free times for this day across all avocats (deduplicated)
            TreeSet<String> times = new TreeSet<>();
            for (Long avocatId : avocatIds) {
                for (FreeSlotDTO slot : appointmentAgendaService.getAvailableSlots(avocatId, date)) {
                    times.add(slot.startTime.format(TIME_FMT));
                }
            }
            if (!times.isEmpty()) {
                hasRealSlots = true;
                sb.append("- ").append(date.format(DATE_FMT))
                  .append(" (").append(frenchDayName(date.getDayOfWeek())).append(") : ")
                  .append(String.join(", ", times)).append("\n");
            }
        }

        return hasRealSlots ? sb.toString().trim() : fallbackSlotsList();
    }

    /** IDs of avocats who have at least one active slot template. */
    private Set<Long> getActiveAvocatIds() {
        return availableSlotRepository.findByActiveTrue().stream()
                .filter(s -> s.getAvocat() != null)
                .map(s -> s.getAvocat().getIdu())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<String> fallbackSuggestions() {
        List<String> suggestions = new ArrayList<>();
        LocalDate today = LocalDate.now();
        List<java.time.LocalTime> stdTimes = List.of(
                java.time.LocalTime.of(9, 0),
                java.time.LocalTime.of(10, 0),
                java.time.LocalTime.of(14, 0),
                java.time.LocalTime.of(15, 0));
        int added = 0;
        for (int i = 1; added < 4; i++) {
            LocalDate date = today.plusDays(i);
            if (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY ||
                date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) continue;
            suggestions.add(frenchDayName(date.getDayOfWeek())
                    + " " + date.format(SHORT_DATE_FMT)
                    + " à " + stdTimes.get(added % stdTimes.size()).format(TIME_FMT));
            added++;
        }
        return suggestions;
    }

    private String fallbackSlotsList() {
        StringBuilder sb = new StringBuilder();
        LocalDate today = LocalDate.now();
        int added = 0;
        for (int i = 1; added < 5; i++) {
            LocalDate date = today.plusDays(i);
            if (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY ||
                date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) continue;
            sb.append("- ").append(date.format(DATE_FMT))
              .append(" (").append(frenchDayName(date.getDayOfWeek())).append(") : ")
              .append("09:00, 10:00, 11:00, 14:00, 15:00, 16:00\n");
            added++;
        }
        return sb.toString().trim();
    }

    private String frenchDayName(java.time.DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "Lundi";
            case TUESDAY -> "Mardi";
            case WEDNESDAY -> "Mercredi";
            case THURSDAY -> "Jeudi";
            case FRIDAY -> "Vendredi";
            case SATURDAY -> "Samedi";
            case SUNDAY -> "Dimanche";
        };
    }

    /** Retourne la date du prochain lundi en dd/MM/yyyy — utilisé dans le system prompt. */
    private String nextMondayStr() {
        LocalDate d = LocalDate.now().plusDays(1);
        while (d.getDayOfWeek() != java.time.DayOfWeek.MONDAY) d = d.plusDays(1);
        return d.format(DATE_FMT);
    }
}
