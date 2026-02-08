package com.example.monpremiersite.mapper;

import com.example.monpremiersite.dto.PresenceJournalDTO;
import com.example.monpremiersite.entities.PresenceJournal;
import com.example.monpremiersite.entities.User;

public class PresenceJournalMapper {
    
    public static PresenceJournalDTO toDTO(PresenceJournal entity) {
        PresenceJournalDTO dto = new PresenceJournalDTO();

        // Basic fields
        dto.setId(entity.getId());
        dto.setVisitorName(entity.getVisitorName());
        dto.setVisitorLastname(entity.getVisitorLastname());
        dto.setVisitorCin(entity.getVisitorCin());
        dto.setReason(entity.getReason());
        dto.setArrivalTime(entity.getArrivalTime());

        // Extract User data safely
        if (entity.getRecordedBy() != null) {
            User recordedBy = entity.getRecordedBy();

            // Extract ID
            dto.setRecordedById(recordedBy.getIdu());

            // Extract and concatenate name with null-safety
            String nom = recordedBy.getNom();
            String prenom = recordedBy.getPrenom();
            String fullName = ((nom != null ? nom : "") + " " + (prenom != null ? prenom : "")).trim();

            if (!fullName.isEmpty()) {
                dto.setRecordedByName(fullName);
            }
        }

        return dto;
    }

    public static PresenceJournal toEntity(PresenceJournalDTO dto) {
        PresenceJournal entity = new PresenceJournal();
        entity.setId(dto.getId());
        entity.setVisitorName(dto.getVisitorName());
        entity.setVisitorLastname(dto.getVisitorLastname());
        entity.setVisitorCin(dto.getVisitorCin());
        entity.setReason(dto.getReason());
        entity.setArrivalTime(dto.getArrivalTime());
        // recordedBy is set in controller
        return entity;
    }
}
