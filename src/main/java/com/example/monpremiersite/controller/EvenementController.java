package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.*;
import com.example.monpremiersite.service.EvenementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/evenements")
public class EvenementController {

    private final EvenementService service;

    public EvenementController(EvenementService service) {
        this.service = service;
    }

    @GetMapping
    public List<EvenementDTO> getAll(
            @RequestParam(required = false) Long avocatId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFin,
            @RequestParam(required = false) String statut) {
        return service.getAll(avocatId, type, dateDebut, dateFin, statut);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementDTO> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EvenementDTO> create(@RequestBody EvenementCreateDTO dto) {
        try {
            return ResponseEntity.ok(service.createEvenement(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvenementDTO> update(@PathVariable Long id,
                                                @RequestBody EvenementUpdateDTO dto) {
        try {
            return ResponseEntity.ok(service.updateEvenement(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteEvenement(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/day/{date}")
    public ResponseEntity<List<EvenementDTO>> getByDay(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long avocatId) {
        return ResponseEntity.ok(service.getByDay(avocatId, date));
    }

    @GetMapping("/week/{date}")
    public ResponseEntity<List<EvenementDTO>> getByWeek(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long avocatId) {
        return ResponseEntity.ok(service.getByWeek(avocatId, date));
    }

    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<EvenementDTO>> getByMonth(
            @PathVariable int year,
            @PathVariable int month,
            @RequestParam Long avocatId) {
        return ResponseEntity.ok(service.getByMonth(avocatId, year, month));
    }

    @GetMapping("/conflicts")
    public ResponseEntity<List<ConflictDTO>> checkConflicts(
            @RequestParam Long avocatId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFin) {
        return ResponseEntity.ok(service.detectConflicts(avocatId, dateDebut, dateFin));
    }

    @GetMapping("/daily-brief")
    public ResponseEntity<DailyBriefDTO> getDailyBrief(@RequestParam Long avocatId) {
        return ResponseEntity.ok(service.getDailyBrief(avocatId));
    }
}
