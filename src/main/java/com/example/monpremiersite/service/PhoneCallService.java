package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.PhoneCall;
import com.example.monpremiersite.repository.PhoneCallRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PhoneCallService {
    private final PhoneCallRepository repository;

    public PhoneCallService(PhoneCallRepository repository) {
        this.repository = repository;
    }

    public List<PhoneCall> findAll() {
        return repository.findAll();
    }

    public Optional<PhoneCall> findById(Long id) {
        return repository.findById(id);
    }

    public PhoneCall save(PhoneCall phoneCall) {
        return repository.save(phoneCall);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<PhoneCall> findByRecordedById(Long recordedById) {
        return repository.findByRecordedBy_Idu(recordedById);
    }

    public List<PhoneCall> findByCallerName(String callerName) {
        return repository.findByCallerName(callerName);
    }
}
