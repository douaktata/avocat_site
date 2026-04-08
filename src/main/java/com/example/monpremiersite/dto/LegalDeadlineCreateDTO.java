package com.example.monpremiersite.dto;

import java.time.LocalDate;

public class LegalDeadlineCreateDTO {
    public Long caseId;
    public String type;        // DeadlineType enum name
    public String description;
    public LocalDate deadlineDate;
}
