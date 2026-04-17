package com.example.monpremiersite.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "contract_templates")
public class ContractTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String typeContrat;

    private String description;

    @Column(columnDefinition = "TEXT")
    private String fieldsJson;

    @Column(columnDefinition = "TEXT")
    private String systemPrompt;

    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getTypeContrat() { return typeContrat; }
    public void setTypeContrat(String typeContrat) { this.typeContrat = typeContrat; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFieldsJson() { return fieldsJson; }
    public void setFieldsJson(String fieldsJson) { this.fieldsJson = fieldsJson; }

    public String getSystemPrompt() { return systemPrompt; }
    public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
