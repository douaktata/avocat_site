package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.DocumentDTO;
import com.example.monpremiersite.entities.DocumentEntity;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.DocumentRepository;
import com.example.monpremiersite.repository.TaskRepository;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.service.OllamaService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/documents")
public class DocumentController {
    private final DocumentRepository repo;
    private final UserRepository userRepo;
    private final CaseRepository caseRepo;
    private final TaskRepository taskRepo;
    private final OllamaService ollamaService;
    private static final Path UPLOAD_DIR = Paths.get("uploads/documents");
    private static final long MAX_TEXT_CHARS = 8000; // Limite pour éviter de dépasser le context window de Mistral

    public DocumentController(DocumentRepository repo, UserRepository userRepo, CaseRepository caseRepo, TaskRepository taskRepo, OllamaService ollamaService) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.caseRepo = caseRepo;
        this.taskRepo = taskRepo;
        this.ollamaService = ollamaService;
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

    /**
     * Résumé IA d'un document via Ollama (Mistral local).
     * Extrait le texte du fichier (PDF ou texte brut), l'envoie à Mistral
     * et retourne le résumé généré.
     */
    @GetMapping("/{id}/summarize")
    public ResponseEntity<Map<String, String>> summarize(@PathVariable Long id) {
        DocumentEntity doc = repo.findById(id).orElse(null);
        if (doc == null || doc.getFile_path() == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = UPLOAD_DIR.resolve(doc.getFile_path()).normalize();
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        String extractedText;
        String fileType = doc.getFile_type() != null ? doc.getFile_type().toUpperCase() : "AUTRE";

        try {
            if ("PDF".equals(fileType)) {
                // Extraction de texte avec Apache PDFBox
                try (PDDocument pdDoc = PDDocument.load(filePath.toFile())) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    extractedText = stripper.getText(pdDoc);
                }
            } else if ("DOCX".equals(fileType) || "TXT".equals(fileType) || "AUTRE".equals(fileType)) {
                // Lecture brute du fichier texte
                byte[] bytes = Files.readAllBytes(filePath);
                extractedText = new String(bytes, StandardCharsets.UTF_8);
            } else if ("IMAGE".equals(fileType)) {
                return ResponseEntity.ok(Map.of("summary",
                    "⚠️ Les images ne peuvent pas être analysées par l'IA directement. " +
                    "Veuillez fournir un document en format PDF ou texte."));
            } else {
                byte[] bytes = Files.readAllBytes(filePath);
                extractedText = new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("summary",
                "Erreur lors de la lecture du fichier : " + e.getMessage()));
        }

        if (extractedText == null || extractedText.isBlank()) {
            return ResponseEntity.ok(Map.of("summary",
                "Le document semble vide ou son contenu n'est pas extractible."));
        }

        // Tronquer si le texte est trop long pour le context window de Mistral
        if (extractedText.length() > MAX_TEXT_CHARS) {
            extractedText = extractedText.substring(0, (int) MAX_TEXT_CHARS) +
                    "\n\n[...Document tronqué pour respecter les limites du modèle IA...] ";
        }

        String summary = ollamaService.summarizeDocument(extractedText);
        return ResponseEntity.ok(Map.of("summary", summary, "documentName", doc.getFile_name()));
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
