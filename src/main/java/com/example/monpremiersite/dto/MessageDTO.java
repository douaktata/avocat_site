package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Message;
import java.time.LocalDateTime;

public class MessageDTO {
    public Long idm;
    public Long sender_id;
    public String sender_prenom;
    public String sender_nom;
    public Long receiver_id;
    public String receiver_prenom;
    public String receiver_nom;
    public String content;
    public LocalDateTime created_at;

    public static MessageDTO fromEntity(Message m) {
        MessageDTO dto = new MessageDTO();
        dto.idm = m.getIdm();
        if (m.getSender() != null) {
            dto.sender_id = m.getSender().getIdu();
            dto.sender_prenom = m.getSender().getPrenom();
            dto.sender_nom = m.getSender().getNom();
        }
        if (m.getReceiver() != null) {
            dto.receiver_id = m.getReceiver().getIdu();
            dto.receiver_prenom = m.getReceiver().getPrenom();
            dto.receiver_nom = m.getReceiver().getNom();
        }
        dto.content = m.getMessage();
        dto.created_at = m.getCreated_at();
        return dto;
    }
}
