package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.ProvisionDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.ProvisionRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProvisionService {

    @Autowired
    private ProvisionRepository provisionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private EmailService emailService;

    public ProvisionDTO requestProvision(Long caseId, Long avocatId, Long clientId,
                                         BigDecimal amount, String description,
                                         String termsText, ProvisionType type) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found: " + caseId));
        User avocat = userRepository.findById(avocatId)
                .orElseThrow(() -> new RuntimeException("Avocat not found: " + avocatId));
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));

        int year = LocalDate.now().getYear();
        String prefix = "PROV-" + year + "-";
        long seq = provisionRepository.countByProvisionNumberStartingWith(prefix) + 1;
        String provisionNumber = prefix + String.format("%04d", seq);

        Provision provision = new Provision();
        provision.setProvisionNumber(provisionNumber);
        provision.setType(type);
        provision.setStatus(ProvisionStatus.DEMANDEE);
        provision.setAmount(amount);
        provision.setDescription(description);
        provision.setTermsText(termsText);
        provision.setRequestedDate(LocalDate.now());
        provision.setIsRefundable(true);
        provision.setCaseEntity(caseEntity);
        provision.setAvocat(avocat);
        provision.setClient(client);
        provision.setCreatedBy(avocat);

        Provision saved = provisionRepository.save(provision);
        emailService.sendProvisionRequestEmail(saved);
        return ProvisionDTO.fromEntity(saved);
    }

    public ProvisionDTO recordPayment(Long provisionId, LocalDateTime receivedDate) {
        Provision provision = provisionRepository.findById(provisionId)
                .orElseThrow(() -> new RuntimeException("Provision not found: " + provisionId));
        provision.setStatus(ProvisionStatus.RECUE);
        provision.setReceivedDate(receivedDate);
        Provision saved = provisionRepository.save(provision);
        return ProvisionDTO.fromEntity(saved);
    }

    public List<ProvisionDTO> getByCase(Long caseId) {
        return provisionRepository.findByCaseEntityIdc(caseId)
                .stream()
                .map(ProvisionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public BigDecimal getTotalReceivedByCase(Long caseId) {
        return provisionRepository.findByCaseEntityIdcAndStatus(caseId, ProvisionStatus.RECUE)
                .stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void refund(Long provisionId) {
        Provision provision = provisionRepository.findById(provisionId)
                .orElseThrow(() -> new RuntimeException("Provision not found: " + provisionId));
        provision.setStatus(ProvisionStatus.REMBOURSEE);
        provisionRepository.save(provision);
    }
}
