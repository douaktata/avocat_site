package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.TimesheetDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.TimesheetRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimesheetService {

    @Autowired
    private TimesheetRepository timesheetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseRepository caseRepository;

    public TimesheetDTO logWork(Long caseId, Long avocatId, LocalDate workDate,
                                 LocalTime startTime, LocalTime endTime,
                                 WorkCategory category, String description,
                                 Boolean isBillable) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found: " + caseId));
        User avocat = userRepository.findById(avocatId)
                .orElseThrow(() -> new RuntimeException("Avocat not found: " + avocatId));

        long minutes = ChronoUnit.MINUTES.between(startTime, endTime);
        BigDecimal durationHours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        Timesheet timesheet = new Timesheet();
        timesheet.setWorkDate(workDate);
        timesheet.setStartTime(startTime);
        timesheet.setEndTime(endTime);
        timesheet.setDurationHours(durationHours);
        timesheet.setWorkCategory(category);
        timesheet.setDescription(description);
        timesheet.setIsBillable(isBillable != null ? isBillable : true);
        timesheet.setCaseEntity(caseEntity);
        timesheet.setAvocat(avocat);

        Timesheet saved = timesheetRepository.save(timesheet);
        return TimesheetDTO.fromEntity(saved);
    }

    public List<TimesheetDTO> getByCase(Long caseId) {
        return timesheetRepository.findByCaseEntityIdc(caseId)
                .stream()
                .map(TimesheetDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<TimesheetDTO> getBillableByCase(Long caseId) {
        return timesheetRepository.findByCaseEntityIdcAndIsBillableTrue(caseId)
                .stream()
                .map(TimesheetDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public void delete(Long id) {
        timesheetRepository.deleteById(id);
    }

    public List<Map<String, Object>> generateInvoiceLines(Long caseId) {
        List<Timesheet> billable = timesheetRepository.findByCaseEntityIdcAndIsBillableTrue(caseId);

        Map<WorkCategory, BigDecimal> hoursByCategory = new LinkedHashMap<>();
        for (Timesheet t : billable) {
            if (t.getWorkCategory() == null || t.getDurationHours() == null) continue;
            hoursByCategory.merge(t.getWorkCategory(), t.getDurationHours(), BigDecimal::add);
        }

        List<Map<String, Object>> lines = new ArrayList<>();
        for (Map.Entry<WorkCategory, BigDecimal> entry : hoursByCategory.entrySet()) {
            WorkCategory cat = entry.getKey();
            BigDecimal totalHours = entry.getValue();
            BigDecimal hourlyRate = cat == WorkCategory.AUDIENCE
                    ? BigDecimal.valueOf(200)
                    : BigDecimal.valueOf(150);
            BigDecimal amount = totalHours.multiply(hourlyRate).setScale(2, RoundingMode.HALF_UP);

            Map<String, Object> line = new LinkedHashMap<>();
            line.put("category", cat.name());
            line.put("totalHours", totalHours);
            line.put("hourlyRate", hourlyRate);
            line.put("amount", amount);
            line.put("description", cat.name());
            lines.add(line);
        }
        return lines;
    }
}
