package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    List<ChatMessage> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT DISTINCT m.sessionId FROM ChatMessage m WHERE m.userId = :userId ORDER BY m.sessionId DESC")
    List<String> findDistinctSessionIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM ChatMessage m WHERE m.sessionId = :sessionId ORDER BY m.createdAt ASC")
    List<ChatMessage> findFirstMessageBySessionId(@Param("sessionId") String sessionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.sessionId = :sessionId")
    void deleteBySessionId(@Param("sessionId") String sessionId);
}
