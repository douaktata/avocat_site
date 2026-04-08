package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.chat.ChatRequest;
import com.example.monpremiersite.dto.chat.ChatResponse;
import com.example.monpremiersite.entities.ChatMessage;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService, UserRepository userRepository) {
        this.chatService = chatService;
        this.userRepository = userRepository;
    }

    /** Send a message and get the assistant's reply. */
    @PostMapping
    public ResponseEntity<ChatResponse> sendMessage(@RequestBody ChatRequest request) {
        try {
            Long userId = resolveUserId();
            log.info("Chat message from userId={} sessionId={}", userId, request.getSessionId());
            ChatResponse response = chatService.processMessage(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing chat message", e);
            ChatResponse error = new ChatResponse();
            error.setMessage("Une erreur s'est produite : " + e.getMessage());
            return ResponseEntity.ok(error);
        }
    }

    /** Get the message history for a session (owned by current user). */
    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> getHistory(@RequestParam String sessionId) {
        Long userId = resolveUserId();
        List<ChatMessage> history = chatService.getSessionHistory(sessionId);
        List<ChatMessage> filtered = history.stream()
                .filter(m -> userId.equals(m.getUserId()))
                .toList();
        return ResponseEntity.ok(filtered);
    }

    /** Delete all messages in a session. */
    @DeleteMapping("/history")
    public ResponseEntity<Void> deleteHistory(@RequestParam String sessionId) {
        Long userId = resolveUserId();
        List<ChatMessage> history = chatService.getSessionHistory(sessionId);
        boolean owned = history.stream().allMatch(m -> userId.equals(m.getUserId()));
        if (!owned && !history.isEmpty()) {
            return ResponseEntity.status(403).build();
        }
        chatService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    /** List all sessions for the current user (sessionId + preview of first message). */
    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getSessions() {
        Long userId = resolveUserId();
        List<Map<String, Object>> sessions = chatService.getUserSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    /** Create a new session and return the welcome message. */
    @PostMapping("/new-session")
    public ResponseEntity<ChatResponse> newSession() {
        try {
            Long userId = resolveUserId();
            log.info("New chat session for userId={}", userId);
            ChatResponse welcome = chatService.startNewSession(userId);
            return ResponseEntity.ok(welcome);
        } catch (Exception e) {
            log.error("Error starting new chat session", e);
            ChatResponse error = new ChatResponse();
            error.setMessage("Le service est temporairement indisponible. Veuillez réessayer.");
            return ResponseEntity.ok(error);
        }
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private Long resolveUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + email))
                .getIdu();
    }
}
