package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Message;
import com.example.monpremiersite.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender.idu = :u1 AND m.receiver.idu = :u2) OR (m.sender.idu = :u2 AND m.receiver.idu = :u1) ORDER BY m.created_at ASC")
    List<Message> findConversation(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT DISTINCT m.receiver FROM Message m WHERE m.sender.idu = :userId")
    List<User> findReceiversByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT m.sender FROM Message m WHERE m.receiver.idu = :userId")
    List<User> findSendersByUserId(@Param("userId") Long userId);
}
