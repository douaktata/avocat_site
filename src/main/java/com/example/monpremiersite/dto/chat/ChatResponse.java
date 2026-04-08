package com.example.monpremiersite.dto.chat;

import java.util.List;
import java.util.Map;

public class ChatResponse {

    private String message;
    private List<String> suggestions;
    private Map<String, Object> extractedData;
    private boolean readyToConfirm;
    private boolean appointmentConfirmed;
    private Long appointmentRequestId;
    private String sessionId;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }

    public Map<String, Object> getExtractedData() { return extractedData; }
    public void setExtractedData(Map<String, Object> extractedData) { this.extractedData = extractedData; }

    public boolean isReadyToConfirm() { return readyToConfirm; }
    public void setReadyToConfirm(boolean readyToConfirm) { this.readyToConfirm = readyToConfirm; }

    public boolean isAppointmentConfirmed() { return appointmentConfirmed; }
    public void setAppointmentConfirmed(boolean appointmentConfirmed) { this.appointmentConfirmed = appointmentConfirmed; }

    public Long getAppointmentRequestId() { return appointmentRequestId; }
    public void setAppointmentRequestId(Long appointmentRequestId) { this.appointmentRequestId = appointmentRequestId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}
