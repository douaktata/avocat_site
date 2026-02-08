package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Payment;
import com.example.monpremiersite.entities.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByClient_Idu(Long clientId);
    List<Payment> findByEmployee_Idu(Long employeeId);
    List<Payment> findByStatus(PaymentStatus status);
}
