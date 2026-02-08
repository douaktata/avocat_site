package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "phone_calls")
@Data
public class PhoneCall {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String callerName;
    private String callerLastname;
    private String phoneNumber;
    private String callReason;
    private LocalDateTime callDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_id")
    private User recordedBy;
}
