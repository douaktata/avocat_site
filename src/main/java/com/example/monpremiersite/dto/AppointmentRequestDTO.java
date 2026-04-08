package com.example.monpremiersite.dto;

import java.time.LocalDateTime;

public class AppointmentRequestDTO {
    public Long avocatId;
    public Long caseId;
    public LocalDateTime dateSouhaitee;
    public String reason;
    public String urgencyLevel; // NiveauUrgence enum name
}
