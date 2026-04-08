package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Provision;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProvisionDTO {

    public Long id;
    public String provisionNumber;
    public String type;
    public String status;
    public BigDecimal amount;
    public String description;
    public String termsText;
    public LocalDate requestedDate;
    public LocalDateTime receivedDate;
    public Boolean isRefundable;
    public Long caseId;
    public String caseNumber;
    public Long clientId;
    public String clientName;
    public Long avocatId;
    public String avocatName;
    public LocalDateTime createdAt;

    public static ProvisionDTO fromEntity(Provision p) {
        ProvisionDTO dto = new ProvisionDTO();
        dto.id = p.getId();
        dto.provisionNumber = p.getProvisionNumber();
        dto.type = p.getType() != null ? p.getType().name() : null;
        dto.status = p.getStatus() != null ? p.getStatus().name() : null;
        dto.amount = p.getAmount();
        dto.description = p.getDescription();
        dto.termsText = p.getTermsText();
        dto.requestedDate = p.getRequestedDate();
        dto.receivedDate = p.getReceivedDate();
        dto.isRefundable = p.getIsRefundable();

        if (p.getCaseEntity() != null) {
            dto.caseId = p.getCaseEntity().getIdc();
            dto.caseNumber = p.getCaseEntity().getCase_number();
        }

        if (p.getClient() != null) {
            dto.clientId = p.getClient().getIdu();
            dto.clientName = p.getClient().getPrenom() + " " + p.getClient().getNom();
        }

        if (p.getAvocat() != null) {
            dto.avocatId = p.getAvocat().getIdu();
            dto.avocatName = p.getAvocat().getPrenom() + " " + p.getAvocat().getNom();
        }

        dto.createdAt = p.getCreatedAt();
        return dto;
    }
}
