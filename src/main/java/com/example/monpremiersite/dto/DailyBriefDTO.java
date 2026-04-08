package com.example.monpremiersite.dto;

import java.time.LocalDate;
import java.util.List;

public class DailyBriefDTO {
    public LocalDate date;
    public List<EvenementDTO> audiencesToday;
    public List<EvenementDTO> appointmentsToday;
    public List<LegalDeadlineDTO> upcomingDeadlines;
    public List<Object> overdueTasks;
    public int totalEvents;

    public DailyBriefDTO() {}
}
