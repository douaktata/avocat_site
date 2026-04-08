package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.AvailableSlotDTO;
import com.example.monpremiersite.dto.FreeSlotDTO;
import com.example.monpremiersite.service.AppointmentAgendaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class AvailableSlotController {

    private final AppointmentAgendaService service;

    public AvailableSlotController(AppointmentAgendaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AvailableSlotDTO>> getMySlots(@RequestParam Long avocatId) {
        return ResponseEntity.ok(service.getMySlots(avocatId));
    }

    @PostMapping
    public ResponseEntity<AvailableSlotDTO> create(@RequestBody AvailableSlotDTO dto) {
        return ResponseEntity.ok(service.createSlot(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AvailableSlotDTO> update(@PathVariable Long id,
                                                    @RequestBody AvailableSlotDTO dto) {
        try {
            return ResponseEntity.ok(service.updateSlot(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/available")
    public ResponseEntity<List<FreeSlotDTO>> getAvailable(
            @RequestParam Long avocatId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getAvailableSlots(avocatId, date));
    }
}
