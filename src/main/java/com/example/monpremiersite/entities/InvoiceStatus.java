package com.example.monpremiersite.entities;

public enum InvoiceStatus {
    DRAFT,    // Brouillon — modifiable, email non envoyé
    ISSUED,   // Émise — verrouillée, email envoyé, allocation possible
    PARTIAL,  // Partiellement payée via allocation
    PAID,     // Entièrement payée
    VOID      // Annulée
}
