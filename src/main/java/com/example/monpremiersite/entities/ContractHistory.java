package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_history")
public class ContractHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private CaseEntity caseEntity;

    @Column(nullable = false)
    private String templateType;

    private String label;

    @Column(columnDefinition = "TEXT")
    private String generatedContent;

    @Column(columnDefinition = "TEXT")
    private String formDataJson;

    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }

    public String getTemplateType() { return templateType; }
    public void setTemplateType(String templateType) { this.templateType = templateType; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getGeneratedContent() { return generatedContent; }
    public void setGeneratedContent(String generatedContent) { this.generatedContent = generatedContent; }

    public String getFormDataJson() { return formDataJson; }
    public void setFormDataJson(String formDataJson) { this.formDataJson = formDataJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
