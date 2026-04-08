package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.TimesheetDTO;
import com.example.monpremiersite.entities.Timesheet;
import com.example.monpremiersite.entities.WorkCategory;
import com.example.monpremiersite.repository.TimesheetRepository;
import com.example.monpremiersite.service.TimesheetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/timesheets")
public class TimesheetController {

    @Autowired
    private TimesheetService timesheetService;

    @Autowired
    private TimesheetRepository timesheetRepository;

    @GetMapping("/case/{caseId}")
    public List<TimesheetDTO> getByCase(@PathVariable Long caseId) {
        return timesheetService.getByCase(caseId);
    }

    @GetMapping("/avocat/{avocatId}")
    public List<TimesheetDTO> getByAvocat(@PathVariable Long avocatId) {
        return timesheetRepository.findByAvocatIdu(avocatId)
                .stream()
                .map(TimesheetDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/case/{caseId}/billable")
    public List<TimesheetDTO> getBillableByCase(@PathVariable Long caseId) {
        return timesheetService.getBillableByCase(caseId);
    }

    @GetMapping("/case/{caseId}/invoice-lines")
    public List<Map<String, Object>> getInvoiceLines(@PathVariable Long caseId) {
        return timesheetService.generateInvoiceLines(caseId);
    }

    @PostMapping
    public TimesheetDTO create(@RequestBody Map<String, Object> body) {
        Long caseId = Long.valueOf(body.get("caseId").toString());
        Long avocatId = Long.valueOf(body.get("avocatId").toString());
        LocalDate workDate = LocalDate.parse(body.get("workDate").toString());
        LocalTime startTime = LocalTime.parse(body.get("startTime").toString());
        LocalTime endTime = LocalTime.parse(body.get("endTime").toString());
        WorkCategory category = WorkCategory.valueOf(body.get("workCategory").toString());
        String description = body.get("description") != null ? body.get("description").toString() : null;
        Boolean isBillable = body.get("isBillable") != null ? (Boolean) body.get("isBillable") : true;
        return timesheetService.logWork(caseId, avocatId, workDate, startTime, endTime, category, description, isBillable);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimesheetDTO> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return timesheetRepository.findById(id).map(timesheet -> {
            if (body.get("description") != null) timesheet.setDescription(body.get("description").toString());
            if (body.get("workCategory") != null) timesheet.setWorkCategory(WorkCategory.valueOf(body.get("workCategory").toString()));
            if (body.get("isBillable") != null) timesheet.setIsBillable((Boolean) body.get("isBillable"));
            if (body.get("workDate") != null) timesheet.setWorkDate(LocalDate.parse(body.get("workDate").toString()));
            if (body.get("startTime") != null) timesheet.setStartTime(LocalTime.parse(body.get("startTime").toString()));
            if (body.get("endTime") != null) timesheet.setEndTime(LocalTime.parse(body.get("endTime").toString()));
            Timesheet saved = timesheetRepository.save(timesheet);
            return ResponseEntity.ok(TimesheetDTO.fromEntity(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        timesheetService.delete(id);
        return ResponseEntity.ok().build();
    }
}
