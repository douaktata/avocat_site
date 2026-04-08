package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.CasePhaseHistory;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CasePhaseHistoryDTO {

    public Long id;
    public String phase;
    public LocalDate startedDate;
    public LocalDate endedDate;
    public String notes;
    public Long caseId;
    public LocalDateTime createdAt;

    public static CasePhaseHistoryDTO fromEntity(CasePhaseHistory c) {
        CasePhaseHistoryDTO dto = new CasePhaseHistoryDTO();
        dto.id = c.getId();
        dto.phase = c.getPhase() != null ? c.getPhase().name() : null;
        dto.startedDate = c.getStartedDate();
        dto.endedDate = c.getEndedDate();
        dto.notes = c.getNotes();
        if (c.getCaseEntity() != null) {
            dto.caseId = c.getCaseEntity().getIdc();
        }
        dto.createdAt = c.getCreatedAt();
        return dto;
    }
}
