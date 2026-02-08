package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.Payment;
import com.example.monpremiersite.entities.PaymentStatus;
import com.example.monpremiersite.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {
    private final PaymentRepository repository;

    public PaymentService(PaymentRepository repository) {
        this.repository = repository;
    }

    public List<Payment> findAll() {
        return repository.findAll();
    }

    public Optional<Payment> findById(Long id) {
        return repository.findById(id);
    }

    public Payment save(Payment payment) {
        return repository.save(payment);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<Payment> findByClientId(Long clientId) {
        return repository.findByClient_Idu(clientId);
    }

    public List<Payment> findByEmployeeId(Long employeeId) {
        return repository.findByEmployee_Idu(employeeId);
    }

    public List<Payment> findByStatus(PaymentStatus status) {
        return repository.findByStatus(status);
    }
}
