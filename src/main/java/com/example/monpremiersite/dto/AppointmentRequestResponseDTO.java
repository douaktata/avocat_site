package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Appointment;
import java.time.LocalDateTime;

public class AppointmentRequestResponseDTO {
    public Long id;
    public String clientNom;
    public String clientPrenom;
    public Long clientId;
    public String avocatNom;
    public String avocatPrenom;
    public Long avocatId;
    public LocalDateTime dateSouhaitee;
    public String reason;
    public String urgencyLevel;
    public String requestStatus;
    public LocalDateTime proposedDate;
    public String refusalReason;
    public LocalDateTime processedAt;
    public Long caseId;
    public String caseNumber;
    public LocalDateTime createdAt;

    public static AppointmentRequestResponseDTO fromEntity(Appointment a) {
        AppointmentRequestResponseDTO dto = new AppointmentRequestResponseDTO();
        dto.id = a.getIda();
        dto.dateSouhaitee = a.getAppointment_date();
        dto.reason = a.getReason();
        dto.urgencyLevel = a.getUrgencyLevel() != null ? a.getUrgencyLevel().name() : null;
        dto.requestStatus = a.getRequestStatus() != null ? a.getRequestStatus().name() : null;
        dto.proposedDate = a.getProposedDate();
        dto.refusalReason = a.getRefusalReason();
        dto.processedAt = a.getProcessedAt();
        dto.createdAt = a.getCreated_at();
        if (a.getUser() != null) {
            dto.clientId = a.getUser().getIdu();
            dto.clientNom = a.getUser().getNom();
            dto.clientPrenom = a.getUser().getPrenom();
        }
        if (a.getAvocat() != null) {
            dto.avocatId = a.getAvocat().getIdu();
            dto.avocatNom = a.getAvocat().getNom();
            dto.avocatPrenom = a.getAvocat().getPrenom();
        }
        if (a.getCaseEntity() != null) {
            dto.caseId = a.getCaseEntity().getIdc();
            dto.caseNumber = a.getCaseEntity().getCase_number();
        }
        return dto;
    }
}
