package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.DocumentDTO;
import com.example.monpremiersite.entities.DocumentEntity;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.DocumentRepository;
import com.example.monpremiersite.repository.TaskRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/documents")
public class DocumentController {
    private final DocumentRepository repo;
    private final UserRepository userRepo;
    private final CaseRepository caseRepo;
    private final TaskRepository taskRepo;
    private static final Path UPLOAD_DIR = Paths.get("uploads/documents");

    public DocumentController(DocumentRepository repo, UserRepository userRepo, CaseRepository caseRepo, TaskRepository taskRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.caseRepo = caseRepo;
        this.taskRepo = taskRepo;
        try { Files.createDirectories(UPLOAD_DIR); } catch (IOException ignored) {}
    }

    @GetMapping
    public List<DocumentDTO> all() {
        return repo.findAll().stream().map(DocumentDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/case/{caseId}")
    public List<DocumentDTO> byCase(@PathVariable Long caseId) {
        return repo.findByCaseEntity_Idc(caseId).stream().map(DocumentDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/task/{taskId}")
    public List<DocumentDTO> byTask(@PathVariable Long taskId) {
        return repo.findByTask_Id(taskId).stream().map(DocumentDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> get(@PathVariable Long id) {
        return repo.findById(id).map(doc -> ResponseEntity.ok(DocumentDTO.fromEntity(doc)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<DocumentDTO> byUser(@PathVariable Long userId) {
        return repo.findByUploadedBy_Idu(userId).stream().map(DocumentDTO::fromEntity).collect(Collectors.toList());
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentDTO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caseId", required = false) Long caseId,
            @RequestParam(value = "taskId", required = false) Long taskId,
            @RequestParam("uploadedBy") Long uploadedById) throws IOException {

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String storedName = UUID.randomUUID() + ext;
        Path dest = UPLOAD_DIR.resolve(storedName);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        String fileType = ext.isEmpty() ? "AUTRE" : ext.substring(1).toUpperCase();
        if (fileType.equals("JPG") || fileType.equals("JPEG") || fileType.equals("PNG") || fileType.equals("GIF")) fileType = "IMAGE";
        if (!List.of("PDF", "DOCX", "XLSX", "IMAGE").contains(fileType)) fileType = "AUTRE";

        DocumentEntity doc = new DocumentEntity();
        doc.setFile_name(originalName);
        doc.setFile_type(fileType);
        doc.setFile_path(storedName);
        doc.setUploaded_at(LocalDateTime.now());
        if (caseId != null) caseRepo.findById(caseId).ifPresent(doc::setCaseEntity);
        if (taskId != null) taskRepo.findById(taskId).ifPresent(doc::setTask);
        userRepo.findById(uploadedById).ifPresent(doc::setUploadedBy);

        return ResponseEntity.ok(DocumentDTO.fromEntity(repo.save(doc)));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        DocumentEntity doc = repo.findById(id).orElse(null);
        if (doc == null || doc.getFile_path() == null) return ResponseEntity.notFound().build();
        try {
            Path file = UPLOAD_DIR.resolve(doc.getFile_path()).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFile_name() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public DocumentDTO create(@RequestBody DocumentEntity d) {
        return DocumentDTO.fromEntity(repo.save(d));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentDTO> update(@PathVariable Long id, @RequestBody DocumentEntity d) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        d.setIdd(id);
        return ResponseEntity.ok(DocumentDTO.fromEntity(repo.save(d)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.findById(id).ifPresent(doc -> {
            if (doc.getFile_path() != null) {
                try { Files.deleteIfExists(UPLOAD_DIR.resolve(doc.getFile_path())); } catch (IOException ignored) {}
            }
        });
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
