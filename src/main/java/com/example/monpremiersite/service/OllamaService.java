package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.chat.OllamaChatResponse;
import com.example.monpremiersite.dto.chat.OllamaMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OllamaService {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:mistral}")
    private String ollamaModel;

    @Value("${ollama.timeout:60000}")
    private int ollamaTimeout;

    private static final String FALLBACK_UNAVAILABLE =
            "{\"message\": \"Je suis désolé, le service d'assistance est temporairement indisponible. " +
            "Veuillez réessayer dans quelques instants ou contacter directement le cabinet.\", " +
            "\"extracted\": {\"type_affaire\": null, \"description\": null, \"urgence\": null, " +
            "\"date_preferee\": null, \"heure_preferee\": null}, " +
            "\"ready_to_confirm\": false, \"appointment_confirmed\": false, " +
            "\"suggestions\": [\"Réessayer\", \"Appeler le cabinet\", \"Envoyer un message\"]}";

    public OllamaChatResponse chat(String systemPrompt, List<OllamaMessage> messages) {
        RestTemplate restTemplate = buildRestTemplate();

        List<OllamaMessage> allMessages = new ArrayList<>();
        allMessages.add(new OllamaMessage("system", systemPrompt));
        allMessages.addAll(messages);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", ollamaModel);
        requestBody.put("messages", allMessages);
        requestBody.put("stream", false);
        requestBody.put("options", Map.of("temperature", 0.7));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> responseEntity = (ResponseEntity<Map<String, Object>>)
                    (ResponseEntity<?>) restTemplate.postForEntity(
                            ollamaBaseUrl + "/api/chat", entity, Map.class);

            Map<String, Object> body = responseEntity.getBody();
            if (body != null && body.containsKey("message")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> msgMap = (Map<String, Object>) body.get("message");
                OllamaChatResponse response = new OllamaChatResponse();
                response.setMessage(new OllamaMessage(
                        String.valueOf(msgMap.get("role")),
                        String.valueOf(msgMap.get("content"))
                ));
                return response;
            }
        } catch (Exception e) {
            // Ollama unavailable or timeout — return graceful fallback
        }

        OllamaChatResponse fallback = new OllamaChatResponse();
        fallback.setMessage(new OllamaMessage("assistant", FALLBACK_UNAVAILABLE));
        return fallback;
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(ollamaTimeout);
        return new RestTemplate(factory);
    }
}
