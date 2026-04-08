package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ida;

    @ManyToOne
    @JoinColumn(name = "idu")
    private User user;

    private LocalDateTime appointment_date;
    private String status;
    private LocalDateTime created_at;
    private String reason;

    // ── Agenda module additions ──────────────────────────────────────────────
    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level")
    private NiveauUrgence urgencyLevel = NiveauUrgence.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_status")
    private RequestStatus requestStatus;

    @Column(name = "proposed_date")
    private LocalDateTime proposedDate;

    @Column(name = "refusal_reason")
    private String refusalReason;

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avocat_id")
    private User avocat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private CaseEntity caseEntity;
    // ────────────────────────────────────────────────────────────────────────

    public Long getIda() { return ida; }
    public void setIda(Long ida) { this.ida = ida; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getAppointment_date() { return appointment_date; }
    public void setAppointment_date(LocalDateTime appointment_date) { this.appointment_date = appointment_date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public NiveauUrgence getUrgencyLevel() { return urgencyLevel; }
    public void setUrgencyLevel(NiveauUrgence urgencyLevel) { this.urgencyLevel = urgencyLevel; }

    public RequestStatus getRequestStatus() { return requestStatus; }
    public void setRequestStatus(RequestStatus requestStatus) { this.requestStatus = requestStatus; }

    public LocalDateTime getProposedDate() { return proposedDate; }
    public void setProposedDate(LocalDateTime proposedDate) { this.proposedDate = proposedDate; }

    public String getRefusalReason() { return refusalReason; }
    public void setRefusalReason(String refusalReason) { this.refusalReason = refusalReason; }

    public Long getProcessedBy() { return processedBy; }
    public void setProcessedBy(Long processedBy) { this.processedBy = processedBy; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public User getAvocat() { return avocat; }
    public void setAvocat(User avocat) { this.avocat = avocat; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }
}
