package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Trial;
import java.time.LocalDateTime;

public class TrialDTO {
    private Long idt;
    private String location;
    private String status;
    private Long case_id;
    private String case_number;
    private LocalDateTime hearing_date;
    private String assigned_lawyer_name;

    public TrialDTO() {}

    public TrialDTO(Long idt, String location, String status, Long case_id, String case_number, LocalDateTime hearing_date, String assigned_lawyer_name) {
        this.idt = idt;
        this.location = location;
        this.status = status;
        this.case_id = case_id;
        this.case_number = case_number;
        this.hearing_date = hearing_date;
        this.assigned_lawyer_name = assigned_lawyer_name;
    }

    // Getters and Setters
    public Long getIdt() { return idt; }
    public void setIdt(Long idt) { this.idt = idt; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getCase_id() { return case_id; }
    public void setCase_id(Long case_id) { this.case_id = case_id; }

    public String getCase_number() { return case_number; }
    public void setCase_number(String case_number) { this.case_number = case_number; }

    public LocalDateTime getHearing_date() { return hearing_date; }
    public void setHearing_date(LocalDateTime hearing_date) { this.hearing_date = hearing_date; }

    public String getAssigned_lawyer_name() { return assigned_lawyer_name; }
    public void setAssigned_lawyer_name(String assigned_lawyer_name) { this.assigned_lawyer_name = assigned_lawyer_name; }

    // Mapper
    public static TrialDTO fromEntity(Trial entity) {
        Long caseId = null;
        String caseNumber = null;
        if (entity.getCaseEntity() != null) {
            caseId = entity.getCaseEntity().getIdc();
            caseNumber = entity.getCaseEntity().getCase_number();
        }

        String assignedLawyerName = null;
        if (entity.getUser() != null) {
            String prenom = entity.getUser().getPrenom();
            if (prenom != null) {
                assignedLawyerName = "Me " + prenom;
            } else {
                String nom = entity.getUser().getNom();
                assignedLawyerName = nom != null ? "Me " + nom : "Utilisateur Inconnu";
            }
        }

        return new TrialDTO(
            entity.getIdt(),
            entity.getLocation(),
            entity.getStatus(),
            caseId,
            caseNumber,
            entity.getHearing_date(),
            assignedLawyerName
        );
    }
}
