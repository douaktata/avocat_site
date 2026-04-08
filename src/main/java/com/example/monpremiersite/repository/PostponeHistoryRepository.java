package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.PostponeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostponeHistoryRepository extends JpaRepository<PostponeHistory, Long> {
    List<PostponeHistory> findByAudienceIdOrderByCreatedAtDesc(Long audienceId);
}
