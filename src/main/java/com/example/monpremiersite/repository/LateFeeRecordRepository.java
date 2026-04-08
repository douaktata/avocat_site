package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.LateFeeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LateFeeRecordRepository extends JpaRepository<LateFeeRecord, Long> {

    List<LateFeeRecord> findByInvoice_Id(Long invoiceId);

    boolean existsByInvoice_Id(Long invoiceId);

    // Sum of late fees applied in current month
    @Query("SELECT COALESCE(SUM(CASE WHEN l.overrideAmount IS NOT NULL THEN l.overrideAmount ELSE l.amount END), 0) " +
           "FROM LateFeeRecord l WHERE l.appliedDate >= :from AND l.appliedDate <= :to")
    java.math.BigDecimal sumEffectiveAmountBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
