package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evenement_id")
    private Evenement evenement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_deadline_id")
    private LegalDeadline legalDeadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "reminder_date", nullable = false)
    private LocalDateTime reminderDate;

    @Enumerated(EnumType.STRING)
    private ReminderChannel channel = ReminderChannel.IN_APP;

    @Column(columnDefinition = "TEXT")
    private String message;

    private Boolean sent = false;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (sent == null) sent = false;
        if (channel == null) channel = ReminderChannel.IN_APP;
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Evenement getEvenement() { return evenement; }
    public void setEvenement(Evenement evenement) { this.evenement = evenement; }

    public LegalDeadline getLegalDeadline() { return legalDeadline; }
    public void setLegalDeadline(LegalDeadline legalDeadline) { this.legalDeadline = legalDeadline; }

    public User getRecipient() { return recipient; }
    public void setRecipient(User recipient) { this.recipient = recipient; }

    public LocalDateTime getReminderDate() { return reminderDate; }
    public void setReminderDate(LocalDateTime reminderDate) { this.reminderDate = reminderDate; }

    public ReminderChannel getChannel() { return channel; }
    public void setChannel(ReminderChannel channel) { this.channel = channel; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Boolean getSent() { return sent; }
    public void setSent(Boolean sent) { this.sent = sent; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
