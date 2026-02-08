package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "presence_journals")
@Data
public class PresenceJournal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String visitorName;
    private String visitorLastname;
    private String visitorCin;
    private String reason;
    private LocalDateTime arrivalTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recorded_by_id")
    @JsonIgnore
    private User recordedBy;
}
