# 📋 Architecture Flat DTO - Cabinet d'Avocats

## 🎯 Vue d'ensemble
Tous les endpoints retournent maintenant des DTOs plats sans objets imbriqués pour une meilleure performance et une réponse JSON plus simple.

---

## 1. **CaseNoteDTO** 📝
**Endpoint:** `GET/POST/PUT /case-notes`

**Exemple de réponse:**
```json
{
    "idn": 1,
    "note": "Réunion avec le client pour discuter de la stratégie",
    "case_id": 3,
    "case_number": "AFF-2026-001",
    "created_by_name": "Nom Secrétaire",
    "created_at": "2026-02-07T14:30:00"
}
```

**Champs:**
- `idn` (Long) - ID de la note
- `note` (String) - Contenu de la note
- `case_id` (Long) - ID du dossier
- `case_number` (String) - Numéro du dossier (pour référence directe)
- `created_by_name` (String) - Nom + Prénom de la personne qui a créé la note
- `created_at` (LocalDateTime) - Date de création

---

## 2. **DocumentDTO** 📄
**Endpoint:** `GET/POST/PUT /documents`

**Exemple de réponse:**
```json
{
    "idd": 1,
    "file_name": "contrat_client.pdf",
    "file_type": "pdf",
    "case_id": 3,
    "case_number": "AFF-2026-001",
    "uploaded_by_name": "Me Ghofrane",
    "uploaded_at": "2026-02-06T10:15:00"
}
```

**Champs:**
- `idd` (Long) - ID du document
- `file_name` (String) - Nom du fichier
- `file_type` (String) - Type de fichier (pdf, docx, etc.)
- `case_id` (Long) - ID du dossier
- `case_number` (String) - Numéro du dossier (pour référence directe)
- `uploaded_by_name` (String) - Nom + Prénom de la personne qui a uploadé
- `uploaded_at` (LocalDateTime) - Date d'upload

---

## 3. **PhoneCallDTO** ☎️
**Endpoint:** `GET/POST/PUT /phone-calls`

**Exemple de réponse:**
```json
{
    "id": 1,
    "caller_full_name": "Ahmed Ben Ali",
    "phone_number": "+216 98 765 432",
    "call_reason": "Consultation sur divorce",
    "call_date": "2026-02-07T15:00:00",
    "recorded_by_id": 9
}
```

**Champs:**
- `id` (Long) - ID de l'appel
- `caller_full_name` (String) - Nom + Prénom de l'appelant
- `phone_number` (String) - Numéro de téléphone
- `call_reason` (String) - Raison de l'appel
- `call_date` (LocalDateTime) - Date de l'appel
- `recorded_by_id` (Long) - ID de la personne qui a enregistré

---

## 4. **TaskDTO** ✅
**Endpoint:** `GET/POST/PUT /tasks`

**Exemple de réponse:**
```json
{
    "id": 1,
    "title": "Préparer dossier client",
    "description": "Organiser tous les documents pour la réunion",
    "deadline": "2026-02-15T18:00:00",
    "status": "PENDING",
    "priority": "HIGH",
    "assigned_to_name": "Nom Employé"
}
```

**Champs:**
- `id` (Long) - ID de la tâche
- `title` (String) - Titre de la tâche
- `description` (String) - Description détaillée
- `deadline` (LocalDateTime) - Date limite
- `status` (Enum) - PENDING, IN_PROGRESS, COMPLETED
- `priority` (Enum) - LOW, MEDIUM, HIGH
- `assigned_to_name` (String) - Nom + Prénom de la personne assignée

---

## 5. **TrialDTO** ⚖️
**Endpoint:** `GET/POST/PUT /trials`

**Exemple de réponse:**
```json
{
    "idt": 1,
    "location": "Tribunal de Tunis, Salle 3",
    "status": "SCHEDULED",
    "case_id": 3,
    "case_number": "AFF-2026-001",
    "hearing_date": "2026-03-10T09:00:00",
    "created_at": "2026-02-01T10:00:00"
}
```

**Champs:**
- `idt` (Long) - ID du procès
- `location` (String) - Lieu du procès
- `status` (String) - SCHEDULED, ONGOING, CLOSED
- `case_id` (Long) - ID du dossier
- `case_number` (String) - Numéro du dossier
- `hearing_date` (LocalDateTime) - Date de l'audience
- `created_at` (LocalDateTime) - Date de création

---

## 6. **PaymentDTO** 💳
**Endpoint:** `GET/POST/PUT /payments`

**Exemple de réponse:**
```json
{
    "id": 1,
    "amount": 1200.50,
    "payment_date": "2026-02-05T11:30:00",
    "status": "COMPLETED",
    "payment_method": "BANK_TRANSFER",
    "client_name": "Doua Ktata"
}
```

**Champs:**
- `id` (Long) - ID du paiement
- `amount` (BigDecimal) - Montant du paiement
- `payment_date` (LocalDateTime) - Date du paiement
- `status` (Enum) - PENDING, COMPLETED, CANCELLED
- `payment_method` (Enum) - BANK_TRANSFER, CASH, CHECK, CARD
- `client_name` (String) - Nom + Prénom du client

---

## 7. **CaseDTO** 📂
**Endpoint:** `GET/POST/PUT /cases`

**Exemple de réponse:**
```json
{
    "idc": 3,
    "case_number": "AFF-2026-001",
    "case_type": "Civil",
    "status": "OPEN",
    "client_id": 8,
    "client_full_name": "Ktata Doua",
    "appointment_id": 5,
    "created_at": "2026-02-02T10:00:00"
}
```

**Champs:**
- `idc` (Long) - ID du dossier
- `case_number` (String) - Numéro unique du dossier
- `case_type` (String) - Type (Civil, Pénal, Commercial, etc.)
- `status` (String) - OPEN, CLOSED, PENDING
- `client_id` (Long) - ID du client
- `client_full_name` (String) - Nom + Prénom du client
- `appointment_id` (Long) - ID du rendez-vous associé
- `created_at` (LocalDateTime) - Date de création

---

## ✨ Avantages de cette architecture

✅ **JSON plus léger** - Pas d'objets imbriqués, réductions des données transmises
✅ **Données claires** - Noms explicites (ex: `client_full_name` au lieu d'un objet User)
✅ **Performances optimisées** - Moins de sérialisation, réponses plus rapides
✅ **Références directes** - Les listes incluent le numéro de dossier/ID pour éviter requêtes supplémentaires
✅ **Facile à consommer** - Frontend obtient directement les données sans traverser d'objets imbriqués

---

## 🔄 Mappers fournis

Chaque DTO inclut sa méthode de mapper statique:
```java
public static CaseNoteDTO fromEntity(CaseNote entity)
public static DocumentDTO fromEntity(DocumentEntity entity)
public static PhoneCallDTO fromEntity(PhoneCall entity)
public static TaskDTO fromEntity(Task entity)
public static TrialDTO fromEntity(Trial entity)
public static PaymentDTO fromEntity(Payment entity)
public static CaseDTO fromEntity(CaseEntity entity)
```

Les controllers utilisent ces mappers pour transformer les entités JPA en DTOs avant de retourner les réponses.
