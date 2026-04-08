package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.AppointmentRequestDTO;
import com.example.monpremiersite.dto.AppointmentRequestResponseDTO;
import com.example.monpremiersite.service.AppointmentAgendaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointment-requests")
public class AppointmentRequestController {

    private final AppointmentAgendaService service;

    public AppointmentRequestController(AppointmentAgendaService service) {
        this.service = service;
    }

    /** CLIENT — soumettre une demande */
    @PostMapping
    public ResponseEntity<AppointmentRequestResponseDTO> submit(
            @RequestBody AppointmentRequestDTO dto,
            @RequestParam Long clientId) {
        return ResponseEntity.ok(service.submitRequest(dto, clientId));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentRequestResponseDTO>> getAll(
            @RequestParam(required = false) Long avocatId,
            @RequestParam(required = false) String statut) {
        return ResponseEntity.ok(service.getRequests(avocatId, statut));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<AppointmentRequestResponseDTO>> myRequests(
            @RequestParam Long clientId) {
        return ResponseEntity.ok(service.getMyRequests(clientId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id,
                                     @RequestParam(required = false) Long processedBy) {
        try {
            return ResponseEntity.ok(service.approveRequest(id, processedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id,
                                    @RequestBody Map<String, String> body,
                                    @RequestParam(required = false) Long processedBy) {
        try {
            return ResponseEntity.ok(service.rejectRequest(id, body.get("reason"), processedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/counter")
    public ResponseEntity<?> counterPropose(@PathVariable Long id,
                                            @RequestBody Map<String, String> body,
                                            @RequestParam(required = false) Long processedBy) {
        try {
            LocalDateTime proposed = LocalDateTime.parse(body.get("proposedDate"));
            return ResponseEntity.ok(service.counterPropose(id, proposed, processedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
