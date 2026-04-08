package com.example.monpremiersite.entities;

public enum LedgerEntryType {
    DEPOSIT,     // Client verse dans le séquestre (+)
    INVOICE,     // Facture émise (informatif)
    ALLOCATION,  // Séquestre → Facture (-)
    REFUND       // Remboursement au client (-)
}
