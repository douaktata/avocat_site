package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    java.util.List<DocumentEntity> findByCaseEntity_Idc(Long caseId);
    java.util.List<DocumentEntity> findByUploadedBy_Idu(Long userId);
    java.util.List<DocumentEntity> findByTask_Id(Long taskId);
}
