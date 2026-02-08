package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.PaymentDTO;
import com.example.monpremiersite.entities.Payment;
import com.example.monpremiersite.entities.PaymentStatus;
import com.example.monpremiersite.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping
    public List<PaymentDTO> all() {
        return service.findAll().stream().map(PaymentDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> get(@PathVariable Long id) {
        Optional<Payment> payment = service.findById(id);
        return payment.map(p -> ResponseEntity.ok(PaymentDTO.fromEntity(p))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PaymentDTO create(@RequestBody Payment payment) {
        Payment saved = service.save(payment);
        return PaymentDTO.fromEntity(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> update(@PathVariable Long id, @RequestBody Payment payment) {
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        payment.setId(id);
        Payment updated = service.save(payment);
        return ResponseEntity.ok(PaymentDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    public List<PaymentDTO> findByClient(@PathVariable Long clientId) {
        return service.findByClientId(clientId).stream().map(PaymentDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/employee/{employeeId}")
    public List<PaymentDTO> findByEmployee(@PathVariable Long employeeId) {
        return service.findByEmployeeId(employeeId).stream().map(PaymentDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/status/{status}")
    public List<PaymentDTO> findByStatus(@PathVariable PaymentStatus status) {
        return service.findByStatus(status).stream().map(PaymentDTO::fromEntity).collect(Collectors.toList());
    }
}
