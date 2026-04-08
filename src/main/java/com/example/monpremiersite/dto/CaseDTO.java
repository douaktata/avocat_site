package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.CaseEntity;
import java.time.LocalDateTime;

public class CaseDTO {
    private Long idc;
    private String case_number;
    private String case_type;
    private String status;
    private String priority;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
    private Long client_id;
    private String client_full_name;
    private Long appointment_id;

    // Tribunal & judicial fields
    private Long tribunalId;
    private String tribunalName;
    private String courtCaseNumber;
    private String casePhase;
    private String judgeAssigned;
    private java.time.LocalDate dateFiledAtTribunal;
    private String notesJudicial;

    public CaseDTO() {}

    public CaseDTO(Long idc, String case_number, String case_type, String status, String priority, LocalDateTime created_at, Long client_id, String client_full_name, Long appointment_id) {
        this.idc = idc;
        this.case_number = case_number;
        this.case_type = case_type;
        this.status = status;
        this.priority = priority;
        this.created_at = created_at;
        this.client_id = client_id;
        this.client_full_name = client_full_name;
        this.appointment_id = appointment_id;
    }

    // Getters and Setters
    public Long getIdc() { return idc; }
    public void setIdc(Long idc) { this.idc = idc; }

    public String getCase_number() { return case_number; }
    public void setCase_number(String case_number) { this.case_number = case_number; }

    public String getCase_type() { return case_type; }
    public void setCase_type(String case_type) { this.case_type = case_type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdated_at() { return updated_at; }
    public void setUpdated_at(LocalDateTime updated_at) { this.updated_at = updated_at; }

    public Long getClient_id() { return client_id; }
    public void setClient_id(Long client_id) { this.client_id = client_id; }

    public String getClient_full_name() { return client_full_name; }
    public void setClient_full_name(String client_full_name) { this.client_full_name = client_full_name; }

    public Long getAppointment_id() { return appointment_id; }
    public void setAppointment_id(Long appointment_id) { this.appointment_id = appointment_id; }

    // Conversion method
    public static CaseDTO fromEntity(CaseEntity entity) {
        Long clientId = null;
        String clientFullName = null;
        if (entity.getUser() != null) {
            clientId = entity.getUser().getIdu();
            String nom = entity.getUser().getNom();
            String prenom = entity.getUser().getPrenom();
            clientFullName = ((nom != null ? nom : "") + " " + (prenom != null ? prenom : "")).trim();
        }

        Long appointmentId = null;
        if (entity.getAppointment() != null) {
            appointmentId = entity.getAppointment().getIda();
        }

        CaseDTO dto = new CaseDTO(
            entity.getIdc(),
            entity.getCase_number(),
            entity.getCase_type(),
            entity.getStatus(),
            entity.getPriority(),
            entity.getCreated_at(),
            clientId,
            clientFullName,
            appointmentId
        );
        dto.setUpdated_at(entity.getUpdated_at());

        // Tribunal & judicial fields
        if (entity.getTribunal() != null) {
            dto.tribunalId = entity.getTribunal().getId();
            dto.tribunalName = entity.getTribunal().getName();
        }
        dto.courtCaseNumber = entity.getCourtCaseNumber();
        dto.casePhase = entity.getCasePhase() != null ? entity.getCasePhase().name() : null;
        dto.judgeAssigned = entity.getJudgeAssigned();
        dto.dateFiledAtTribunal = entity.getDateFiledAtTribunal();
        dto.notesJudicial = entity.getNotesJudicial();

        return dto;
    }

    public Long getTribunalId() { return tribunalId; }
    public void setTribunalId(Long tribunalId) { this.tribunalId = tribunalId; }
    public String getTribunalName() { return tribunalName; }
    public void setTribunalName(String tribunalName) { this.tribunalName = tribunalName; }
    public String getCourtCaseNumber() { return courtCaseNumber; }
    public void setCourtCaseNumber(String courtCaseNumber) { this.courtCaseNumber = courtCaseNumber; }
    public String getCasePhase() { return casePhase; }
    public void setCasePhase(String casePhase) { this.casePhase = casePhase; }
    public String getJudgeAssigned() { return judgeAssigned; }
    public void setJudgeAssigned(String judgeAssigned) { this.judgeAssigned = judgeAssigned; }
    public java.time.LocalDate getDateFiledAtTribunal() { return dateFiledAtTribunal; }
    public void setDateFiledAtTribunal(java.time.LocalDate dateFiledAtTribunal) { this.dateFiledAtTribunal = dateFiledAtTribunal; }
    public String getNotesJudicial() { return notesJudicial; }
    public void setNotesJudicial(String notesJudicial) { this.notesJudicial = notesJudicial; }
}
