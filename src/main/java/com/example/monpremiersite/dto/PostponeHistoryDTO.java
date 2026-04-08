package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.PostponeHistory;
import java.time.LocalDateTime;

public class PostponeHistoryDTO {
    public Long id;
    public Long audienceId;
    public LocalDateTime dateBefore;
    public LocalDateTime dateAfter;
    public String reason;
    public String performedByName;
    public String impactedEvents; // JSON string
    public LocalDateTime createdAt;

    public static PostponeHistoryDTO fromEntity(PostponeHistory ph) {
        PostponeHistoryDTO dto = new PostponeHistoryDTO();
        dto.id = ph.getId();
        dto.dateBefore = ph.getDateBefore();
        dto.dateAfter = ph.getDateAfter();
        dto.reason = ph.getReason();
        dto.impactedEvents = ph.getImpactedEvents();
        dto.createdAt = ph.getCreatedAt();
        if (ph.getAudience() != null) dto.audienceId = ph.getAudience().getId();
        if (ph.getPerformedBy() != null)
            dto.performedByName = ph.getPerformedBy().getPrenom() + " " + ph.getPerformedBy().getNom();
        return dto;
    }
}
