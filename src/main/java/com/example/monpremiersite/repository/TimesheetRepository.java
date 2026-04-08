package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Timesheet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {
    List<Timesheet> findByCaseEntityIdc(Long caseId);
    List<Timesheet> findByAvocatIdu(Long avocatId);
    List<Timesheet> findByCaseEntityIdcAndIsBillableTrue(Long caseId);
}
