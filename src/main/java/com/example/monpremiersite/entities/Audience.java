package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audiences")
public class Audience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idc")
    private CaseEntity caseEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tribunal_id")
    private Tribunal tribunal;

    private LocalDateTime hearingDate;

    private String hearingType; // CONSULTATION, HEARING, APPEL, MEDIATION, AUTRE

    private String roomNumber;

    private String judgeName;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED, POSTPONED, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "postpone_reason", columnDefinition = "TEXT")
    private String postponeReason;

    @Column(name = "postponed_date")
    private LocalDateTime postponedDate;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancelled_date")
    private LocalDateTime cancelledDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ── Agenda module additions ──────────────────────────────────────────────
    @Column(name = "original_hearing_date")
    private LocalDateTime originalHearingDate;

    @Column(name = "postpone_count", columnDefinition = "INT DEFAULT 0")
    private Integer postponeCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_audience_id")
    private Audience previousAudience;

    @Column(name = "required_documents", columnDefinition = "TEXT")
    private String requiredDocuments;
    // ────────────────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "SCHEDULED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }

    public Tribunal getTribunal() { return tribunal; }
    public void setTribunal(Tribunal tribunal) { this.tribunal = tribunal; }

    public LocalDateTime getHearingDate() { return hearingDate; }
    public void setHearingDate(LocalDateTime hearingDate) { this.hearingDate = hearingDate; }

    public String getHearingType() { return hearingType; }
    public void setHearingType(String hearingType) { this.hearingType = hearingType; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getJudgeName() { return judgeName; }
    public void setJudgeName(String judgeName) { this.judgeName = judgeName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPostponeReason() { return postponeReason; }
    public void setPostponeReason(String postponeReason) { this.postponeReason = postponeReason; }

    public LocalDateTime getPostponedDate() { return postponedDate; }
    public void setPostponedDate(LocalDateTime postponedDate) { this.postponedDate = postponedDate; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getCancelledDate() { return cancelledDate; }
    public void setCancelledDate(LocalDateTime cancelledDate) { this.cancelledDate = cancelledDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getOriginalHearingDate() { return originalHearingDate; }
    public void setOriginalHearingDate(LocalDateTime originalHearingDate) { this.originalHearingDate = originalHearingDate; }

    public Integer getPostponeCount() { return postponeCount; }
    public void setPostponeCount(Integer postponeCount) { this.postponeCount = postponeCount; }

    public Audience getPreviousAudience() { return previousAudience; }
    public void setPreviousAudience(Audience previousAudience) { this.previousAudience = previousAudience; }

    public String getRequiredDocuments() { return requiredDocuments; }
    public void setRequiredDocuments(String requiredDocuments) { this.requiredDocuments = requiredDocuments; }
}
