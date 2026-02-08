package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.PhoneCallDTO;
import com.example.monpremiersite.entities.PhoneCall;
import com.example.monpremiersite.service.PhoneCallService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/phone-calls")
public class PhoneCallController {
    private final PhoneCallService service;

    public PhoneCallController(PhoneCallService service) {
        this.service = service;
    }

    @GetMapping
    public List<PhoneCallDTO> all() {
        return service.findAll().stream().map(PhoneCallDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PhoneCallDTO> get(@PathVariable Long id) {
        Optional<PhoneCall> phoneCall = service.findById(id);
        return phoneCall.map(pc -> ResponseEntity.ok(PhoneCallDTO.fromEntity(pc))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PhoneCallDTO create(@RequestBody PhoneCall phoneCall) {
        if (phoneCall.getCallDate() == null) {
            phoneCall.setCallDate(LocalDateTime.now());
        }
        PhoneCall saved = service.save(phoneCall);
        return PhoneCallDTO.fromEntity(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PhoneCallDTO> update(@PathVariable Long id, @RequestBody PhoneCall phoneCall) {
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        phoneCall.setId(id);
        PhoneCall updated = service.save(phoneCall);
        return ResponseEntity.ok(PhoneCallDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recorded-by/{recordedById}")
    public List<PhoneCallDTO> findByRecordedBy(@PathVariable Long recordedById) {
        return service.findByRecordedById(recordedById).stream().map(PhoneCallDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/caller/{callerName}")
    public List<PhoneCallDTO> findByCallerName(@PathVariable String callerName) {
        return service.findByCallerName(callerName).stream().map(PhoneCallDTO::fromEntity).collect(Collectors.toList());
    }
}
