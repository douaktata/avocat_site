package com.example.monpremiersite.controller;

import com.example.monpremiersite.entities.Appointment;
import com.example.monpremiersite.dto.AppointmentDTO;
import com.example.monpremiersite.dto.AppointmentMapper;
import com.example.monpremiersite.repository.AppointmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {
    private final AppointmentRepository repo;

    public AppointmentController(AppointmentRepository repo) { this.repo = repo; }

    @GetMapping
    public List<AppointmentDTO> all() {
        return repo.findAll().stream()
                .map(AppointmentMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(appointment -> ResponseEntity.ok(AppointmentMapper.toDTO(appointment)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public AppointmentDTO create(@RequestBody Appointment a) { 
        Appointment saved = repo.save(a);
        return AppointmentMapper.toDTO(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDTO> update(@PathVariable Long id, @RequestBody Appointment a) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        a.setIda(id);
        Appointment updated = repo.save(a);
        return ResponseEntity.ok(AppointmentMapper.toDTO(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }


}
