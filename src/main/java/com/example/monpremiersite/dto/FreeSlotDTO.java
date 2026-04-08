package com.example.monpremiersite.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class FreeSlotDTO {
    public LocalDate date;
    public LocalTime startTime;
    public LocalTime endTime;
    public Long avocatId;

    public FreeSlotDTO(LocalDate date, LocalTime startTime, LocalTime endTime, Long avocatId) {
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.avocatId = avocatId;
    }
}
