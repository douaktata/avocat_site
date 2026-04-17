package com.example.monpremiersite.controller;

import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.ContractHistoryRepository;
import com.example.monpremiersite.repository.ContractTemplateRepository;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.service.ContractPDFService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "http://localhost:5173")
public class ContractGenerateController {

    private final ContractTemplateRepository templateRepo;
    private final ContractHistoryRepository  historyRepo;
    private final CaseRepository             caseRepo;
    private final UserRepository             userRepo;
    private final ContractPDFService         pdfService;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:mistral}")
    private String ollamaModel;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ContractGenerateController(ContractTemplateRepository templateRepo,
                                      ContractHistoryRepository historyRepo,
                                      CaseRepository caseRepo,
                                      UserRepository userRepo,
                                      ContractPDFService pdfService) {
        this.templateRepo = templateRepo;
        this.historyRepo  = historyRepo;
        this.caseRepo     = caseRepo;
        this.userRepo     = userRepo;
        this.pdfService   = pdfService;
    }

    // ── Streaming generation (SSE) ────────────────────────────────────────────

    @PostMapping("/generate")
    public ResponseEntity<SseEmitter> generateContract(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        SseEmitter emitter = new SseEmitter(300_000L);
        // Capture auth before spawning thread (SecurityContext is thread-local)
        final String userEmail = authentication != null ? authentication.getName() : null;

        new Thread(() -> {
            try {
                Long templateId = ((Number) request.get("templateId")).longValue();
                @SuppressWarnings("unchecked")
                Map<String, String> formData = (Map<String, String>) request.get("formData");
                Object caseIdObj = request.get("caseId");
                Long caseId = caseIdObj != null ? ((Number) caseIdObj).longValue() : null;

                Optional<ContractTemplate> optTemplate = templateRepo.findById(templateId);
                if (optTemplate.isEmpty()) {
                    emitter.send(SseEmitter.event().name("error").data("Modèle introuvable"));
                    emitter.complete();
                    return;
                }

                ContractTemplate template = optTemplate.get();
                String fullPrompt = buildFullPrompt(template, formData);
                String generatedContent = streamFromOllama(fullPrompt, emitter);
                saveHistory(template, formData, caseId, generatedContent, userEmail);

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();

            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("Erreur: " + e.getMessage()));
                } catch (IOException ignored) {}
                emitter.completeWithError(e);
            }
        }).start();

        return ResponseEntity.ok(emitter);
    }

    // ── PDF export ────────────────────────────────────────────────────────────

    @PostMapping("/export-pdf")
    public ResponseEntity<byte[]> exportPDF(@RequestBody Map<String, Object> request) {
        String label       = (String) request.get("label");
        String typeContrat = (String) request.get("typeContrat");
        String content     = (String) request.get("content");

        if (label == null || content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            byte[] pdfBytes = pdfService.generatePDF(label, typeContrat, content);

            String safeName = label.replaceAll("[^a-zA-Z0-9àâéèêëîïôùûüç\\s_-]", "")
                                   .replaceAll("\\s+", "_")
                                   .toLowerCase() + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                ContentDisposition.attachment().filename(safeName).build());
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── History endpoints ─────────────────────────────────────────────────────

    /** All documents generated by the authenticated user. */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getMyHistory(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        return userRepo.findByEmail(authentication.getName())
            .map(user -> {
                List<Map<String, Object>> result = historyRepo
                    .findByUserOrderByCreatedAtDesc(user)
                    .stream()
                    .map(h -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",           h.getId());
                        m.put("templateType", h.getTemplateType());
                        m.put("label",        h.getLabel());
                        m.put("createdAt",    h.getCreatedAt());
                        m.put("preview",      preview(h.getGeneratedContent()));
                        m.put("caseId",       h.getCaseEntity() != null ? h.getCaseEntity().getIdc() : null);
                        return m;
                    }).toList();
                return ResponseEntity.ok(result);
            })
            .orElse(ResponseEntity.status(404).build());
    }

    /** Full content of a single history entry (must belong to the authenticated user). */
    @GetMapping("/history/{id}")
    public ResponseEntity<Map<String, Object>> getHistoryItem(
            @PathVariable Long id, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        Optional<ContractHistory> opt = historyRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ContractHistory h = opt.get();
        // Ownership check
        if (h.getUser() == null || !h.getUser().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).build();
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           h.getId());
        m.put("templateType", h.getTemplateType());
        m.put("label",        h.getLabel());
        m.put("content",      h.getGeneratedContent());
        m.put("formDataJson", h.getFormDataJson());
        m.put("createdAt",    h.getCreatedAt());
        m.put("caseId",       h.getCaseEntity() != null ? h.getCaseEntity().getIdc() : null);
        return ResponseEntity.ok(m);
    }

    /** Delete a history entry (must belong to the authenticated user). */
    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistoryItem(
            @PathVariable Long id, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        Optional<ContractHistory> opt = historyRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ContractHistory h = opt.get();
        if (h.getUser() == null || !h.getUser().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).build();
        }

        historyRepo.delete(h);
        return ResponseEntity.noContent().build();
    }

    /** Count of documents generated by the authenticated user (for badge). */
    @GetMapping("/history/count")
    public ResponseEntity<Map<String, Long>> getMyHistoryCount(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        return userRepo.findByEmail(authentication.getName())
            .map(user -> ResponseEntity.ok(Map.of("count", historyRepo.countByUser(user))))
            .orElse(ResponseEntity.status(404).build());
    }

    // Legacy endpoints (kept for backward compatibility)
    @GetMapping("/history/user/{userId}")
    public ResponseEntity<List<ContractHistory>> getHistoryByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(historyRepo.findByUserIduOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/history/case/{caseId}")
    public ResponseEntity<List<ContractHistory>> getHistoryByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(historyRepo.findByCaseEntityIdcOrderByCreatedAtDesc(caseId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String buildFullPrompt(ContractTemplate template, Map<String, String> formData) {
        StringBuilder sb = new StringBuilder();
        if (template.getSystemPrompt() != null && !template.getSystemPrompt().isBlank()) {
            sb.append(template.getSystemPrompt()).append("\n\n");
        }
        sb.append("Génère un document de type « ").append(template.getLabel())
          .append(" » avec les informations suivantes :\n\n");
        for (Map.Entry<String, String> entry : formData.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isBlank()) {
                sb.append("- ").append(entry.getKey()).append(" : ").append(entry.getValue()).append("\n");
            }
        }
        return sb.toString();
    }

    private String streamFromOllama(String prompt, SseEmitter emitter) throws IOException {
        StringBuilder fullResponse = new StringBuilder();

        URL url = new URL(ollamaBaseUrl + "/api/generate");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(300_000);

        String jsonBody = objectMapper.writeValueAsString(Map.of(
                "model", ollamaModel,
                "prompt", prompt,
                "stream", true
        ));

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
        }

        int responseCode = conn.getResponseCode();
        if (responseCode != 200) {
            String errMsg = "\n[Erreur Ollama HTTP " + responseCode +
                    " — vérifiez qu'Ollama est démarré sur " + ollamaBaseUrl + "]\n";
            emitter.send(SseEmitter.event().data(errMsg));
            return errMsg;
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                try {
                    JsonNode node = objectMapper.readTree(line);
                    boolean done  = node.path("done").asBoolean(false);
                    String  token = node.path("response").asText("");
                    if (!token.isEmpty()) {
                        fullResponse.append(token);
                        emitter.send(SseEmitter.event().data(token));
                    }
                    if (done) break;
                } catch (Exception ignored) {}
            }
        }
        return fullResponse.toString();
    }

    private void saveHistory(ContractTemplate template, Map<String, String> formData,
                             Long caseId, String content, String userEmail) {
        try {
            ContractHistory history = new ContractHistory();
            history.setTemplateType(template.getTypeContrat());
            history.setLabel(template.getLabel());
            history.setGeneratedContent(content);
            history.setFormDataJson(objectMapper.writeValueAsString(formData));
            history.setCreatedAt(LocalDateTime.now());

            if (userEmail != null) {
                userRepo.findByEmail(userEmail).ifPresent(history::setUser);
            }
            if (caseId != null) {
                caseRepo.findById(caseId).ifPresent(history::setCaseEntity);
            }
            historyRepo.save(history);
        } catch (Exception ignored) {}
    }

    private String preview(String content) {
        if (content == null) return "";
        String stripped = content.strip();
        return stripped.length() <= 220 ? stripped : stripped.substring(0, 220) + "…";
    }
}
