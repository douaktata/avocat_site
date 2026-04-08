package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cases")
public class CaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idc;

    private String case_number;
    private String case_type;
    private String status;
    private String priority;

    @ManyToOne
    @JoinColumn(name = "idu")
    private User user;

    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    // Tribunal & judicial fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tribunal_id")
    private Tribunal tribunal;

    private String courtCaseNumber;

    @Enumerated(EnumType.STRING)
    private CasePhase casePhase = CasePhase.PRE_CONTENTIEUX;

    private String judgeAssigned;
    private LocalDate dateFiledAtTribunal;

    @Column(columnDefinition = "TEXT")
    private String notesJudicial;

    @OneToMany(mappedBy = "legalCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TrustAccount> trustAccounts = new java.util.ArrayList<>();

    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (created_at == null) created_at = now;
        updated_at = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updated_at = LocalDateTime.now();
    }

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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public Tribunal getTribunal() { return tribunal; }
    public void setTribunal(Tribunal tribunal) { this.tribunal = tribunal; }

    public String getCourtCaseNumber() { return courtCaseNumber; }
    public void setCourtCaseNumber(String courtCaseNumber) { this.courtCaseNumber = courtCaseNumber; }

    public CasePhase getCasePhase() { return casePhase; }
    public void setCasePhase(CasePhase casePhase) { this.casePhase = casePhase; }

    public String getJudgeAssigned() { return judgeAssigned; }
    public void setJudgeAssigned(String judgeAssigned) { this.judgeAssigned = judgeAssigned; }

    public LocalDate getDateFiledAtTribunal() { return dateFiledAtTribunal; }
    public void setDateFiledAtTribunal(LocalDate dateFiledAtTribunal) { this.dateFiledAtTribunal = dateFiledAtTribunal; }

    public String getNotesJudicial() { return notesJudicial; }
    public void setNotesJudicial(String notesJudicial) { this.notesJudicial = notesJudicial; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdated_at() { return updated_at; }
    public void setUpdated_at(LocalDateTime updated_at) { this.updated_at = updated_at; }

    public java.util.List<TrustAccount> getTrustAccounts() { return trustAccounts; }
    public void setTrustAccounts(java.util.List<TrustAccount> trustAccounts) { this.trustAccounts = trustAccounts; }
}
