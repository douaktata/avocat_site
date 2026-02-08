package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.Task;
import com.example.monpremiersite.entities.TaskStatus;
import com.example.monpremiersite.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> findAll() {
        return repository.findAll();
    }

    public Optional<Task> findById(Long id) {
        return repository.findById(id);
    }

    public Task save(Task task) {
        return repository.save(task);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<Task> findByAssignedToId(Long assignedToId) {
        return repository.findByAssignedTo_Idu(assignedToId);
    }

    public List<Task> findByCreatedById(Long createdById) {
        return repository.findByCreatedBy_Idu(createdById);
    }

    public List<Task> findByStatus(TaskStatus status) {
        return repository.findByStatus(status);
    }
}
