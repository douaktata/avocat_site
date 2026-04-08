package com.example.monpremiersite.dto.chat;

import java.util.List;
import java.util.Map;

public class OllamaChatRequest {

    private String model;
    private List<OllamaMessage> messages;
    private boolean stream;
    private Map<String, Object> options;

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public List<OllamaMessage> getMessages() { return messages; }
    public void setMessages(List<OllamaMessage> messages) { this.messages = messages; }

    public boolean isStream() { return stream; }
    public void setStream(boolean stream) { this.stream = stream; }

    public Map<String, Object> getOptions() { return options; }
    public void setOptions(Map<String, Object> options) { this.options = options; }
}
