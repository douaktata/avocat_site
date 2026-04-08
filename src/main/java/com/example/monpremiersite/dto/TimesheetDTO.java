package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Timesheet;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class TimesheetDTO {

    public Long id;
    public LocalDate workDate;
    public LocalTime startTime;
    public LocalTime endTime;
    public BigDecimal durationHours;
    public String workCategory;
    public String description;
    public Boolean isBillable;
    public Long caseId;
    public String caseNumber;
    public Long avocatId;
    public String avocatName;
    public LocalDateTime createdAt;

    public static TimesheetDTO fromEntity(Timesheet t) {
        TimesheetDTO dto = new TimesheetDTO();
        dto.id = t.getId();
        dto.workDate = t.getWorkDate();
        dto.startTime = t.getStartTime();
        dto.endTime = t.getEndTime();
        dto.durationHours = t.getDurationHours();
        dto.workCategory = t.getWorkCategory() != null ? t.getWorkCategory().name() : null;
        dto.description = t.getDescription();
        dto.isBillable = t.getIsBillable();

        if (t.getCaseEntity() != null) {
            dto.caseId = t.getCaseEntity().getIdc();
            dto.caseNumber = t.getCaseEntity().getCase_number();
        }

        if (t.getAvocat() != null) {
            dto.avocatId = t.getAvocat().getIdu();
            dto.avocatName = t.getAvocat().getPrenom() + " " + t.getAvocat().getNom();
        }

        dto.createdAt = t.getCreatedAt();
        return dto;
    }
}
