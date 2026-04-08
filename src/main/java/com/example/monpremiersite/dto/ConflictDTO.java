package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Evenement;
import java.time.LocalDateTime;

public class ConflictDTO {
    public Long eventId;
    public String titre;
    public String type;
    public LocalDateTime dateDebut;
    public LocalDateTime dateFin;
    public String priorite;
    public String avocatNom;

    public static ConflictDTO fromEntity(Evenement e) {
        ConflictDTO dto = new ConflictDTO();
        dto.eventId = e.getId();
        dto.titre = e.getTitre();
        dto.type = e.getType() != null ? e.getType().name() : null;
        dto.dateDebut = e.getDateDebut();
        dto.dateFin = e.getDateFin();
        dto.priorite = e.getPriorite() != null ? e.getPriorite().name() : null;
        if (e.getAvocat() != null) {
            dto.avocatNom = e.getAvocat().getNom() + " " + e.getAvocat().getPrenom();
        }
        return dto;
    }
}
