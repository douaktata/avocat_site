package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.TaskDTO;
import com.example.monpremiersite.entities.Task;
import com.example.monpremiersite.entities.TaskStatus;
import com.example.monpremiersite.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
public class TaskController {
    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<TaskDTO> all() {
        return service.findAll().stream().map(TaskDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> get(@PathVariable Long id) {
        Optional<Task> task = service.findById(id);
        return task.map(t -> ResponseEntity.ok(TaskDTO.fromEntity(t))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TaskDTO create(@RequestBody Task task) {
        Task saved = service.save(task);
        return TaskDTO.fromEntity(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> update(@PathVariable Long id, @RequestBody Task task) {
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        task.setId(id);
        Task updated = service.save(task);
        return ResponseEntity.ok(TaskDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assigned-to/{assignedToId}")
    public List<TaskDTO> findByAssignedTo(@PathVariable Long assignedToId) {
        return service.findByAssignedToId(assignedToId).stream().map(TaskDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/created-by/{createdById}")
    public List<TaskDTO> findByCreatedBy(@PathVariable Long createdById) {
        return service.findByCreatedById(createdById).stream().map(TaskDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/status/{status}")
    public List<TaskDTO> findByStatus(@PathVariable TaskStatus status) {
        return service.findByStatus(status).stream().map(TaskDTO::fromEntity).collect(Collectors.toList());
    }
}
