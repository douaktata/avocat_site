package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Audience;
import java.time.LocalDateTime;

public class AudienceDTO {
    public Long id;
    public Long caseId;
    public String caseNumber;
    public String clientFullName;
    public Long tribunalId;
    public String tribunalName;
    public LocalDateTime hearingDate;
    public String hearingType;
    public String roomNumber;
    public String judgeName;
    public String description;
    public String status;
    public String notes;
    public String postponeReason;
    public LocalDateTime postponedDate;
    public String cancellationReason;
    public LocalDateTime cancelledDate;
    public LocalDateTime createdAt;

    public static AudienceDTO fromEntity(Audience a) {
        AudienceDTO dto = new AudienceDTO();
        dto.id = a.getId();
        dto.hearingDate = a.getHearingDate();
        dto.hearingType = a.getHearingType();
        dto.roomNumber = a.getRoomNumber();
        dto.judgeName = a.getJudgeName();
        dto.description = a.getDescription();
        dto.status = a.getStatus();
        dto.notes = a.getNotes();
        dto.postponeReason = a.getPostponeReason();
        dto.postponedDate = a.getPostponedDate();
        dto.cancellationReason = a.getCancellationReason();
        dto.cancelledDate = a.getCancelledDate();
        dto.createdAt = a.getCreatedAt();
        if (a.getCaseEntity() != null) {
            dto.caseId = a.getCaseEntity().getIdc();
            dto.caseNumber = a.getCaseEntity().getCase_number();
            var u = a.getCaseEntity().getUser();
            if (u != null) {
                dto.clientFullName = ((u.getPrenom() != null ? u.getPrenom() : "") + " " + (u.getNom() != null ? u.getNom() : "")).trim();
            }
        }
        if (a.getTribunal() != null) {
            dto.tribunalId = a.getTribunal().getId();
            dto.tribunalName = a.getTribunal().getName();
        }
        return dto;
    }
}
