package com.example.monpremiersite.entities;

public enum TrustStatus {
    PENDING,  // Séquestre créé, aucun dépôt encore reçu
    ACTIVE,   // Au moins un dépôt reçu
    CLOSED    // Dossier fermé, séquestre soldé
}
