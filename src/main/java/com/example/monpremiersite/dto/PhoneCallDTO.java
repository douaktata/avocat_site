package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.PhoneCall;
import java.time.LocalDateTime;

public class PhoneCallDTO {
    private Long id;
    private String caller_full_name;
    private String phone_number;
    private String call_reason;
    private LocalDateTime call_date;
    private Long recorded_by_id;

    public PhoneCallDTO() {}

    public PhoneCallDTO(Long id, String caller_full_name, String phone_number, String call_reason, LocalDateTime call_date, Long recorded_by_id) {
        this.id = id;
        this.caller_full_name = caller_full_name;
        this.phone_number = phone_number;
        this.call_reason = call_reason;
        this.call_date = call_date;
        this.recorded_by_id = recorded_by_id;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaller_full_name() { return caller_full_name; }
    public void setCaller_full_name(String caller_full_name) { this.caller_full_name = caller_full_name; }

    public String getPhone_number() { return phone_number; }
    public void setPhone_number(String phone_number) { this.phone_number = phone_number; }

    public String getCall_reason() { return call_reason; }
    public void setCall_reason(String call_reason) { this.call_reason = call_reason; }

    public LocalDateTime getCall_date() { return call_date; }
    public void setCall_date(LocalDateTime call_date) { this.call_date = call_date; }

    public Long getRecorded_by_id() { return recorded_by_id; }
    public void setRecorded_by_id(Long recorded_by_id) { this.recorded_by_id = recorded_by_id; }

    // Mapper
    public static PhoneCallDTO fromEntity(PhoneCall entity) {
        String callerFullName = null;
        if (entity.getCallerLastname() != null || entity.getCallerName() != null) {
            String lastname = entity.getCallerLastname();
            String name = entity.getCallerName();
            callerFullName = ((lastname != null ? lastname : "") + " " + (name != null ? name : "")).trim();
        }

        Long recordedById = null;
        if (entity.getRecordedBy() != null) {
            recordedById = entity.getRecordedBy().getIdu();
        }

        return new PhoneCallDTO(
            entity.getId(),
            callerFullName,
            entity.getPhoneNumber(),
            entity.getCallReason(),
            entity.getCallDate(),
            recordedById
        );
    }
}
