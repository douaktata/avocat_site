package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.TrustDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TrustDepositRepository extends JpaRepository<TrustDeposit, Long> {
    List<TrustDeposit> findByTrustAccount_IdOrderByPaymentDateDesc(Long trustAccountId);
    long countByReceiptNumberStartingWith(String prefix);
}
