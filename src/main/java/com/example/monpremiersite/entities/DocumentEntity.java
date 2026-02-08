package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class DocumentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idd;

    private String file_name;
    private String file_type;
    private String file_path;
    private LocalDateTime uploaded_at;

    @ManyToOne
    @JoinColumn(name = "idc")
    private CaseEntity caseEntity;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    public Long getIdd() { return idd; }
    public void setIdd(Long idd) { this.idd = idd; }

    public String getFile_name() { return file_name; }
    public void setFile_name(String file_name) { this.file_name = file_name; }

    public String getFile_type() { return file_type; }
    public void setFile_type(String file_type) { this.file_type = file_type; }

    public String getFile_path() { return file_path; }
    public void setFile_path(String file_path) { this.file_path = file_path; }

    public LocalDateTime getUploaded_at() { return uploaded_at; }
    public void setUploaded_at(LocalDateTime uploaded_at) { this.uploaded_at = uploaded_at; }

    public CaseEntity getCaseEntity() { return caseEntity; }
    public void setCaseEntity(CaseEntity caseEntity) { this.caseEntity = caseEntity; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }
}
