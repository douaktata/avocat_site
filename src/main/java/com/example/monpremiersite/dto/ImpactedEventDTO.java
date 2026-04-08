package com.example.monpremiersite.dto;

public class ImpactedEventDTO {
    public Long eventId;
    public String titre;
    public String type;
    public String oldStatus;
    public String newStatus;
    public String clientNom;

    public ImpactedEventDTO() {}

    public ImpactedEventDTO(Long eventId, String titre, String type,
                            String oldStatus, String newStatus, String clientNom) {
        this.eventId = eventId;
        this.titre = titre;
        this.type = type;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.clientNom = clientNom;
    }
}
