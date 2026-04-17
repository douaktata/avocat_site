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

    /**
     * Résumé d'un document juridique via Ollama (Mistral local).
     * Envoie le texte extrait du document avec un prompt de contexte juridique
     * et retourne le résumé généré.
     *
     * @param documentText Le texte extrait du document (PDF, TXT, etc.)
     * @return Un résumé structuré du document
     */
    public String summarizeDocument(String documentText) {
        RestTemplate restTemplate = buildRestTemplate();

        String systemPrompt = "Tu es un assistant juridique expert spécialisé dans le droit tunisien et la gestion de dossiers juridiques. " +
                "Tu dois résumer les documents juridiques de façon claire, structurée et précise en français. " +
                "Ton résumé doit inclure : les parties concernées, l'objet principal du document, " +
                "les clauses ou points clés importants, et toute date ou obligation notable. " +
                "Sois concis mais exhaustif. Ne rajoute pas de commentaires personnels.";

        String userMessage = "Résume le document juridique suivant :\n\n" + documentText;

        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> sysMsg = new HashMap<>();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);
        messages.add(sysMsg);

        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", ollamaModel);
        requestBody.put("messages", messages);
        requestBody.put("stream", false);
        requestBody.put("options", Map.of("temperature", 0.3, "num_predict", 1024));

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
                return String.valueOf(msgMap.get("content"));
            }
        } catch (Exception e) {
            System.err.println("OLLAMA ERREUR: " + e.getMessage());
            e.printStackTrace();
            return "Erreur lors du résumé (Ollama) : " + e.getMessage() + ". " +
                   "Si c'est un 'Read timed out', le document est peut-être trop long pour votre PC. " +
                   "Sinon, assurez-vous de lancer 'ollama run mistral'.";
        }

        return "Impossible de générer un résumé pour ce document.";
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(ollamaTimeout);
        return new RestTemplate(factory);
    }
}
