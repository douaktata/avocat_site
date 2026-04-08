package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.AvailableSlot;
import java.time.LocalDate;
import java.time.LocalTime;

public class AvailableSlotDTO {
    public Long id;
    public Long avocatId;
    public String avocatNom;
    public String dayOfWeek;
    public LocalTime startTime;
    public LocalTime endTime;
    public Integer defaultDuration;
    public Boolean active;
    public LocalDate validFrom;
    public LocalDate validUntil;

    public static AvailableSlotDTO fromEntity(AvailableSlot s) {
        AvailableSlotDTO dto = new AvailableSlotDTO();
        dto.id = s.getId();
        dto.dayOfWeek = s.getDayOfWeek() != null ? s.getDayOfWeek().name() : null;
        dto.startTime = s.getStartTime();
        dto.endTime = s.getEndTime();
        dto.defaultDuration = s.getDefaultDuration();
        dto.active = s.getActive();
        dto.validFrom = s.getValidFrom();
        dto.validUntil = s.getValidUntil();
        if (s.getAvocat() != null) {
            dto.avocatId = s.getAvocat().getIdu();
            dto.avocatNom = s.getAvocat().getPrenom() + " " + s.getAvocat().getNom();
        }
        return dto;
    }
}
