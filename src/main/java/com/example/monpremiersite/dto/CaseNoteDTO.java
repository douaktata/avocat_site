package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.CaseNote;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class CaseNoteDTO {
    @JsonProperty("idn")
    private Long idn;
    
    @JsonProperty("note")
    private String note;
    
    @JsonProperty("case_id")
    private Long case_id;
    
    @JsonProperty("case_number")
    private String case_number;
    
    @JsonProperty("created_by_name")
    private String created_by_name;
    
    @JsonProperty("created_at")
    private LocalDateTime created_at;

    public CaseNoteDTO() {}

    public CaseNoteDTO(Long idn, String note, Long case_id, String case_number, String created_by_name, LocalDateTime created_at) {
        this.idn = idn;
        this.note = note;
        this.case_id = case_id;
        this.case_number = case_number;
        this.created_by_name = created_by_name;
        this.created_at = created_at;
    }

    // Getters and Setters
    public Long getIdn() { return idn; }
    public void setIdn(Long idn) { this.idn = idn; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Long getCase_id() { return case_id; }
    public void setCase_id(Long case_id) { this.case_id = case_id; }

    public String getCase_number() { return case_number; }
    public void setCase_number(String case_number) { this.case_number = case_number; }

    public String getCreated_by_name() { return created_by_name; }
    public void setCreated_by_name(String created_by_name) { this.created_by_name = created_by_name; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    // Mapper
    public static CaseNoteDTO fromEntity(CaseNote entity) {
        Long caseId = null;
        String caseNumber = null;
        if (entity.getCaseEntity() != null) {
            caseId = entity.getCaseEntity().getIdc();
            caseNumber = entity.getCaseEntity().getCase_number();
        }

        String createdByName = null;
        if (entity.getCreated_by() != null) {
            String nom = entity.getCreated_by().getNom();
            String prenom = entity.getCreated_by().getPrenom();
            createdByName = ((nom != null ? nom : "") + " " + (prenom != null ? prenom : "")).trim();
        }

        return new CaseNoteDTO(
            entity.getIdn(),
            entity.getNote(),
            caseId,
            caseNumber,
            createdByName,
            entity.getCreated_at()
        );
    }
}
