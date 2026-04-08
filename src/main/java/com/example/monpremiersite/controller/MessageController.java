package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.MessageDTO;
import com.example.monpremiersite.dto.UserFullDTO;
import com.example.monpremiersite.entities.Message;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.repository.MessageRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/messages")
public class MessageController {
    private final MessageRepository repo;
    private final UserRepository userRepo;

    public MessageController(MessageRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @PostMapping("/send")
    public ResponseEntity<MessageDTO> send(@RequestBody Map<String, Object> body) {
        Long senderId = ((Number) body.get("sender_id")).longValue();
        Long receiverId = ((Number) body.get("receiver_id")).longValue();
        String content = (String) body.get("content");
        if (content == null || content.isBlank()) return ResponseEntity.badRequest().build();

        User sender = userRepo.findById(senderId).orElse(null);
        User receiver = userRepo.findById(receiverId).orElse(null);
        if (sender == null || receiver == null) return ResponseEntity.badRequest().build();

        Message msg = new Message();
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setMessage(content);
        msg.setCreated_at(LocalDateTime.now());

        return ResponseEntity.ok(MessageDTO.fromEntity(repo.save(msg)));
    }

    @GetMapping("/conversation")
    public List<MessageDTO> conversation(@RequestParam Long user1, @RequestParam Long user2) {
        return repo.findConversation(user1, user2).stream()
                .map(MessageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/contacts/{userId}")
    public List<UserFullDTO> contacts(@PathVariable Long userId) {
        Set<User> contacts = new HashSet<>();
        contacts.addAll(repo.findReceiversByUserId(userId));
        contacts.addAll(repo.findSendersByUserId(userId));
        return contacts.stream().map(UserFullDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping
    public List<MessageDTO> all() {
        return repo.findAll().stream().map(MessageDTO::fromEntity).collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
