package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.*;
import com.example.monpremiersite.service.AudienceAgendaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agenda/audiences")
public class AudienceAgendaController {

    private final AudienceAgendaService service;

    public AudienceAgendaController(AudienceAgendaService service) {
        this.service = service;
    }

    @PostMapping("/{id}/postpone")
    public ResponseEntity<?> postpone(@PathVariable Long id,
                                      @RequestBody AudiencePostponeDTO dto,
                                      @RequestParam(required = false) Long performedBy) {
        try {
            PostponeResultDTO result = service.postponeAudience(id, dto.newDateTime, dto.reason, performedBy);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id,
                                      @RequestBody AudienceCompleteDTO dto) {
        try {
            return ResponseEntity.ok(service.completeAudience(id, dto.result, dto.notes));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/postpone-history")
    public ResponseEntity<List<PostponeHistoryDTO>> getPostponeHistory(@PathVariable Long id) {
        return ResponseEntity.ok(service.getPostponeHistory(id));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<AudienceDTO>> getUpcoming() {
        return ResponseEntity.ok(service.getUpcomingAudiences());
    }
}
