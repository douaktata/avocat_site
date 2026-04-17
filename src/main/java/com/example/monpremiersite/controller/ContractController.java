package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.ContractTemplateDTO;
import com.example.monpremiersite.entities.ContractTemplate;
import com.example.monpremiersite.service.ContractService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/contract-templates")
@CrossOrigin(origins = "http://localhost:5173")
public class ContractController {
    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public ResponseEntity<List<ContractTemplateDTO>> getAllTemplates() {
        List<ContractTemplateDTO> templates = contractService.getActiveTemplates()
            .stream()
            .map(ContractTemplateDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractTemplateDTO> getTemplateById(@PathVariable Long id) {
        ContractTemplate template = contractService.getTemplateById(id);
        if (template == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ContractTemplateDTO.fromEntity(template));
    }

    @PostMapping
    public ResponseEntity<ContractTemplateDTO> createTemplate(@RequestBody ContractTemplateDTO dto) {
        ContractTemplate template = new ContractTemplate();
        template.setLabel(dto.getLabel());
        template.setTypeContrat(dto.getTypeContrat());
        template.setDescription(dto.getDescription());
        template.setFieldsJson(dto.getFieldsJson());
        template.setActive(true);
        ContractTemplate saved = contractService.saveTemplate(template);
        return ResponseEntity.ok(ContractTemplateDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContractTemplateDTO> updateTemplate(@PathVariable Long id, @RequestBody ContractTemplateDTO dto) {
        ContractTemplate template = contractService.getTemplateById(id);
        if (template == null) {
            return ResponseEntity.notFound().build();
        }
        template.setLabel(dto.getLabel());
        template.setTypeContrat(dto.getTypeContrat());
        template.setDescription(dto.getDescription());
        template.setFieldsJson(dto.getFieldsJson());
        ContractTemplate saved = contractService.saveTemplate(template);
        return ResponseEntity.ok(ContractTemplateDTO.fromEntity(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        contractService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
