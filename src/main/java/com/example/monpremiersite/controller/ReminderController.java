package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.ReminderDTO;
import com.example.monpremiersite.service.ReminderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService service;

    public ReminderController(ReminderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ReminderDTO>> getMyReminders(@RequestParam Long userId) {
        return ResponseEntity.ok(service.getMyReminders(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ReminderDTO> markAsRead(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.markAsRead(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
