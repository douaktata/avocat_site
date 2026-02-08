package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "case_notes")
public class CaseNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idn;

    @ManyToOne
    @JoinColumn(name = "idc")
    @JsonIgnore
    private CaseEntity caseEntity;

    @ManyToOne
    @JoinColumn(name = "created_by")
    @JsonIgnore
    private User created_by;

    @Lob
    private String note;

    private LocalDateTime created_at;
    private String sent_by;

    public Long getIdn() { return idn; }
    public void setIdn(Long idn) { this.idn = idn; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }

    public User getCreated_by() { return created_by; }
    public void setCreated_by(User created_by) { this.created_by = created_by; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public String getSent_by() { return sent_by; }
    public void setSent_by(String sent_by) { this.sent_by = sent_by; }
}
