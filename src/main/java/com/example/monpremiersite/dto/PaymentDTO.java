package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Payment;
import com.example.monpremiersite.entities.PaymentMethod;
import com.example.monpremiersite.entities.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDTO {
    private Long id;
    private BigDecimal amount;
    private LocalDateTime payment_date;
    private PaymentStatus status;
    private PaymentMethod payment_method;
    private String client_name;
    private String case_number;
    private String recorded_by_name;

    public PaymentDTO() {}

    public PaymentDTO(Long id, BigDecimal amount, LocalDateTime payment_date, PaymentStatus status, PaymentMethod payment_method, String client_name, String case_number, String recorded_by_name) {
        this.id = id;
        this.amount = amount;
        this.payment_date = payment_date;
        this.status = status;
        this.payment_method = payment_method;
        this.client_name = client_name;
        this.case_number = case_number;
        this.recorded_by_name = recorded_by_name;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getPayment_date() { return payment_date; }
    public void setPayment_date(LocalDateTime payment_date) { this.payment_date = payment_date; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public PaymentMethod getPayment_method() { return payment_method; }
    public void setPayment_method(PaymentMethod payment_method) { this.payment_method = payment_method; }

    public String getClient_name() { return client_name; }
    public void setClient_name(String client_name) { this.client_name = client_name; }

    public String getCase_number() { return case_number; }
    public void setCase_number(String case_number) { this.case_number = case_number; }

    public String getRecorded_by_name() { return recorded_by_name; }
    public void setRecorded_by_name(String recorded_by_name) { this.recorded_by_name = recorded_by_name; }

    // Mapper
    public static PaymentDTO fromEntity(Payment entity) {
        String clientName = null;
        if (entity.getClient() != null) {
            String nom = entity.getClient().getNom();
            String prenom = entity.getClient().getPrenom();
            clientName = (nom != null ? nom : "") + " " + (prenom != null ? prenom : "");
            clientName = clientName.trim();
        }

        String caseNumber = null;
        if (entity.getCaseEntity() != null) {
            caseNumber = entity.getCaseEntity().getCase_number();
        }

        String recordedByName = null;
        if (entity.getEmployee() != null) {
            String nom = entity.getEmployee().getNom();
            String prenom = entity.getEmployee().getPrenom();
            recordedByName = (nom != null ? nom : "") + " " + (prenom != null ? prenom : "");
            recordedByName = recordedByName.trim();
        }

        return new PaymentDTO(
            entity.getId(),
            entity.getAmount(),
            entity.getPaymentDate(),
            entity.getStatus(),
            entity.getPaymentMethod(),
            clientName,
            caseNumber,
            recordedByName
        );
    }
}
