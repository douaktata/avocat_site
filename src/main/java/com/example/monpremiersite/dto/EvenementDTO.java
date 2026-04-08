package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EvenementDTO {
    public Long id;
    public String titre;
    public String description;
    public String type;
    public String priorite;
    public LocalDateTime dateDebut;
    public LocalDateTime dateFin;
    public Boolean allDay;
    public String couleur;
    public String statut;
    public String recurrence;
    public LocalDate recurrenceEndDate;
    public String location;
    public Long avocatId;
    public String avocatNom;
    public String avocatPrenom;
    public Long clientId;
    public String clientNom;
    public String clientPrenom;
    public Long caseId;
    public String caseNumber;
    public Long audienceId;
    public Long appointmentId;
    public Long taskId;
    public LocalDateTime createdAt;

    public static EvenementDTO fromEntity(Evenement e) {
        EvenementDTO dto = new EvenementDTO();
        dto.id = e.getId();
        dto.titre = e.getTitre();
        dto.description = e.getDescription();
        dto.type = e.getType() != null ? e.getType().name() : null;
        dto.priorite = e.getPriorite() != null ? e.getPriorite().name() : null;
        dto.dateDebut = e.getDateDebut();
        dto.dateFin = e.getDateFin();
        dto.allDay = e.getAllDay();
        dto.couleur = e.getCouleur();
        dto.statut = e.getStatut() != null ? e.getStatut().name() : null;
        dto.recurrence = e.getRecurrence() != null ? e.getRecurrence().name() : null;
        dto.recurrenceEndDate = e.getRecurrenceEndDate();
        dto.location = e.getLocation();
        dto.audienceId = e.getAudienceId();
        dto.appointmentId = e.getAppointmentId();
        dto.taskId = e.getTaskId();
        dto.createdAt = e.getCreatedAt();
        if (e.getAvocat() != null) {
            dto.avocatId = e.getAvocat().getIdu();
            dto.avocatNom = e.getAvocat().getNom();
            dto.avocatPrenom = e.getAvocat().getPrenom();
        }
        if (e.getClient() != null) {
            dto.clientId = e.getClient().getIdu();
            dto.clientNom = e.getClient().getNom();
            dto.clientPrenom = e.getClient().getPrenom();
        }
        if (e.getCaseEntity() != null) {
            dto.caseId = e.getCaseEntity().getIdc();
            dto.caseNumber = e.getCaseEntity().getCase_number();
        }
        return dto;
    }
}
