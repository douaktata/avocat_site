package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatContextEnricher {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AvailableSlotRepository availableSlotRepository;

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
    }

    public String getUserPrenom(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return "Client";
        String prenom = user.getPrenom() != null ? user.getPrenom() : "";
        String nom = user.getNom() != null ? user.getNom() : "";
        return (prenom + " " + nom).trim();
    }

    public String buildSystemPrompt(Long userId) {
        return buildSystemPrompt(userId, false);
    }

    public String buildSystemPrompt(Long userId, boolean isFirstMessage) {
        User user = userRepository.findById(userId).orElse(null);
        String clientPrenom = user != null && user.getPrenom() != null ? user.getPrenom() : "Client";
        String clientNom = user != null && user.getNom() != null ? user.getNom() : "";

        String casesList = buildCasesList(userId);
        String appointmentsList = buildAppointmentsList(userId);
        String unpaidInvoicesList = buildUnpaidInvoicesList(userId);
        String availableSlotsList = buildAvailableSlotsList();

        String salutation = isFirstMessage
                ? "NE salue PAS — le message d'accueil est déjà affiché. Attends la question du client."
                : "Ne dis pas bonjour, ne salue pas. Réponds directement.";

        return "Tu es l'assistant virtuel du cabinet d'avocats JurisHub. Réponds UNIQUEMENT en français.\n\n" +

               "CLIENT : " + clientPrenom + " " + clientNom + "\n\n" +

               "=== DOSSIERS ===\n" + casesList + "\n\n" +
               "=== RENDEZ-VOUS ===\n" + appointmentsList + "\n\n" +
               "=== FACTURES IMPAYÉES ===\n" + unpaidInvoicesList + "\n\n" +
               "=== CRÉNEAUX DISPONIBLES ===\n" + availableSlotsList + "\n\n" +

               "=== FLUX STRICT ===\n" +
               "ÉTAPE 1 — Client demande un RDV → affiche IMMÉDIATEMENT les créneaux ci-dessus en texte, propose 4 suggestions de créneaux.\n" +
               "ÉTAPE 2 — Client choisit date+heure → extrais date_preferee et heure_preferee, demande type d'affaire + description.\n" +
               "ÉTAPE 3 — Tu as type_affaire + description + date_preferee + heure_preferee → ready_to_confirm=true, montre récapitulatif.\n" +
               "ÉTAPE 4 — Client confirme → appointment_confirmed=true.\n\n" +

               "=== RÈGLES ===\n" +
               "- " + salutation + "\n" +
               "- Le champ 'message' est du TEXTE FRANÇAIS UNIQUEMENT. Jamais de JSON, jamais d'accolades { }.\n" +
               "- 'suggestions' = tableau de strings simples, ex: [\"Lundi 06/04 à 09:00\",\"Mardi 07/04 à 10:00\"]. Max 4.\n" +
               "- Questions sur dossier/facture → réponds avec les données exactes.\n" +
               "- Sois concis, max 3 phrases.\n\n" +

               "FORMAT (JSON strict, RIEN avant ni après) :\n" +
               "{\"message\":\"...\",\"extracted\":{\"type_affaire\":null,\"description\":null,\"urgence\":null,\"date_preferee\":null,\"heure_preferee\":null},\"ready_to_confirm\":false,\"appointment_confirmed\":false,\"suggestions\":[]}";
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
     * e.g. ["Mardi 08/04 à 09:00", "Mercredi 09/04 à 14:00", ...]
     */
    public List<String> computeSlotSuggestions() {
        List<String> suggestions = new java.util.ArrayList<>();
        LocalDate today = LocalDate.now();
        List<com.example.monpremiersite.entities.AvailableSlot> allSlots =
                availableSlotRepository.findByActiveTrue();

        if (!allSlots.isEmpty()) {
            java.util.Map<java.time.DayOfWeek, List<com.example.monpremiersite.entities.AvailableSlot>> byDay =
                    allSlots.stream()
                            .filter(s -> s.getDayOfWeek() != null)
                            .collect(Collectors.groupingBy(
                                    com.example.monpremiersite.entities.AvailableSlot::getDayOfWeek));

            for (int i = 1; i <= 30 && suggestions.size() < 4; i++) {
                LocalDate date = today.plusDays(i);
                java.time.DayOfWeek dow = date.getDayOfWeek();
                if (!byDay.containsKey(dow)) continue;

                for (com.example.monpremiersite.entities.AvailableSlot slot : byDay.get(dow)) {
                    if (suggestions.size() >= 4) break;
                    if (slot.getStartTime() == null || slot.getEndTime() == null) continue;
                    if (slot.getValidFrom() != null && date.isBefore(slot.getValidFrom())) continue;
                    if (slot.getValidUntil() != null && date.isAfter(slot.getValidUntil())) continue;
                    int duration = slot.getDefaultDuration() != null ? slot.getDefaultDuration() : 30;
                    java.time.LocalTime current = slot.getStartTime();
                    while (!current.plusMinutes(duration).isAfter(slot.getEndTime()) && suggestions.size() < 4) {
                        suggestions.add(frenchDayName(dow) + " " + date.format(DateTimeFormatter.ofPattern("dd/MM")) + " à " + current.format(DateTimeFormatter.ofPattern("HH:mm")));
                        current = current.plusMinutes(duration);
                    }
                }
            }
        }

        // Fallback: next working days with standard hours
        if (suggestions.isEmpty()) {
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
                java.time.LocalTime t = stdTimes.get(added % stdTimes.size());
                suggestions.add(frenchDayName(date.getDayOfWeek()) + " " + date.format(DateTimeFormatter.ofPattern("dd/MM")) + " à " + t.format(DateTimeFormatter.ofPattern("HH:mm")));
                added++;
            }
        }

        return suggestions;
    }

    private String buildAvailableSlotsList() {
        LocalDate today = LocalDate.now();
        StringBuilder sb = new StringBuilder();

        List<com.example.monpremiersite.entities.AvailableSlot> allSlots =
                availableSlotRepository.findByActiveTrue();

        boolean hasRealSlots = false;

        if (!allSlots.isEmpty()) {
            java.util.Map<java.time.DayOfWeek, List<com.example.monpremiersite.entities.AvailableSlot>> byDay =
                    allSlots.stream()
                            .filter(s -> s.getDayOfWeek() != null)
                            .collect(Collectors.groupingBy(
                                    com.example.monpremiersite.entities.AvailableSlot::getDayOfWeek));

            for (int i = 1; i <= 14; i++) {
                LocalDate date = today.plusDays(i);
                java.time.DayOfWeek dow = date.getDayOfWeek();
                if (!byDay.containsKey(dow)) continue;

                List<String> times = new java.util.ArrayList<>();
                for (com.example.monpremiersite.entities.AvailableSlot slot : byDay.get(dow)) {
                    if (slot.getStartTime() == null || slot.getEndTime() == null) continue;
                    if (slot.getValidFrom() != null && date.isBefore(slot.getValidFrom())) continue;
                    if (slot.getValidUntil() != null && date.isAfter(slot.getValidUntil())) continue;
                    int duration = slot.getDefaultDuration() != null ? slot.getDefaultDuration() : 30;
                    java.time.LocalTime current = slot.getStartTime();
                    while (!current.plusMinutes(duration).isAfter(slot.getEndTime())) {
                        times.add(current.format(DateTimeFormatter.ofPattern("HH:mm")));
                        current = current.plusMinutes(duration);
                    }
                }
                if (!times.isEmpty()) {
                    hasRealSlots = true;
                    sb.append("- ").append(date.format(DATE_FMT))
                      .append(" (").append(frenchDayName(dow)).append(") : ")
                      .append(String.join(", ", times)).append("\n");
                }
            }
        }

        if (hasRealSlots) return sb.toString().trim();

        // Fallback: next 5 working days with standard hours
        sb = new StringBuilder();
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
}
