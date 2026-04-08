package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.AvailableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface AvailableSlotRepository extends JpaRepository<AvailableSlot, Long> {
    List<AvailableSlot> findByAvocatIduAndActiveTrue(Long avocatId);
    List<AvailableSlot> findByAvocatIduAndDayOfWeek(Long avocatId, DayOfWeek dayOfWeek);
    List<AvailableSlot> findByActiveTrue();
}
