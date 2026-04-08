package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "postpone_history")
public class PostponeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audience_id", nullable = false)
    private Audience audience;

    @Column(name = "date_before")
    private LocalDateTime dateBefore;

    @Column(name = "date_after")
    private LocalDateTime dateAfter;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "impacted_events", columnDefinition = "TEXT")
    private String impactedEvents; // JSON: [{eventId, title, type, oldStatus, newStatus}]

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Audience getAudience() { return audience; }
    public void setAudience(Audience audience) { this.audience = audience; }

    public LocalDateTime getDateBefore() { return dateBefore; }
    public void setDateBefore(LocalDateTime dateBefore) { this.dateBefore = dateBefore; }

    public LocalDateTime getDateAfter() { return dateAfter; }
    public void setDateAfter(LocalDateTime dateAfter) { this.dateAfter = dateAfter; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getPerformedBy() { return performedBy; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }

    public String getImpactedEvents() { return impactedEvents; }
    public void setImpactedEvents(String impactedEvents) { this.impactedEvents = impactedEvents; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
