package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.EmailTemplate;
import com.example.monpremiersite.entities.ReminderTemplateType;
import java.time.LocalDateTime;

public class EmailTemplateDTO {

    private Long id;
    private String name;
    private String subject;
    private String body;
    private ReminderTemplateType type;
    private Long createdById;
    private String createdByName;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public EmailTemplateDTO() {}

    public static EmailTemplateDTO fromEntity(EmailTemplate t) {
        EmailTemplateDTO dto = new EmailTemplateDTO();
        dto.id = t.getId();
        dto.name = t.getName();
        dto.subject = t.getSubject();
        dto.body = t.getBody();
        dto.type = t.getType();
        if (t.getCreatedBy() != null) {
            dto.createdById = t.getCreatedBy().getIdu();
            String n = (t.getCreatedBy().getNom() != null ? t.getCreatedBy().getNom() : "")
                     + " " + (t.getCreatedBy().getPrenom() != null ? t.getCreatedBy().getPrenom() : "");
            dto.createdByName = n.trim();
        }
        dto.isActive = t.getIsActive();
        dto.createdAt = t.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public ReminderTemplateType getType() { return type; }
    public void setType(ReminderTemplateType type) { this.type = type; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
