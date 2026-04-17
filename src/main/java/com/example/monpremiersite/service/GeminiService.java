package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.ChatMessage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service d'appel à l'API Google Gemini (remplace OllamaService).
 *
 * Configuration requise dans application.properties :
 *   gemini.api.key=${GEMINI_API_KEY}
 *   gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
 *   gemini.temperature=0.3
 *
 * Clé gratuite : https://aistudio.google.com/apikey  (1 500 req/jour)
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.temperature:0.3}")
    private double temperature;

    private final ObjectMapper objectMapper;

    // JSON de secours retourné quand Gemini est indisponible ou en timeout
    private static final String FALLBACK_JSON =
            "{\"message\":\"Je suis désolé, le service est temporairement indisponible. " +
            "Veuillez réessayer dans quelques instants ou contacter directement le cabinet.\"," +
            "\"extracted\":{\"type_affaire\":null,\"description\":null,\"urgence\":false," +
            "\"date_preferee\":null,\"heure_preferee\":null}," +
            "\"ready_to_confirm\":false,\"appointment_confirmed\":false," +
            "\"suggestions\":[\"Réessayer\",\"Appeler le cabinet\",\"Envoyer un message\"]}";

    public GeminiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Envoie le system prompt + l'historique de conversation + le nouveau message utilisateur
     * à l'API Gemini et retourne le JSON brut de la réponse.
     *
     * Grâce à responseMimeType="application/json" + responseSchema, Gemini garantit
     * un JSON valide — plus besoin de regex d'extraction.
     *
     * @param systemPrompt  Le system prompt construit par ChatContextEnricher
     * @param history       Historique de la session depuis la DB
     * @param newUserMessage Le nouveau message de l'utilisateur
     * @return JSON string parsable directement en ChatResponse
     */
    public String chat(String systemPrompt, List<ChatMessage> history, String newUserMessage) {
        RestTemplate restTemplate = buildRestTemplate();

        List<Map<String, Object>> contents = buildContents(history, newUserMessage);
        Map<String, Object> requestBody = buildRequestBody(systemPrompt, contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String url = apiUrl + "?key=" + apiKey;

        try {
            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.debug("Appel Gemini — {} tour(s) dans contents", contents.size());

            HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getBody() == null) {
                log.warn("Réponse Gemini vide");
                return FALLBACK_JSON;
            }

            // Extraire candidates[0].content.parts[0].text
            Map<String, Object> body = objectMapper.readValue(response.getBody(), new TypeReference<>() {});
            List<?> candidates = (List<?>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                log.warn("Aucun candidat dans la réponse Gemini : {}", response.getBody());
                return FALLBACK_JSON;
            }

            Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> content = (Map<?, ?>) candidate.get("content");
            List<?> parts = (List<?>) content.get("parts");
            String text = (String) ((Map<?, ?>) parts.get(0)).get("text");

            log.debug("Réponse Gemini : {}", text);
            return text;

        } catch (Exception e) {
            log.error("Erreur appel Gemini : {}", e.getMessage());
            return FALLBACK_JSON;
        }
    }

    /**
     * Convertit l'historique ChatMessage en format Gemini (rôles "user" / "model").
     *
     * Règles :
     * - Les messages "assistant" deviennent "model"
     * - Les messages "system" sont ignorés (déjà dans systemInstruction)
     * - Le message de bienvenue (premier message "model") est ignoré
     * - Les messages consécutifs du même rôle sont fusionnés
     */
    private List<Map<String, Object>> buildContents(List<ChatMessage> history, String newUserMessage) {
        List<Map<String, Object>> contents = new ArrayList<>();
        String lastRole = null;

        for (ChatMessage msg : history) {
            if (msg.getRole() == ChatMessage.MessageRole.system) continue;

            String geminiRole = msg.getRole() == ChatMessage.MessageRole.assistant ? "model" : "user";

            // Ignorer le message de bienvenue (premier message "model" avant tout message "user")
            if (contents.isEmpty() && "model".equals(geminiRole)) continue;

            if (geminiRole.equals(lastRole) && !contents.isEmpty()) {
                // Fusionner avec le message précédent du même rôle
                Map<String, Object> last = contents.get(contents.size() - 1);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> existingParts = (List<Map<String, Object>>) last.get("parts");
                Map<String, Object> firstPart = existingParts.get(0);
                firstPart.put("text", firstPart.get("text") + "\n" + msg.getContent());
            } else {
                Map<String, Object> part = new HashMap<>();
                part.put("text", msg.getContent());
                List<Map<String, Object>> parts = new ArrayList<>();
                parts.add(part);
                Map<String, Object> entry = new HashMap<>();
                entry.put("role", geminiRole);
                entry.put("parts", parts);
                contents.add(entry);
                lastRole = geminiRole;
            }
        }

        // Ajouter le nouveau message utilisateur
        Map<String, Object> userPart = new HashMap<>();
        userPart.put("text", newUserMessage);
        List<Map<String, Object>> userParts = new ArrayList<>();
        userParts.add(userPart);
        Map<String, Object> userEntry = new HashMap<>();
        userEntry.put("role", "user");
        userEntry.put("parts", userParts);
        contents.add(userEntry);

        return contents;
    }

    /**
     * Construit le payload complet pour l'API Gemini avec :
     * - systemInstruction (system prompt)
     * - contents (historique + nouveau message)
     * - generationConfig avec responseMimeType="application/json" et responseSchema
     *
     * Le responseSchema force Gemini à retourner un JSON structuré valide garanti.
     */
    private Map<String, Object> buildRequestBody(String systemPrompt, List<Map<String, Object>> contents) {
        // ── systemInstruction ──────────────────────────────────────────────────
        Map<String, Object> sysPart = new HashMap<>();
        sysPart.put("text", systemPrompt);
        Map<String, Object> systemInstruction = new HashMap<>();
        systemInstruction.put("parts", List.of(sysPart));

        // ── responseSchema : structure attendue de la réponse Gemini ──────────
        Map<String, Object> extractedProperties = new LinkedHashMap<>();
        Map<String, Object> nullableString = new HashMap<>();
        nullableString.put("type", "STRING");
        nullableString.put("nullable", true);

        extractedProperties.put("type_affaire",  new HashMap<>(nullableString));
        extractedProperties.put("description",   new HashMap<>(nullableString));
        extractedProperties.put("urgence",        Map.of("type", "BOOLEAN"));
        extractedProperties.put("date_preferee",  new HashMap<>(nullableString));
        extractedProperties.put("heure_preferee", new HashMap<>(nullableString));

        Map<String, Object> extractedSchema = new HashMap<>();
        extractedSchema.put("type", "OBJECT");
        extractedSchema.put("properties", extractedProperties);

        Map<String, Object> suggestionsSchema = new HashMap<>();
        suggestionsSchema.put("type", "ARRAY");
        suggestionsSchema.put("items", Map.of("type", "STRING"));

        Map<String, Object> responseProperties = new LinkedHashMap<>();
        responseProperties.put("message",              Map.of("type", "STRING"));
        responseProperties.put("extracted",             extractedSchema);
        responseProperties.put("ready_to_confirm",      Map.of("type", "BOOLEAN"));
        responseProperties.put("appointment_confirmed", Map.of("type", "BOOLEAN"));
        responseProperties.put("suggestions",           suggestionsSchema);

        Map<String, Object> responseSchema = new HashMap<>();
        responseSchema.put("type", "OBJECT");
        responseSchema.put("properties", responseProperties);
        responseSchema.put("required", List.of("message", "extracted",
                "ready_to_confirm", "appointment_confirmed", "suggestions"));

        // ── generationConfig ───────────────────────────────────────────────────
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", temperature);
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", responseSchema);

        // ── payload final ──────────────────────────────────────────────────────
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", contents);
        body.put("systemInstruction", systemInstruction);
        body.put("generationConfig", generationConfig);

        return body;
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(30_000);  // 30 secondes
        return new RestTemplate(factory);
    }
}
