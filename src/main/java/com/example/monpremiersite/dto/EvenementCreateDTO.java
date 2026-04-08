package com.example.monpremiersite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EvenementCreateDTO {
    public String titre;
    public String description;
    public String type;          // TypeEvenement enum name
    public LocalDateTime dateDebut;
    public LocalDateTime dateFin;
    public Boolean allDay;
    public String location;
    public Long avocatId;
    public Long clientId;
    public Long caseId;
    public String recurrence;    // Recurrence enum name
    public LocalDate recurrenceEndDate;
}
