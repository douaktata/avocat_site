package com.example.monpremiersite.dto;

import java.time.LocalDateTime;

public class EvenementUpdateDTO {
    public String titre;
    public String description;
    public LocalDateTime dateDebut;
    public LocalDateTime dateFin;
    public Boolean allDay;
    public String location;
    public String statut;   // StatutEvenement enum name
}
