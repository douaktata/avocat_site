package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.PresenceJournalDTO;
import com.example.monpremiersite.entities.PresenceJournal;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.repository.PresenceJournalRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PresenceJournalService {
    private final PresenceJournalRepository repository;
    private final UserRepository userRepository;

    public PresenceJournalService(PresenceJournalRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public List<PresenceJournal> findAll() {
        return repository.findAll();
    }

    public Optional<PresenceJournal> findById(Long id) {
        return repository.findById(id);
    }

    public PresenceJournalDTO createPresenceJournal(PresenceJournalDTO dto) {
        PresenceJournal journal = new PresenceJournal();
        journal.setVisitorName(dto.getVisitorName());
        journal.setVisitorLastname(dto.getVisitorLastname());
        journal.setVisitorCin(dto.getVisitorCin());
        journal.setReason(dto.getReason());
        journal.setArrivalTime(dto.getArrivalTime());

        User secretary = userRepository.findById(dto.getRecordedById()).orElseThrow();
        journal.setRecordedBy(secretary);

        PresenceJournal saved = repository.save(journal);

        PresenceJournalDTO responseDto = new PresenceJournalDTO();
        responseDto.setId(saved.getId());
        responseDto.setVisitorName(saved.getVisitorName());
        responseDto.setVisitorLastname(saved.getVisitorLastname());
        responseDto.setVisitorCin(saved.getVisitorCin());
        responseDto.setReason(saved.getReason());
        responseDto.setArrivalTime(saved.getArrivalTime());
        responseDto.setRecordedById(saved.getRecordedBy().getIdu());
        responseDto.setRecordedByName(saved.getRecordedBy().getNom() + " " + saved.getRecordedBy().getPrenom());

        return responseDto;
    }

    public PresenceJournal save(PresenceJournal presenceJournal) {
        if (presenceJournal.getRecordedBy() != null) {
            Long userId = presenceJournal.getRecordedBy().getIdu();
            User realUser = userRepository.findById(userId).orElse(null);
            presenceJournal.setRecordedBy(realUser);
        }
        return repository.save(presenceJournal);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<PresenceJournal> findByRecordedById(Long recordedById) {
        return repository.findByRecordedBy_Idu(recordedById);
    }

    public List<PresenceJournal> findByVisitorName(String visitorName) {
        return repository.findByVisitorName(visitorName);
    }
}
