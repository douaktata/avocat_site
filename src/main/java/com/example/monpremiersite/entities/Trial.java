package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trial")
public class Trial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idt;

    @ManyToOne
    @JoinColumn(name = "idc")
    private CaseEntity caseEntity;

    private String location;
    private String status;
    private LocalDateTime created_at;

    @ManyToOne
    @JoinColumn(name = "idu")
    private User user;

    private LocalDateTime hearing_date;

    public Long getIdt() { return idt; }
    public void setIdt(Long idt) { this.idt = idt; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getHearing_date() { return hearing_date; }
    public void setHearing_date(LocalDateTime hearing_date) { this.hearing_date = hearing_date; }
}
