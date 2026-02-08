package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.PhoneCall;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PhoneCallRepository extends JpaRepository<PhoneCall, Long> {
    List<PhoneCall> findByRecordedBy_Idu(Long recordedById);
    List<PhoneCall> findByCallerName(String callerName);
}
