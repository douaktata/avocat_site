package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Task;
import com.example.monpremiersite.entities.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedTo_Idu(Long assignedToId);
    List<Task> findByCreatedBy_Idu(Long createdById);
    List<Task> findByStatus(TaskStatus status);
}
