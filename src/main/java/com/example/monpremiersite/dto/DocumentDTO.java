package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.DocumentEntity;
import java.time.LocalDateTime;

public class DocumentDTO {
    private Long idd;
    private String file_name;
    private String file_type;
    private Long case_id;
    private String case_number;
    private String uploaded_by_name;
    private LocalDateTime uploaded_at;

    public DocumentDTO() {}

    public DocumentDTO(Long idd, String file_name, String file_type, Long case_id, String case_number, String uploaded_by_name, LocalDateTime uploaded_at) {
        this.idd = idd;
        this.file_name = file_name;
        this.file_type = file_type;
        this.case_id = case_id;
        this.case_number = case_number;
        this.uploaded_by_name = uploaded_by_name;
        this.uploaded_at = uploaded_at;
    }

    // Getters and Setters
    public Long getIdd() { return idd; }
    public void setIdd(Long idd) { this.idd = idd; }

    public String getFile_name() { return file_name; }
    public void setFile_name(String file_name) { this.file_name = file_name; }

    public String getFile_type() { return file_type; }
    public void setFile_type(String file_type) { this.file_type = file_type; }

    public Long getCase_id() { return case_id; }
    public void setCase_id(Long case_id) { this.case_id = case_id; }

    public String getCase_number() { return case_number; }
    public void setCase_number(String case_number) { this.case_number = case_number; }

    public String getUploaded_by_name() { return uploaded_by_name; }
    public void setUploaded_by_name(String uploaded_by_name) { this.uploaded_by_name = uploaded_by_name; }

    public LocalDateTime getUploaded_at() { return uploaded_at; }
    public void setUploaded_at(LocalDateTime uploaded_at) { this.uploaded_at = uploaded_at; }

    // Mapper
    public static DocumentDTO fromEntity(DocumentEntity entity) {
        Long caseId = null;
        String caseNumber = null;
        if (entity.getCaseEntity() != null) {
            caseId = entity.getCaseEntity().getIdc();
            caseNumber = entity.getCaseEntity().getCase_number();
        }

        String uploadedByName = null;
        if (entity.getUploadedBy() != null) {
            String nom = entity.getUploadedBy().getNom();
            String prenom = entity.getUploadedBy().getPrenom();
            uploadedByName = ((nom != null ? nom : "") + " " + (prenom != null ? prenom : "")).trim();
        }

        return new DocumentDTO(
            entity.getIdd(),
            entity.getFile_name(),
            entity.getFile_type(),
            caseId,
            caseNumber,
            uploadedByName,
            entity.getUploaded_at()
        );
    }
}
