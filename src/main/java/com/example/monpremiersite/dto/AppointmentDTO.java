package com.example.monpremiersite.dto;

import java.time.LocalDateTime;

public class AppointmentDTO {
    private Long ida;
    private UserInfoDTO user;
    private LocalDateTime appointmentDate;
    private String status;
    private LocalDateTime createdAt;
    private String reason;

    public AppointmentDTO() {}

    public AppointmentDTO(Long ida, UserInfoDTO user, LocalDateTime appointmentDate, String status, LocalDateTime createdAt, String reason) {
        this.ida = ida;
        this.user = user;
        this.appointmentDate = appointmentDate;
        this.status = status;
        this.createdAt = createdAt;
        this.reason = reason;
    }

    // Getters and Setters
    public Long getIda() { return ida; }
    public void setIda(Long ida) { this.ida = ida; }

    public UserInfoDTO getUser() { return user; }
    public void setUser(UserInfoDTO user) { this.user = user; }

    public LocalDateTime getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDateTime appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
