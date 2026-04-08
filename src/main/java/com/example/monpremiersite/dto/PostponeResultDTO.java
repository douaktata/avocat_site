package com.example.monpremiersite.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PostponeResultDTO {
    public Long newAudienceId;
    public LocalDateTime newHearingDate;
    public List<ImpactedEventDTO> impactedEvents;
    public boolean alertDoubleAudience;
    public int postponeCount;

    public PostponeResultDTO() {}

    public PostponeResultDTO(Long newAudienceId, LocalDateTime newHearingDate,
                             List<ImpactedEventDTO> impactedEvents,
                             boolean alertDoubleAudience, int postponeCount) {
        this.newAudienceId = newAudienceId;
        this.newHearingDate = newHearingDate;
        this.impactedEvents = impactedEvents;
        this.alertDoubleAudience = alertDoubleAudience;
        this.postponeCount = postponeCount;
    }
}
