package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ida;

    @ManyToOne
    @JoinColumn(name = "idu")
    private User user;

    private LocalDateTime appointment_date;
    private String status;
    private LocalDateTime created_at;
    private String reason;

    public Long getIda() { return ida; }
    public void setIda(Long ida) { this.ida = ida; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getAppointment_date() { return appointment_date; }
    public void setAppointment_date(LocalDateTime appointment_date) { this.appointment_date = appointment_date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
