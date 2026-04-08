package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "evenements")
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeEvenement type;

    @Enumerated(EnumType.STRING)
    private Priorite priorite;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDateTime dateFin;

    @Column(name = "all_day")
    private Boolean allDay = false;

    private String couleur;

    @Enumerated(EnumType.STRING)
    private StatutEvenement statut = StatutEvenement.PLANIFIE;

    @Enumerated(EnumType.STRING)
    private Recurrence recurrence = Recurrence.AUCUNE;

    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate;

    @Column(name = "parent_recurrence_id")
    private Long parentRecurrenceId;

    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avocat_id", nullable = false)
    private User avocat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private CaseEntity caseEntity;

    @Column(name = "audience_id")
    private Long audienceId;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (statut == null) statut = StatutEvenement.PLANIFIE;
        if (recurrence == null) recurrence = Recurrence.AUCUNE;
        if (allDay == null) allDay = false;
        if (couleur == null) couleur = resolveDefaultColor();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private String resolveDefaultColor() {
        if (type == null) return "#6B7280";
        return switch (type) {
            case AUDIENCE -> "#DC2626";
            case ECHEANCE_LEGALE -> "#EA580C";
            case RDV_CLIENT -> "#2563EB";
            case REUNION_INTERNE -> "#CA8A04";
            case TACHE_PERSONNELLE -> "#16A34A";
        };
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TypeEvenement getType() { return type; }
    public void setType(TypeEvenement type) { this.type = type; }

    public Priorite getPriorite() { return priorite; }
    public void setPriorite(Priorite priorite) { this.priorite = priorite; }

    public LocalDateTime getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDateTime dateDebut) { this.dateDebut = dateDebut; }

    public LocalDateTime getDateFin() { return dateFin; }
    public void setDateFin(LocalDateTime dateFin) { this.dateFin = dateFin; }

    public Boolean getAllDay() { return allDay; }
    public void setAllDay(Boolean allDay) { this.allDay = allDay; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }

    public StatutEvenement getStatut() { return statut; }
    public void setStatut(StatutEvenement statut) { this.statut = statut; }

    public Recurrence getRecurrence() { return recurrence; }
    public void setRecurrence(Recurrence recurrence) { this.recurrence = recurrence; }

    public LocalDate getRecurrenceEndDate() { return recurrenceEndDate; }
    public void setRecurrenceEndDate(LocalDate recurrenceEndDate) { this.recurrenceEndDate = recurrenceEndDate; }

    public Long getParentRecurrenceId() { return parentRecurrenceId; }
    public void setParentRecurrenceId(Long parentRecurrenceId) { this.parentRecurrenceId = parentRecurrenceId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public User getAvocat() { return avocat; }
    public void setAvocat(User avocat) { this.avocat = avocat; }

    public User getClient() { return client; }
    public void setClient(User client) { this.client = client; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }

    public Long getAudienceId() { return audienceId; }
    public void setAudienceId(Long audienceId) { this.audienceId = audienceId; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
