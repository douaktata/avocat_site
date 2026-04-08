package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.EvenementDTO;
import com.example.monpremiersite.service.SharedAgendaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shared-agenda")
public class SharedAgendaController {

    private final SharedAgendaService service;

    public SharedAgendaController(SharedAgendaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<Long, List<EvenementDTO>>> getAllLawyersAgenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getAllLawyersAgenda(date));
    }

    @PutMapping("/reassign")
    public ResponseEntity<?> reassign(@RequestBody Map<String, Long> body) {
        try {
            Long eventId = body.get("eventId");
            Long newAvocatId = body.get("newAvocatId");
            return ResponseEntity.ok(service.reassignEvent(eventId, newAvocatId));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
