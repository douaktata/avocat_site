package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.ContractTemplate;
import com.example.monpremiersite.repository.ContractTemplateRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContractService {
    private final ContractTemplateRepository repository;

    public ContractService(ContractTemplateRepository repository) {
        this.repository = repository;
    }

    public List<ContractTemplate> getActiveTemplates() {
        return repository.findByActiveTrue();
    }

    public ContractTemplate getTemplateById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public ContractTemplate saveTemplate(ContractTemplate template) {
        return repository.save(template);
    }

    public void deleteTemplate(Long id) {
        repository.deleteById(id);
    }
}
