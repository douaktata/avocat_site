package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.PresenceJournal;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PresenceJournalDTO {
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("visitorName")
    private String visitorName;
    
    @JsonProperty("visitorLastname")
    private String visitorLastname;
    
    @JsonProperty("visitorCin")
    private String visitorCin;
    
    @JsonProperty("reason")
    private String reason;
    
    @JsonProperty("arrivalTime")
    private LocalDateTime arrivalTime;
    
    @JsonProperty("recordedById")
    private Long recordedById;
    
    @JsonProperty("recordedByName")
    private String recordedByName;

    // Mapper
    public static PresenceJournalDTO fromEntity(PresenceJournal entity) {
        PresenceJournalDTO dto = new PresenceJournalDTO();
        dto.setId(entity.getId());
        dto.setVisitorName(entity.getVisitorName());
        dto.setVisitorLastname(entity.getVisitorLastname());
        dto.setVisitorCin(entity.getVisitorCin());
        dto.setReason(entity.getReason());
        dto.setArrivalTime(entity.getArrivalTime());
        
        if (entity.getRecordedBy() != null) {
            dto.setRecordedById(entity.getRecordedBy().getIdu());
            String nom = entity.getRecordedBy().getNom();
            String prenom = entity.getRecordedBy().getPrenom();
            dto.setRecordedByName(((nom != null ? nom : "") + " " + (prenom != null ? prenom : "")).trim());
        }
        
        return dto;
    }
}
