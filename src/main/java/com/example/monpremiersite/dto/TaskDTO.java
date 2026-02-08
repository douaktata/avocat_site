package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Task;
import com.example.monpremiersite.entities.TaskPriority;
import com.example.monpremiersite.entities.TaskStatus;
import java.time.LocalDateTime;

public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime deadline;
    private TaskStatus status;
    private TaskPriority priority;
    private Long assignedToId;
    private String assignedToName;
    private Long createdById;
    private String createdByName;

    public TaskDTO() {}

    public TaskDTO(Long id, String title, String description, LocalDateTime deadline, TaskStatus status, TaskPriority priority, Long assignedToId, String assignedToName, Long createdById, String createdByName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.status = status;
        this.priority = priority;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.createdById = createdById;
        this.createdByName = createdByName;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    // Mapper
    public static TaskDTO fromEntity(Task entity) {
        Long assignedToId = entity.getAssignedTo() != null ? entity.getAssignedTo().getIdu() : null;
        String assignedToName = null;
        if (entity.getAssignedTo() != null) {
            String nom = entity.getAssignedTo().getNom();
            String prenom = entity.getAssignedTo().getPrenom();
            if (nom == null) {
                assignedToName = "Utilisateur Inconnu";
            } else {
                assignedToName = nom + (prenom != null ? " " + prenom : "");
            }
        }

        Long createdById = entity.getCreatedBy() != null ? entity.getCreatedBy().getIdu() : null;
        String createdByName = null;
        if (entity.getCreatedBy() != null) {
            String nom = entity.getCreatedBy().getNom();
            String prenom = entity.getCreatedBy().getPrenom();
            if (nom == null) {
                createdByName = "Utilisateur Inconnu";
            } else {
                createdByName = nom + (prenom != null ? " " + prenom : "");
            }
        }

        return new TaskDTO(
            entity.getId(),
            entity.getTitle(),
            entity.getDescription(),
            entity.getDeadline(),
            entity.getStatus(),
            entity.getPriority(),
            assignedToId,
            assignedToName,
            createdById,
            createdByName
        );
    }
}
