package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.CaseEntity;
import java.time.LocalDateTime;

public class CaseDTO {
    private Long idc;
    private String case_number;
    private String case_type;
    private String status;
    private LocalDateTime created_at;
    private Long client_id;
    private String client_full_name;
    private Long appointment_id;

    public CaseDTO() {}

    public CaseDTO(Long idc, String case_number, String case_type, String status, LocalDateTime created_at, Long client_id, String client_full_name, Long appointment_id) {
        this.idc = idc;
        this.case_number = case_number;
        this.case_type = case_type;
        this.status = status;
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

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

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
            clientFullName = entity.getUser().getNom() + " " + entity.getUser().getPrenom();
        }

        Long appointmentId = null;
        if (entity.getAppointment() != null) {
            appointmentId = entity.getAppointment().getIda();
        }

        return new CaseDTO(
            entity.getIdc(),
            entity.getCase_number(),
            entity.getCase_type(),
            entity.getStatus(),
            entity.getCreated_at(),
            clientId,
            clientFullName,
            appointmentId
        );
    }
}
