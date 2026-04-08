package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Reminder;
import java.time.LocalDateTime;

public class ReminderDTO {
    public Long id;
    public Long eventId;
    public String eventTitre;
    public Long deadlineId;
    public LocalDateTime reminderDate;
    public String channel;
    public String message;
    public Boolean sent;
    public LocalDateTime sentAt;

    public static ReminderDTO fromEntity(Reminder r) {
        ReminderDTO dto = new ReminderDTO();
        dto.id = r.getId();
        dto.reminderDate = r.getReminderDate();
        dto.channel = r.getChannel() != null ? r.getChannel().name() : null;
        dto.message = r.getMessage();
        dto.sent = r.getSent();
        dto.sentAt = r.getSentAt();
        if (r.getEvenement() != null) {
            dto.eventId = r.getEvenement().getId();
            dto.eventTitre = r.getEvenement().getTitre();
        }
        if (r.getLegalDeadline() != null) {
            dto.deadlineId = r.getLegalDeadline().getId();
        }
        return dto;
    }
}
