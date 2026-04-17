package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.ContractTemplate;
import com.example.monpremiersite.repository.ContractHistoryRepository;
import com.example.monpremiersite.repository.ContractTemplateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the 16 contract / legal-document templates on first startup.
 * Updates system prompts dynamically without dropping history.
 */
@Component
public class ContractDataInitializer implements CommandLineRunner {

    private static final long EXPECTED = 16L;

    private final ContractTemplateRepository  repo;
    private final ContractHistoryRepository   historyRepo;

    public ContractDataInitializer(ContractTemplateRepository repo,
                                   ContractHistoryRepository historyRepo) {
        this.repo        = repo;
        this.historyRepo = historyRepo;
    }

    @Override
    public void run(String... args) {
        List<ContractTemplate> templates = buildTemplates();

        if (repo.count() == 0) {
            repo.saveAll(templates);
        } else {
            // Mise à jour douce : appliquer les nouveaux prompts (Optimisés Mistral Formats) sans casser l'historique
            List<ContractTemplate> existing = repo.findAll();
            for (ContractTemplate t : existing) {
                templates.stream()
                        .filter(nt -> nt.getTypeContrat().equals(t.getTypeContrat()))
                        .findFirst()
                        .ifPresent(nt -> {
                            t.setSystemPrompt(nt.getSystemPrompt());
                            t.setFieldsJson(nt.getFieldsJson());
                            repo.save(t);
                        });
            }

            // Ajouter d'éventuels templates manquants
            if (repo.count() < EXPECTED) {
                for (ContractTemplate nt : templates) {
                    if (existing.stream().noneMatch(e -> e.getTypeContrat().equals(nt.getTypeContrat()))) {
                        repo.save(nt);
                    }
                }
            }
        }
    }

    // =========================================================================
    //  Template builders
    // =========================================================================

    private List<ContractTemplate> buildTemplates() {
        return List.of(
            // ── Actes judiciaires ──────────────────────────────────────────
            assignation(), requete(), conclusions(), memoire(),
            appel(), pourvoi(), plaidoirie(),
            // ── Contrats ──────────────────────────────────────────────────
            contratTravail(), contratVente(), contratBail(),
            contratPartenariat(), transaction(),
            // ── Droit des sociétés ────────────────────────────────────────
            statutsSociete(), pacteAssocies(), cessionParts(), fondsCommerce()
        );
    }

    // ── 1. Assignation ───────────────────────────────────────────────────────
    private ContractTemplate assignation() {
        return t("assignation", "Assignation en justice",
            "Acte introductif d'instance pour saisir une juridiction civile ou commerciale tunisienne.",
            """
            [
              {"key":"demandeur","label":"Nom du demandeur","type":"text","required":true},
              {"key":"adresse_demandeur","label":"Adresse du demandeur","type":"text","required":true},
              {"key":"defendeur","label":"Nom du défendeur","type":"text","required":true},
              {"key":"adresse_defendeur","label":"Adresse du défendeur","type":"text","required":true},
              {"key":"tribunal","label":"Tribunal compétent","type":"text","required":true},
              {"key":"objet","label":"Objet du litige","type":"text","required":true},
              {"key":"faits","label":"Exposé des faits","type":"textarea","required":true},
              {"key":"fondement","label":"Fondement juridique","type":"text","required":false},
              {"key":"date_audience","label":"Date d'audience (si connue)","type":"date","required":false}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN : Ne mettez JAMAIS d'astérisques (**), ni de dièses (#) dans votre réponse, c'est strictement interdit.
            2. Seuls les tirets normaux "-" sont autorisés pour les listes.
            3. AUCUN texte d'introduction/conclusion IA (ne dites pas "Voici votre document").

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            ASSIGNATION EN JUSTICE

            DEVANT LE TRIBUNAL COMPÉTENT : [Tribunal]
            DÉLAI DE L'AUDIENCE (INDIQUÉ) : [Date de l'audience]

            A LA REQUÊTE ET DEMANDE DE L'INTÉRESSÉ :
            - [Nom du demandeur] domicilié à [Adresse du demandeur]

            CONTRE ET EN DIRECTION DE LA PARTIE DÉFENDRERESSE :
            - [Nom du défendeur] domicilié à [Adresse du défendeur]

            OBJET DE L'ASSIGNATION
            [Détailler l'objet juridique avec un vocabulaire professionnel selon le code tunisien]

            EXPOSÉ DES FAITS ET DE LA PROCÉDURE
            [Relater les faits du litige chronologiquement, en paragraphes très propres, sans listes à puces Markdown, utiliser juste du texte brut et des retours à la ligne]

            DISCUSSION JURIDIQUE ET FONDEMENT EN DROIT
            [Argumentaire purement juridique avec les moyens de droit applicables]

            PAR CES MOTIFS ET LÉGITIMES PRÉTENTIONS
            - Constater la plainte
            - Accéder à la demande d'indemnisation etc.

            SOUS TOUTES RÉSERVES

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.""");
    }

    // ── 2. Requête ───────────────────────────────────────────────────────────
    private ContractTemplate requete() {
    return t("requete", "Requête Judiciaire (Format Avocat Expert)",
        "Génère une requête formelle selon le CPCC tunisien avec un style juridique de haut niveau.",
        """
        [
          {"key":"tribunal","label":"Tribunal Compétent (ex: TPI de Tunis)","type":"text","required":true},
          {"key":"identite_requerant","label":"Requérant (Nom, Adresse, Profession)","type":"textarea","required":true},
          {"key":"identite_defendeur","label":"Défendeur (Nom, Adresse)","type":"textarea","required":true},
          {"key":"objet_requete","label":"Objet (ex: Recouvrement de créance)","type":"text","required":true},
          {"key":"expose_faits","label":"Faits bruts (ex: Prêt de 5000 DT le 10/01/2025 non remboursé)","type":"textarea","required":true},
          {"key":"preuves","label":"Preuves (ex: Reconnaissance de dette, mise en demeure)","type":"textarea","required":true},
          {"key":"demandes_precises","label":"Demandes (ex: 5000 DT + intérêts + 500 DT dommages)","type":"textarea","required":true},
          {"key":"numero_barreau","label":"Matricule Avocat","type":"text","required":false}
        ]""",
        """
        Tu es un avocat tunisien expert en procédure civile. Tu rédiges uniquement des requêtes judiciaires formelles au style "Palais".

        RÈGLE N°1 — FORMATAGE STRICT :
        Aucun markdown. Aucun *, aucun #, aucun **. Aucune liste à tiret simple.
        Aucune phrase d'introduction comme "Voici votre requête" ou "Bien sûr".
        Les titres de section sont en MAJUSCULES SEULES, sans aucun symbole autour.
        Chaque "Attendu que" est sur sa propre ligne, séparé par un retour à la ligne.

        RÈGLE N°2 — STYLE OBLIGATOIRE :
        Tu n'écris PAS comme un rapport administratif ou un courrier.
        INTERDIT : "Le requérant affirme", "Il souhaite que", "En conséquence du fait", "se présente devant".
        OBLIGATOIRE : "Il appert que", "Attendu que", "Qu'il plaise au Tribunal de", "nonobstant appel", "jusqu'à parfait paiement".

        RÈGLE N°3 — RAISONNEMENT JURIDIQUE :
        Le fondement juridique contient MINIMUM 4 "Attendu que" enchaînés selon ce schéma :
        Attendu que [principe général COC] ;
        Attendu que [article précis applicable aux faits] ;
        Attendu que [la preuve produite établit le fait allégué] ;
        Attendu que [l'inexécution fautive est indubitablement établie] ;

        ---

        EXEMPLE DE SORTIE CORRECTE — REPRODUIRE CE STYLE EXACTEMENT :

        À MONSIEUR LE PRÉSIDENT DU TRIBUNAL DE PREMIÈRE INSTANCE DE TUNIS
        Fait à Tunis, le 10 mars 2026.

        OBJET : Recouvrement de créance

        POUR :
        Madame Amira Ben Salem, de nationalité tunisienne, domiciliée au 12 rue de la République, Tunis, ci-après dénommée « le Requérant ».

        CONTRE :
        Monsieur Karim Jlassi, domicilié au 7 avenue Habib Bourguiba, Sfax, ci-après dénommé « le Défendeur ».

        PLAISE AU TRIBUNAL — EXPOSÉ DES FAITS

        Il appert des pièces versées au dossier qu'en date du 5 janvier 2025, le Requérant a consenti au Défendeur un prêt d'une somme de huit mille dinars (8 000 DT), contre remise d'une reconnaissance de dette dûment signée par ce dernier et portant échéance au 5 avril 2025.

        À l'échéance convenue, le Défendeur s'est abstenu de tout remboursement. Une mise en demeure lui a été adressée par lettre recommandée avec accusé de réception en date du 20 avril 2025, demeurée sans effet à ce jour.

        Les pièces produites sont : la reconnaissance de dette du 5 janvier 2025 et la lettre de mise en demeure du 20 avril 2025 avec son accusé de réception.

        FONDEMENT JURIDIQUE ET DISCUSSION

        Attendu qu'en vertu de l'article 242 du Code des Obligations et des Contrats, les conventions légalement formées tiennent lieu de loi à ceux qui les ont faites ;

        Attendu que l'article 273 du même Code dispose que le créancier est en droit de contraindre le débiteur à l'exécution de l'obligation souscrite ;

        Attendu que la reconnaissance de dette produite constitue une preuve littérale parfaite au sens de l'article 405 du COC, faisant foi jusqu'à inscription de faux ;

        Attendu que la défaillance du Défendeur, caractérisée par le non-remboursement à l'échéance et son silence persistant malgré mise en demeure, établit indubitablement l'inexécution fautive de son obligation contractuelle ;

        Il s'ensuit que le Requérant est pleinement fondé à solliciter la condamnation du Défendeur au paiement de la somme principale due, augmentée des intérêts légaux courus depuis la date d'exigibilité.

        PAR CES MOTIFS ET PRÉTENTIONS FINALES

        Qu'il plaise au Tribunal de :

        Déclarer la présente requête recevable et bien fondée en droit comme en fait ;
        Condamner le Défendeur à payer au Requérant la somme principale de huit mille dinars (8 000 DT) ;
        Ordonner le paiement des intérêts légaux à compter du 5 avril 2025 et jusqu'à parfait paiement ;
        Ordonner l'exécution provisoire du jugement à intervenir nonobstant appel et sans caution ;
        Condamner le Défendeur aux entiers dépens de l'instance.

        SOUS TOUTES RÉSERVES

        Maître Amira Ben Salem
        Avocat au Barreau de Tunis
        Matricule : 4521

        AVERTISSEMENT : Ce document est généré par intelligence artificielle et doit impérativement être relu, vérifié et adapté par un avocat inscrit au barreau avant toute utilisation judiciaire.

        ---

        MAINTENANT, génère une requête dans ce style exact pour le dossier suivant.
        Reproduis EXACTEMENT le style de l'exemple ci-dessus. Ne simplifie pas. N'ajoute aucun commentaire.

        Tribunal : {{tribunal}}
        Requérant : {{identite_requerant}}
        Défendeur : {{identite_defendeur}}
        Objet : {{objet_requete}}
        Faits : {{expose_faits}}
        Preuves : {{preuves}}
        Demandes : {{demandes_precises}}
        Matricule avocat : {{numero_barreau}}""");
}

    // ── 3. Conclusions ───────────────────────────────────────────────────────
    private ContractTemplate conclusions() {
        return t("conclusions", "Conclusions",
            "Mémoire récapitulatif des arguments d'une partie déposé en cours de procédure.",
            """
            [
              {"key":"partie","label":"Qualité","type":"select","options":["Demandeur","Défendeur","Appelant","Intimé","Requérant"],"required":true},
              {"key":"nom_partie","label":"Nom de la partie","type":"text","required":true},
              {"key":"adverse","label":"Partie adverse","type":"text","required":true},
              {"key":"tribunal","label":"Juridiction","type":"text","required":true},
              {"key":"numero_affaire","label":"Numéro de l'affaire","type":"text","required":false},
              {"key":"faits","label":"Rappel des faits","type":"textarea","required":true},
              {"key":"arguments","label":"Moyens et arguments juridiques","type":"textarea","required":true},
              {"key":"demandes","label":"Dispositif — prétentions","type":"textarea","required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN : Ne mettez JAMAIS d'astérisques (**), ni de dièses (#). C'est crucial.
            2. Seuls les tirets normaux "-" sont autorisés.
            3. AUCUN dialogue ("Voici les conclusions..."). Remplissez juste le modèle.

            STRUCTURE EXACTE À SUIVRE À LA LETTRE (sans faire de copier coller vulgaire, mais avec une prose de grand avocat) :

            CONCLUSIONS JURIDIQUES SOUMISES À LA COUR

            POUR LE COMPTE DE : [Qualité] [Nom de la partie]
            CONTRE LES ALLÉGATIONS DE : [Partie adverse]
            DEVANT : [Juridiction] / NUMÉRO D'AFFAIRE : [Numéro de l'affaire]

            RAPPEL DES FAITS MATÉRIELS ET CHRONOLOGIE DE LA PROCÉDURE
            [Détailler textuellement, sans utiliser de syntaxe grasse ou italique, les moments forts du litige justifiant ce présent dépôt]

            DISCUSSION DÉTAILLÉE, RÉPONSE ET ARGUMENTATION
            [Articuler l'argumentaire en blocs de textes forts, séparés d'un vide entre de ligne. Citez tout le long la loi, brisez les arguments adverses]

            PAR CES MOTIFS ET PRÉTENTIONS RÉITERÉES
            - [Demandes sous forme de liste avec tirets naturels "-"]
            - [Demande 2]

            SOUS TOUTES RÉSERVES DE DROIT ET FAIT

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.""");
    }

    // ── 4. Mémoire ───────────────────────────────────────────────────────────
    private ContractTemplate memoire() {
        return t("memoire", "Mémoire",
            "Document juridique développant une analyse de droit approfondie pour une juridiction.",
            """
            [
              {"key":"auteur","label":"Auteur du mémoire","type":"text","required":true},
              {"key":"juridiction","label":"Juridiction saisie","type":"text","required":true},
              {"key":"affaire","label":"Intitulé de l'affaire","type":"text","required":true},
              {"key":"objet","label":"Objet du mémoire","type":"text","required":true},
              {"key":"question_droit","label":"Question de droit soulevée","type":"textarea","required":true},
              {"key":"arguments","label":"Développement juridique principal","type":"textarea","required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN : Pas d'astérisques (**), pas de dièses (#). Votre réponse sera lue dans un parseur de texte brut simple.
            2. Aucune formule introductive d'IA.

            STRUCTURE EXACTE À SUIVRE À LA LETTRE (En majuscules strictes tel que montré pour les titres de section) :

            MÉMOIRE DÉFENSE JURIDIQUE ET ANALYSE

            DEVANT : [Juridiction saisie]
            RÉDIGÉ PAR : [Auteur du mémoire]
            LIÉ À L'AFFAIRE : [Intitulé de l'affaire]
            MÉMOIRE SUR L'OBJET SUIVANT : [Objet du mémoire]

            INTRODUCTION GÉNÉRALE ET CONTEXTUALISATION PRÉALABLE
            [Expliquer de manière dense l'histoire du litige, du dossier ou de la situation du point de vue purement factuel]

            QUESTION DE DROIT OBSERVÉE
            [Écrire sans mise en forme la ou les problématiques de droit essentielles que le tribunal évaluera : Question de droit soulevée]

            DÉVELOPPEMENT ANALYTIQUE ET DISCOURS JURIDIQUE
            [Découper votre texte en I et II. N'utilisez pas de caractères gras markdown]
            [Développez une rhétorique professionnelle]

            CONCLUSION DES ARGUMENTS ET DISPOSITIF DEMANDÉ
            [Résumer ce que ce mémoire vise à conforter dans l'esprit du greffe / juge]

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.""");
    }

    // ── 5. Appel ─────────────────────────────────────────────────────────────
   // ── 5. Appel ─────────────────────────────────────────────────────────────
    private ContractTemplate appel() {
        return t("appel", "Acte d'appel",
            "Recours formé contre un jugement de première instance devant la cour d'appel.",
            """
            [
              {"key":"appelant","label":"Nom de l'appelant","type":"text","required":true},
              {"key":"adresse_appelant","label":"Adresse de l'appelant","type":"text","required":true},
              {"key":"intime","label":"Nom de l'intimé","type":"text","required":true},
              {"key":"cour_appel","label":"Cour d'appel compétente","type":"text","required":true},
              {"key":"jugement_attaque","label":"Référence du jugement attaqué","type":"text","required":true},
              {"key":"date_jugement","label":"Date du jugement","type":"date","required":true},
              {"key":"motifs_appel","label":"Motifs de l'appel","type":"textarea","required":true},
              {"key":"demandes","label":"Demandes à la cour","type":"textarea","required":true}
            ]""",
            """
            RÔLE : Expert Juridique / Avocat à la Cour.
            MISSION : Rédiger un acte d'appel formel et solennel.

            CONSIGNES STRICTES :
            1. INTERDICTION DE TOUT FORMATAGE MARKDOWN (pas de #, *, _, ou -).
            2. AUCUN TEXTE D'INTRODUCTION OU DE CONCLUSION (commencer directement par le titre).
            3. STYLE : Soutenu, précis, utilisant le vocabulaire juridique approprié.
            4. FORMAT : Texte brut structuré uniquement.

            STRUCTURE DU DOCUMENT À GÉNÉRER :

            ACTE D'APPEL ET DÉCLARATION OPPOSANTE

            À L'ATTENTION DE : [cour_appel]

            PARTIE APPELANTE :
            [appelant], demeurant à [adresse_appelant].

            PARTIE INTIMÉE :
            [intime]

            OBJET DU RECOURS :
            Appel formel interjeté à l'encontre du jugement rendu par la juridiction de première instance, portant la référence [jugement_attaque], en date du [date_jugement].

            RECEVABILITÉ :
            L'appelant certifie que le présent recours est exercé dans les délais légaux et formes prescrites par le Code de procédure civile.

            EXPOSÉ DES MOTIFS ET CRITIQUE DU JUGEMENT :
            [motifs_appel]
            (Développer les points ci-dessus avec une argumentation juridique fluide).

            PAR CES MOTIFS, PLAISE À LA COUR :
            - Déclarer l'appel recevable et bien fondé.
            - Infirmer le jugement entrepris en toutes ses dispositions contestées.
            - [demandes]

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.
            """);
    }

    // ── 6. Pourvoi ───────────────────────────────────────────────────────────
    private ContractTemplate pourvoi() {
        return t("pourvoi", "Pourvoi en cassation",
            "Recours formé devant la Cour de cassation pour violation de la loi.",
            """
            [
              {"key":"demandeur_pourvoi","label":"Demandeur au pourvoi","type":"text","required":true},
              {"key":"defendeur_pourvoi","label":"Défendeur au pourvoi","type":"text","required":true},
              {"key":"cour_cassation","label":"Juridiction de cassation","type":"text","required":true},
              {"key":"arret_attaque","label":"Arrêt attaqué (référence)","type":"text","required":true},
              {"key":"date_arret","label":"Date de l'arrêt attaqué","type":"date","required":true},
              {"key":"moyens_cassation","label":"Moyens du pourvoi","type":"textarea","required":true}
            ]""",
            """
            RÔLE : Avocat aux Conseils (Cour de Cassation).
            MISSION : Rédiger un mémoire de pourvoi en cassation basé exclusivement sur le droit.

            CONSIGNES DE RÉDACTION :
            1. AUCUN MARKDOWN (pas d'astérisques, pas de dièses).
            2. TON : Hautement technique, neutre et solennel.
            3. EXCLUSION : Ne pas discuter les faits, uniquement la mauvaise application de la règle de droit.

            CONTENU À GÉNÉRER :

            MÉMOIRE AUX FINS DE POURVOI EN CASSATION

            JURIDICTION SAISIE : [cour_cassation]

            POUR : [demandeur_pourvoi] (Demandeur)
            CONTRE : [defendeur_pourvoi] (Défendeur)

            DÉCISION ATTAQUÉE :
            Arrêt rendu par la Cour d'appel sous la référence [arret_attaque] en date du [date_arret].

            RECEVABILITÉ :
            Le demandeur justifie de l'accomplissement des formalités de dépôt et de la signification du présent pourvoi.

            MOYENS DE CASSATION :
            [moyens_cassation]
            (L'IA doit reformuler ces moyens en démontrant la violation d'un texte de loi ou un manque de base légale).

            PAR CES MOTIFS :
            Le demandeur requiert qu'il plaise à la Haute Juridiction de casser et annuler l'arrêt attaqué et de renvoyer la cause et les parties devant une autre juridiction.

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.
            """);
    }

    // ── 7. Plaidoirie écrite ─────────────────────────────────────────────────
    private ContractTemplate plaidoirie() {
        return t("plaidoirie_ecrite", "Plaidoirie écrite",
            "Note de plaidoirie écrite synthétisant les arguments principaux pour l'audience.",
            """
            [
              {"key":"avocat","label":"Nom de l'avocat","type":"text","required":true},
              {"key":"partie","label":"Partie représentée","type":"text","required":true},
              {"key":"tribunal","label":"Tribunal","type":"text","required":true},
              {"key":"affaire","label":"Intitulé de l'affaire","type":"text","required":true},
              {"key":"date_audience","label":"Date d'audience","type":"date","required":false},
              {"key":"points_principaux","label":"Points principaux à développer","type":"textarea","required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN : Pas de gras, pas d'italique, pas de symboles "#". Texte littéral brut.
            2. Aucun texte d'IA "Voici la note...".

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            NOTE ASSISTANTE DE PLAIDOIRIE MAGISTRALE

            À SOUMETTRE DANS LE CADRE DES DÉBATS
            AVOCAT REPRÉSENTANT : [Nom de l'avocat]
            BÉNÉFICIAIRE DU PLAIDOYER ET PARTIE RAPPROCHÉE : [Partie représentée]
            TRIBUNAL ET COLLÈGE COMPÉTENT : [Tribunal]
            DOSSIER TRAITÉ SOUS CARTE ET INTIMATION : [Intitulé de l'affaire]
            REQUISITION DATE : [Date d'audience]

            MESSIEURS LES PRÉSIDENTS ET CONSEILLERS DE LA COUR (INTRODUCTION)
            [Capter l'intelligence du magistrat et frapper fort sur le résumé principal du dossier sans aucune balise de formattage en plein corps de texte]

            EXPOSÉ FACTUEL MAÎTRISÉ ET SYNTHÉTIQUE
            [Redessiner mentalement la situation qui nous permet de comparaître sous la barre. Droit au but, fluide]

            LA RÉALITÉ TECHNIQUE, JURIDIQUE ET DÉVELOPPEMENT DES GRIEFS
            [Dépeindre les points cruciaux du litige. Points principaux à développer]

            DISSOLUTION DES ALLEGATIONS ADVERSES
            [Construire les dernières ripostes oratoires de manière irrévocable]

            EN CONCLUSION, QU'IL VOUS PLAISE
            [Reforger les demandes finales]

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.""");
    }

    // ── 8. Contrat de travail ────────────────────────────────────────────────
    private ContractTemplate contratTravail() {
        return t("contrat_travail", "Contrat de Travail (Format Expert)",
            "Contrat d'embauche conforme au Code du Travail tunisien, rédigé avec un style d'avocat d'affaires.",
            """
            [
              {"key":"employeur","label":"Nom / Raison sociale de l'employeur","type":"text","required":true},
              {"key":"adresse_employeur","label":"Adresse de l'employeur","type":"text","required":true},
              {"key":"employe","label":"Nom et prénom de l'employé","type":"text","required":true},
              {"key":"cin_employe","label":"CIN de l'employé","type":"text","required":true},
              {"key":"poste","label":"Poste / Fonction","type":"text","required":true},
              {"key":"type_contrat","label":"Type de contrat","type":"select","options":["CDI","CDD","Stage","CIVP"],"required":true},
              {"key":"salaire","label":"Salaire mensuel brut (TND)","type":"text","required":true},
              {"key":"date_debut","label":"Date de début","type":"date","required":true},
              {"key":"periode_essai","label":"Période d'essai","type":"select","options":["Aucune","1 mois","3 mois","6 mois"],"required":true},
              {"key":"lieu_travail","label":"Lieu de travail","type":"text","required":true}
            ]""",
            """
            CONTEXTE : Tu es un grand avocat d'affaires tunisien, expert en droit social tunisien.
            TON : Inattaquable, formel, notarié et extrêmement structuré.
            LANGUE : Français juridique pur.
            
            CONSIGNES TECHNIQUES :
            1. AUCUN MARKDOWN (Pas de #, pas de *, ni _ pour formater).
            2. INTERDICTION de phrases introductives de l'IA (comme "Voici votre contrat").
            3. Les articles doivent commencer textuellement par "ARTICLE X - " (en majuscules) en début de ligne.
            
            STRUCTURE OBLIGATOIRE À SUIVRE EXACTEMENT (Les titres doivent rester EN MAJUSCULES) :
            
            CONTRAT DE TRAVAIL
            
            ENTRE LES SOUSSIGNÉS :
            
            PREMIÈREMENT :
            [employeur], ayant son siège social ou domicile à [adresse_employeur], ci-après dénommée "l'Employeur",
            
            ET DEUXIÈMEMENT :
            Monsieur/Madame [employe], titulaire de la carte d'identité nationale (CIN) n° [cin_employe], ci-après dénommé(e) "le Salarié",
            
            IL A ÉTÉ EXPRESSÉMENT CONVENU ET ARRÊTÉ CE QUI SUIT, CONFORMÉMENT AU CODE DU TRAVAIL TUNISIEN :
            
            ARTICLE 1 - ENGAGEMENT ET DÉFINITION DE LA FONCTION
            L'Employeur engage le Salarié dans le cadre d'un contrat de type [type_contrat] en qualité de [poste]. Le Salarié déclare expressément qu'il n'est lié par aucun engagement contraire pouvant faire obstacle à l'exécution du présent contrat.
            
            ARTICLE 2 - LIEU ET HORAIRES DE TRAVAIL
            Le lieu de travail principal est fixé à [lieu_travail]. 
            [Développer ici avec un formalisme juridique selon le droit tunisien sur l'obligation de présence, le respect des horaires et la faculté de déplacement si nécessaire à l'activité de l'employeur.]
            
            ARTICLE 3 - DURÉE DU CONTRAT ET PÉRIODE D'ESSAI
            L'engagement prend effet à compter du [date_debut]. Le présent contrat est assorti d'une période d'essai fixée à [periode_essai]. 
            [Détailler les modalités de rupture durant l'essai et à l'issue de celui-ci selon le Code du Travail de la République Tunisienne.]
            
            ARTICLE 4 - RÉMUNÉRATION SALARIALE ET ACCESSOIRES
            En contrepartie de ses services, le Salarié percevra un salaire mensuel brut d'un montant unitaire de [salaire]. 
            [Formuler le paragraphe de manière stricte concernant les cotisations CNSS à la charge de l'employé et de l'employeur, et la retenue à la source impôt sur le revenu.]
            
            ARTICLE 5 - OBLIGATION DE LOYAUTÉ ET CONFIDENTIALITÉ ABSOLUE
            [Rédiger une clause de confidentialité absolue, interdisant la divulgation du savoir-faire ou des données de l'employeur sous peine de poursuites civiles et pénales pour concurrence déloyale.]
            
            ARTICLE 6 - RÉSILIATION DU CONTRAT ET RÉSOLUTION DES LITIGES
            [Mentionner les causes légales de rupture, l'obligation de préavis le cas échéant et soumettre la compétence exclusive au Conseil de Prud'hommes du tribunal compétent territorialement.]
            
            FAIT À TUNIS, EN DEUX EXEMPLAIRES ORIGINAUX, LE DATE DU JOUR.
            LU ET APPROUVÉ
            
            AVERTISSEMENT : Document rédigé à titre indicatif par intelligence artificielle. Validations juridiques par un avocat local vivement recommandées.""");
    }

    // ── 9. Contrat de vente ──────────────────────────────────────────────────
    private ContractTemplate contratVente() {
        return t("contrat_vente", "Contrat de Vente (Format Expert)",
            "Acte de cessions ou de vente de bien meuble conforme au COC tunisien, style notarié.",
            """
            [
              {"key":"vendeur","label":"Nom du vendeur","type":"text","required":true},
              {"key":"adresse_vendeur","label":"Adresse du vendeur","type":"text","required":true},
              {"key":"acheteur","label":"Nom de l'acheteur","type":"text","required":true},
              {"key":"adresse_acheteur","label":"Adresse de l'acheteur","type":"text","required":true},
              {"key":"objet","label":"Objet de la vente","type":"text","required":true},
              {"key":"description","label":"Description détaillée du bien","type":"textarea","required":false},
              {"key":"prix","label":"Prix de vente (TND)","type":"text","required":true},
              {"key":"paiement","label":"Modalité de paiement","type":"select","options":["Comptant","Virement bancaire","Chèque","Échelonné"],"required":true},
              {"key":"date_livraison","label":"Date de livraison","type":"date","required":true},
              {"key":"garantie","label":"Garantie","type":"select","options":["Aucune","6 mois","1 an","2 ans"],"required":true}
            ]""",
            """
            CONTEXTE : Tu es un avocat civiliste tunisien spécialisé en droit des contrats et obligations.
            TON : Inattaquable, formel, solennel et extrêmement structuré (Style Notarié).
            LANGUE : Français juridique tunisien pur.
            
            CONSIGNES TECHNIQUES :
            1. AUCUN MARKDOWN (Pas de #, pas de *, ni _ pour formater).
            2. INTERDICTION d'inclure des phrases génériques de politesse ou de présentation vis à vis de l'utilisateur.
            3. Veiller à ce que la mention des articles soit en texte brut "ARTICLE X - " en début de ligne.
            
            STRUCTURE OBLIGATOIRE À SUIVRE EXACTEMENT (Les titres doivent rester EN MAJUSCULES) :
            
            ACTE DE VENTE ET CESSION LÉGALE 
            
            ENTRE LES PARTIES SOUSSIGNÉES :
            
            LA PARTIE VENDERESSE :
            [vendeur], domicilié à [adresse_vendeur], ci-après dénommée "le Vendeur",
            
            LA PARTIE ACQUÉREUSE :
            [acheteur], domicilié à [adresse_acheteur], ci-après dénommée "l'Acheteur",
            
            ÉTANT PRÉALABLEMENT EXPOSÉ ET RAPPELÉ CE QUI SUIT, AU TITRE DE PRÉAMBULE EN VERTU DU CODE DES OBLIGATIONS ET DES CONTRATS (C.O.C) :
            
            ARTICLE 1 - DÉSIGNATION ET OBJET DE LA VENTE
            Par la présente, le Vendeur vend, cède et transporte, sous les garanties ordinaires et de droit en la matière, au profit de l'Acheteur qui accepte le dit achat : [objet].
            Description approfondie et sans vice dissimulé du bien meublé ou immatériel racheté : [description].
            
            ARTICLE 2 - ÉXAMEN ET CONDITIONS DE CESSION
            [Veuillez écrire ici un texte très formel expliquant que l'acheteur s'engage à prendre le bien en l'état au jour de la cession, et stipuler les conditions inhérentes aux vices cachés selon la jurisprudence applicable par les tribunaux civils de l'état Tunisien.]
            
            ARTICLE 3 - MONTANT DE LA TRANSACTION ET MODALITÉS D'ACQUITTEMENT
            La présente transaction mutuelle est fermement actée pour un montant unitaire et définitif arrêté à la somme de [prix] TND (Dinars Tunisiens).
            L'acquittement et la libération des sommes dues s'établira en utilisant le dispositif reconnu par les parties comme suit : [paiement].
            
            ARTICLE 4 - TRANSFERT DES RISQUES ET FACTALTÉ DE JOUISSANCE IMMÉDIATE
            La livraison pure et la faculté de jouissance irrévocable du bien cible auront lieu légalement en date du [date_livraison]. [Détailler les répercussions lors du transfert des risques du vendeur à l'acheteur sur d'éventuelles détériorations liées aux cas de force majeure].
            
            ARTICLE 5 - SÛRETÉS, ASSURANCES ET CLAUSE DE GARANTIE CIVILE
            Garantie fondamentale associée au produit convenu valant pour la période légale ou définie à ce taux par les signataires : [garantie]. Le vendeur se gardera des éventuelles actions en nullité liées à l'éviction par tout tiers.
            
            ARTICLE 6 - JURIDICTION EXCLUSIVE VIS-À-VIS DES LITIGES CONCERNANT LE BIEN
            Faute de conciliation mutuelle, toute querelle prendra effet sous la compétence juridictionnelle exclusive des tribunaux du lieu de localisation du bien.
            
            FAIT EN LA MUNI DES DEUX EXEMPLAIRES DISTINCTS.
            
            AVERTISSEMENT : Document généré par IA à titre indicatif. L'intervention d'un avocat ou notaire est conseillée selon l'ampleur de la cession civile.""");
    }

    // ── 10. Contrat de bail ──────────────────────────────────────────────────
    private ContractTemplate contratBail() {
        return t("contrat_bail", "Contrat de Location (Format Expert)",
            "Bail d'habitation ou commercial rédigé avec une structure experte et solennelle.",
            """
            [
              {"key":"bailleur","label":"Nom du bailleur (propriétaire)","type":"text","required":true},
              {"key":"adresse_bailleur","label":"Adresse du bailleur","type":"text","required":true},
              {"key":"locataire","label":"Nom du locataire","type":"text","required":true},
              {"key":"cin_locataire","label":"CIN du locataire","type":"text","required":false},
              {"key":"adresse_bien","label":"Adresse du bien loué","type":"text","required":true},
              {"key":"type_usage","label":"Usage","type":"select","options":["Habitation","Commercial","Professionnel","Mixte"],"required":true},
              {"key":"loyer","label":"Loyer mensuel (TND)","type":"text","required":true},
              {"key":"caution","label":"Caution / dépôt de garantie (TND)","type":"text","required":true},
              {"key":"duree","label":"Durée du bail","type":"select","options":["1 an","2 ans","3 ans","5 ans"],"required":true},
              {"key":"date_debut","label":"Date de début","type":"date","required":true}
            ]""",
            """
            CONTEXTE : Tu es un avocat pénaliste et civiliste tunisien d'un grand cabinet reconnu pour la rédaction stricte de documents fonciers et immobiliers.
            TON : Inattaquable, formel, solennel et extrêmement structuré (Style Palais Notarié).
            LANGUE : Français juridique tunisien pur.
            
            CONSIGNES TECHNIQUES :
            1. AUCUN MARKDOWN (Pas de #, pas de *, ni _ pour formater).
            2. Les articles doivent commencer textuellement par "ARTICLE X - " en début de ligne.
            
            STRUCTURE OBLIGATOIRE À SUIVRE EXACTEMENT (Les titres doivent rester EN MAJUSCULES) :
            
            ACTE OPÉRATIONNEL DE BAIL ET LOCATION 
            
            LES PARTIES ASSUJETTIES AUX PRÉSENTES DISPOSITIONS :
            
            LE PROPRIÉTAIRE BAILLEUR :
            [bailleur], résident à [adresse_bailleur], ci-après désigné "le Bailleur",
            
            LE PRENEUR LOCATAIRE :
            [locataire], de nationalité tunisienne et porteur de la carte d'identité (CIN) n° [cin_locataire], ci-après désigné "le Locataire",
            
            ARTICLE 1 - DÉSIGNATION MATÉRIELLE ET USAGE COMPATIBLE
            Le Bailleur donne à des fins d'exploitation à titre de bail locatif pur au Preneur qui accepte avec fermeté, l'intégralité du bien immobilier situé de façon connue et cadastrée à l'adresse suivante : [adresse_bien].
            Il est impérieux et non négociable sous peine de résolution immédiate du contrat, que le dit local est spécifiquement consigné pour un usage et une destination de : [type_usage].
            
            ARTICLE 2 - DIMENSIONNEMENT ET ENTRÉE EN JOUISSANCE (LE TEMPS)
            Le bailleur consent au dit locataire une faculté de jouissance irrévocable, actée conventionnellement par un cycle validé d'une durée complète de : [duree]. 
            La date formelle de commencement des obligations s'enclenchera au : [date_debut]. Renouvellement aux termes convenus selon la régulation tunisienne sur la rétention des baux.
            
            ARTICLE 3 - OBLIGATION FINANCIÈRE FIXE MENSUELLE (LE LOYER COMPATIBLE)
            En contrepartie, le loyer stipulé inamovible perçu chaque échelon du mois, sans besoin de rappel ou d'exigence formelle par les autorités de commandement s'aligne exactement au montant global net évalué au prorata de : [loyer] TND mensuels.
            
            ARTICLE 4 - CONSIGNATION ET DÉPÔT DE GARANTIE POUR PRÉJUDICES MURAUX
            Afin de neutraliser d'éventuelles détériorations aux parties structurantes communes de la bâtisse à la remise de clé par voie d'huissier notaire, la caution gelée est remise au moment de rédaction des présentes à hauteur numéraire de : [caution] TND de dinars perçus sans espoir d'intérêts sur la durée au bénéfice du Locataire.
            
            ARTICLE 5 - ENTRETIEN, DÉCOUVERTES MURALES ET RESPONSABILITÉS PATRIMONIALES
            [Formuler en vocabulaire juridique sévère tunisien l'obligation inhérente du locataire de réparer tout trouble ou désordre résultant des éléments qu'il manie dans les locaux ("réparations locatives"). Le bailleur se réservant les dommages de type toiture].
            
            ARTICLE 6 - PROCÉDURE RÉSOLUTOIRE EXPRESSE ET DÉSAISISSMENT EN JUSTICE
            [Construire une clause de "résolution de plein droit" expliquant que si un délai de 30 jours pour facture impayée n'est pas réglé suite à sommation, l'expulsion civile sera sollicitée en référés].
            
            FAIT EN LA MULTIPLICITÉ REQUISE.
            LU ET APPROUVE DE LA MANIFESTATION DES DEUX PARTIES AU DROIT.
            
            AVERTISSEMENT : Document rédigé à titre indicatif par intelligence artificielle. Valable qu'après inscription à Recette des finances de l'état Tunisien et avis d'avocat.""");
    }

    // ── 11. Contrat de partenariat ───────────────────────────────────────────
    private ContractTemplate contratPartenariat() {
        return t("contrat_partenariat", "Contrat de partenariat",
            "Accord de collaboration entre deux entités définissant droits, obligations et partage.",
            """
            [
              {"key":"partenaire1","label":"Nom / Raison sociale partenaire 1","type":"text","required":true},
              {"key":"adresse_p1","label":"Adresse partenaire 1","type":"text","required":true},
              {"key":"partenaire2","label":"Nom / Raison sociale partenaire 2","type":"text","required":true},
              {"key":"adresse_p2","label":"Adresse partenaire 2","type":"text","required":true},
              {"key":"objet","label":"Objet du partenariat","type":"text","required":true},
              {"key":"description","label":"Description des activités communes","type":"textarea","required":true},
              {"key":"contribution1","label":"Apport / contribution du partenaire 1","type":"text","required":true},
              {"key":"contribution2","label":"Apport / contribution du partenaire 2","type":"text","required":true},
              {"key":"partage","label":"Modalités de partage des résultats","type":"textarea","required":true},
              {"key":"duree","label":"Durée","type":"select","options":["1 an","2 ans","3 ans","5 ans","Indéterminée"],"required":true},
              {"key":"date_debut","label":"Date d'entrée en vigueur","type":"date","required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN (ni **, ni #).
            2. Respecter les ARTICLE X -

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            PROTOCOLE IMMUABLE ET CONVENTION DE PARTENARIAT STRATÉGIQUE D'AFFAIRES

            ENTRE LES ENTITÉS SOUS DESIGNÉES EN TANGIBILITÉ :

            PRÉVALANT COMME LE PARTENAIRE OPÉRANT MAJEUR N°1 :
            - [Nom / Raison sociale partenaire 1] et son bureau légal qui opère à : [Adresse partenaire 1]

            ET RECONNU EN INTERDEPENDANCE AU TITRE D'UN PARTENAIRE SOUVERAIN N°2 :
            - [Nom / Raison sociale partenaire 2], opérant ou sis par le lieu : [Adresse partenaire 2]

            IL A ÉTÉ LÉGITIMEMENT SOUTENU AU REGARD DU DROIT COMMERCIAL LES CHAPITRES :

            ARTICLE 1 - VOLONTÉ ET PROFIT MUTUELS DES PARTIES
            L'objectif et la doctrine fondamentale poussant l'engagement s'articule formellement : [Objet du partenariat]. Sous descriptions exhaustives et détails minutieux à observer pour réussite sans brisure contractuelle : [Description des activités communes].

            ARTICLE 2 - SOUMISSIONS PARTICULIÉRES, APPORTS ET EXPERTISES INVESTIS
            L'unilatéral apport consenti avec détermination du PARTENAIRE OPÉRANT MAJEUR N°1 engage et fixe inamoviblement un levier lié aux contraintes : [Apport / contribution du partenaire 1].
            Pour symétrie parfaite le PARTENAIRE SOUVERAIN N°2 ne freinera ses actions, en débloquant sa logistique à savoir : [Apport / contribution du partenaire 2].

            ARTICLE 3 - ARCHITECTURE DU RESSAC FINANCIER REPOSANT SUR LE PROFIT TOTAL
            Répartition et ratio de partage budgétaire garantissant que nulle plainte ou extorsion ne soit envisagée par un partenaire qui ressentirait dol, justifiant via l'équilibre explicité : [Modalités de partage des résultats].

            ARTICLE 4 - LA PERSÉVÉRANCE AFFECTIVE ET CHRONOLOGIQUE
            Tout un pacte requiert temps ou renoncement. La base signée ne connaîtra de trêve unilatérale pour la constance des mois à durée stipulée telle que : [Durée]. Le souffle premier débutera son élan probatoire incontestable au chronomètre : [Date d'entrée en vigueur].

            ARTICLE 5 - LE RANG DU SECRET ET DROIT D'INTELLECTUELLE CO-PROPRIÉTÉ
            La trahison au profit d'un rival local est source de sanction commerciale lourde sans clémence devant le Pôle judiciaire tunisien.

            AVERTISSEMENT : Document généré par IA à titre indicatif, vérification par un professionnel requise.""");
    }

    // ── 12. Transaction (accord amiable) ─────────────────────────────────────
    private ContractTemplate transaction() {
        return t("transaction_amiable", "Transaction (accord amiable)",
            "Accord mettant fin à un litige par des concessions mutuelles, conforme au COC.",
            """
            [
              {"key":"partie1","label":"Première partie (créancier ou demandeur)","type":"text","required":true},
              {"key":"adresse_p1","label":"Adresse partie 1","type":"text","required":true},
              {"key":"partie2","label":"Deuxième partie (débiteur ou défendeur)","type":"text","required":true},
              {"key":"adresse_p2","label":"Adresse partie 2","type":"text","required":true},
              {"key":"litige","label":"Description du litige","type":"textarea","required":true},
              {"key":"accord","label":"Termes de l'accord amiable","type":"textarea","required":true},
              {"key":"montant","label":"Montant de la transaction (TND, si applicable)","type":"text","required":false},
              {"key":"modalites","label":"Modalités d'exécution","type":"textarea","required":false}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN (ni **, ni #).

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            MÉMOIRE TRANSACTIONNEL AMIABLE METTANT PÉNALEMENT FIN AUX LITIGES

            LES ACTEURS SIGNATAIRES DU LITIGE QUI PRÉALABLEMENT SE SONT ENTENDUS :

            PARTIE SOURCE 1 CONCESSIONNAIRE ET CÉDANTE AUX PARDONS:
            [Première partie (créancier ou demandeur)], [Adresse partie 1]

            PARTIE CIBLE 2 ACCORDANTE:
            [Deuxième partie (débiteur ou défendeur)], [Adresse partie 2]

            ARTICLE 1 - SOUVENIR EXPIATOIRE DES DÉSACCORDS FACTUELS
            Ce texte et document de scellement prend effet sous un prisme conflictuel justifié et explicité à la hauteur des dégâts non jugés officiellement qui évoquent les déboires que voici : [Description du litige].

            ARTICLE 2 - MÉCANIQUES EXONÉRATRICES D'ACCORD COMMUN SAUVANT RECOURS
            Pour dissoudre éternellement la contrainte devant magistrat civil / commercial de l'état tunisien, la réciproque des conditions acceptées aveuglement en âme et conscience dicte que la solution passe inéluctablement par la clause mutuelle des deux forces : [Termes de l'accord amiable].

            ARTICLE 3 - OBLIGATIONS FINANCIÈRES RASSURANTES DE COMPENSATION
            En vue d'absorber une possible lésion non réparée, la monnaie locale garantit un tampon financier à indemnisation, sans retenue comptable calculée en monnaie sur le total perçu (Si Néant, écrire nul et sans effet monnayé) et avéré au titre formel : [Montant de la transaction (TND, si applicable)] Dinars de Tunisie.

            ARTICLE 4 - LA PARFAITE LIBÉRATION FINALE
            Dès validation en signature et en paiement sans blocage effectif et reconnu au sein des conditions et moyens exigibles justes définis tel : [Modalités d'exécution]. Les plaideurs initiaux abandonnent toute plainte annexe et collatérale existante et à venir sans réserves sur ledit dossier.

            AVERTISSEMENT : Document généré par IA à titre indicatif, l'abandon d'un droit civil exige validation d'avocat.""");
    }

    // ── 13. Statuts de société ───────────────────────────────────────────────
    private ContractTemplate statutsSociete() {
        return t("statuts_societe", "Statuts de société",
            "Acte constitutif d'une société commerciale (SARL, SA, SUARL, SNC, SCS) en Tunisie.",
            """
            [
              {"key":"denomination","label":"Dénomination sociale","type":"text","required":true},
              {"key":"forme_juridique","label":"Forme juridique","type":"select","options":["SARL","SA","SUARL","SNC","SCS"],"required":true},
              {"key":"siege_social","label":"Siège social","type":"text","required":true},
              {"key":"capital_social","label":"Capital social (TND)","type":"text","required":true},
              {"key":"objet_social","label":"Objet social","type":"textarea","required":true},
              {"key":"duree","label":"Durée de la société (années)","type":"select","options":["10","20","50","99"],"required":true},
              {"key":"associes","label":"Associés / actionnaires avec apports","type":"textarea","required":true},
              {"key":"gerance","label":"Gérant(s) ou dirigeant(s)","type":"text","required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN (ni **, ni #).

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            STATUTS ORIGINELS DE LA MATRICE COMMERCIALE TUNISIENNE SOUS INCORPORATION

            FONDATEURS CONTRACTUELS DES STATUTS ET PORTEURS INITIAUX :
            [Associés / actionnaires avec apports]

            ARTICLE 1 - IDENTITÉ COGNITIVE ET MENTIONS DÉNOMINATRICES
            Il a été solennement instigué sur sol Tunisien une institution, soumise aux actes du code de commerce et CSC, la firme s'appellera avec conviction pure : [Dénomination sociale].
            Le sceau corporatiste retenu après avis légal, définit sa coquille dans l'espace formel comme : [Forme juridique] selon juridiction inhérente de Tunis.

            ARTICLE 2 - RAYONNEMENT ET CHALANDISE DU SIÈGE PRINCIPAL
            La racine inamovible fixant logistique, boite postale d'état, recettes de financements de son centre mère bat pour l'absolue validité des déclarations en : [Siège social].

            ARTICLE 3 - NATURE DE L'AFFAIRE ET CORPS DE COMPÉTENCE SANS FRONTIÉRES
            La motivation, but de création et objectif pécuniaire à travers un secteur de l'économie se basera et s'étendra vers la mission fondamentale déblatérée de la sorte sous : [Objet social].
            La présence de ces affaires s'allongera au delà du temps initial sur l'existence inhérente actée avec fermeté et solidité temporel plafonnée initialement visant : [Durée de la société (années)] Ans de longévité.

            ARTICLE 4 - LA GARANTIE DE PORTEFEUILLE A CAPITAL LIBÉRÉ
            Le coffret d'associés rassemble solidairement une valeur garantie de financement structurel des bases actée au solde brut estimé et libéré pécuniairement aux comptes chiffrant l'immense : [Capital social (TND)] Dinars libérés.

            ARTICLE 5 - INSTANCE GÉRANTE, POUVOIRS EXÉCUTIFS ET DROITS D'ÉCART DES ASSEMBBLÉES
            Le timon sera confié au nom et sur les épaules exécutantes assidues de la firme incombant donc purement par nomination en : [Gérant(s) ou dirigeant(s)]. Ses pleins droits en SARL sans faute graves ni excès des dettes le gardent garant sur l'ensemble du Code.

            AVERTISSEMENT : Document généré par IA à titre indicatif, exigent enregistrement fiscal par avocat.""");
    }

    // ── 14. Pacte d'associés ─────────────────────────────────────────────────
    private ContractTemplate pacteAssocies() {
        return t("pacte_associes", "Pacte d'associés",
            "Accord confidentiel entre associés organisant leurs relations au-delà des statuts.",
            """
            [
              {"key":"societe","label":"Dénomination de la société","type":"text","required":true},
              {"key":"associes","label":"Noms et qualités des associés signataires","type":"textarea","required":true},
              {"key":"gouvernance","label":"Dispositions de gouvernance (votes, décisions)","type":"textarea","required":true},
              {"key":"preemption","label":"Clause de préemption","type":"textarea","required":false},
              {"key":"cession_restrictions","label":"Restrictions à la cession de parts","type":"textarea","required":false},
              {"key":"dividendes","label":"Politique de distribution des dividendes","type":"textarea","required":false},
              {"key":"duree","label":"Durée du pacte","type":"select","options":["3 ans","5 ans","10 ans","Durée de la société"],"required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN (ni **, ni #).

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            PACTE EXTRASTATUTAIRE A CARACTÉRE NON DIFFUSABLE ENTRE CO-ASSN ET FONDATEURS D'ACTIONS

            DÉFINITION DES HAUTS-PORTEURS :
            [Noms et qualités des associés signataires]
            Auprès de l'entité sociétale et conjointe : [Dénomination de la société]

            ARTICLE 1 - PRIMAUTÉ MAJEURE ET SOUVERAINETÉ DE CONSERVATION DES VOTES STRATÉGIQUES
            Pour un horizon confiné dans le périmètre de limitation bornée au bloc de calendrier suivant : [Durée du pacte]. Les votations extrêmes sont régies à distance des protocoles basiques sous de fermes accords non évitables : [Dispositions de gouvernance (votes, décisions)].

            ARTICLE 2 - INVIOLABILITÉ ET PRÉROGATIVES RIGOUREUSES (PRÉEMPTION) D'ACHAT PROTECTEUR
            Le rempart de dilution enclenche des droits absolus aux anciens portefeuilles si vente : [Clause de préemption].

            ARTICLE 3 - VERROUILLAGE SANS AGRÉMENT CONTRE L'ÉTALAGE MINORITAIRE (CESSIONS)
            [Restrictions à la cession de parts]

            ARTICLE 4 - RÉMUNERATION FINANCIÈRE DE BÉNÉFICES LIQUIDÉS EXCEPTIONNELS (LES DIVIDENDES)
            Lors du clos des bilans non déficitaires, s'appliqueront des manœuvres comptables dictées impérieusement hors loi habituelle telles : [Politique de distribution des dividendes].

            AVERTISSEMENT : Document généré par IA à titre indicatif, document privé exigent avocat.""");
    }

    // ── 15. Cession de parts sociales ────────────────────────────────────────
    private ContractTemplate cessionParts() {
        return t("cession_parts", "Cession de parts sociales",
            "Acte de transfert de parts ou actions entre associés ou à un tiers.",
            """
            [
              {"key":"cedant","label":"Nom / Raison sociale du cédant","type":"text","required":true},
              {"key":"adresse_cedant","label":"Adresse du cédant","type":"text","required":true},
              {"key":"cessionnaire","label":"Nom / Raison sociale du cessionnaire","type":"text","required":true},
              {"key":"adresse_cessionnaire","label":"Adresse du cessionnaire","type":"text","required":true},
              {"key":"societe","label":"Dénomination de la société","type":"text","required":true},
              {"key":"nombre_parts","label":"Nombre de parts cédées","type":"text","required":true},
              {"key":"valeur_nominale","label":"Valeur nominale par part (TND)","type":"text","required":true},
              {"key":"prix_cession","label":"Prix total de cession (TND)","type":"text","required":true},
              {"key":"date_cession","label":"Date de la cession","type":"date","required":true},
              {"key":"modalites","label":"Modalités de paiement","type":"select","options":["Comptant","Virement bancaire","Chèque","Échelonné"],"required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN (ni **, ni #).

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            ACTE DEFINITIF SOUMIS A TRANSFERT UNILATERAL DE DROITS ET PARTS SOCIALES COMMERCIALES

            LA PARTIE DESTRUCTIONNELLE : (LE CÉDANT EXCLUSIF QUI QUITTE LA MAJORITE/MINORITE FINANCIÈRE)
            - IDENTITE / RAISON CESSIONNAIRE DE DÉPART : [Nom / Raison sociale du cédant], résident au périmètre spatial suivant : [Adresse du cédant].

            LA PARTIE D'ASSIMILATION ET OBSTRUCTION (CELUI QUI EMPRUNTE LE TITRE) :
            - IDENTITE / CESSIONNAIRE ACQUEREUR D'ACTIONS : [Nom / Raison sociale du cessionnaire], sis et logé géographiquement à : [Adresse du cessionnaire].

            ARTICLE 1 - LÉGITIMATION INTRINSÈQUE AU SEIN DE LA SPHERE SOCIALE IMPLIQUÉE
            Le transfert affecte en profonde lourdité les rouages financiers et capitaliers en interne à l'édifice sociétal reconnu sur acte tel : [Dénomination de la société].
            Le vendeur dépouille sans possibilité de regrets la titrisation de fragments d'actions chiffrés quantitativement au seuil de : [Nombre de parts cédées] parts unitaires.

            ARTICLE 2 - VALORISATION PURE GLOBALE, VALORISATION INDIVIDUELLE ET ENVELOPPE D'ACHAT
            Le compte mathématique accordant crédit pour solde libératoire sur chaque unité scelle la portion infime de rachat justifiant l'équilibre comptable tunisien acté au prorata sans contestation de : [Valeur nominale par part (TND)] TND / part vendue.
            La sommation qui en découle est inabrogeable au volume ferme réclammé devant tribunal au final liquidatif du compte soit le chiffre complet de : [Prix total de cession (TND)] TND Dinars Tunisiens paraphés.
            L'assentiment débouche sur transaction de type formaté en méthode comptable de passage en banque ou monnaie dont voici les contraintes : [Modalités de paiement].

            ARTICLE 3 - EXÉCUTION INSTANTANÉE DIRECTE EN EXAMEN ASSEMBLÉ ET LEVEMENTS DES RETENUES FISCALES
            Action déclenchable, approuvée sous conditions AGE possibles, agissant ce jour même formel et consignant au journal d'états de l'impôt en validant le : [Date de la cession]. Aucun recul droit ou créance inoubliée imputable à autrui ne peut abroger l'avènement futur.

            AVERTISSEMENT : Document généré par IA à titre indicatif, les Recettes des finances de l'état taxeront ces actes sous conseil d'avocat.""");
    }

    // ── 16. Fonds de commerce ────────────────────────────────────────────────
    private ContractTemplate fondsCommerce() {
        return t("fonds_de_commerce", "Cession de fonds de commerce",
            "Acte de vente d'un fonds de commerce conforme à la législation commerciale tunisienne.",
            """
            [
              {"key":"vendeur","label":"Nom / Raison sociale du vendeur","type":"text","required":true},
              {"key":"adresse_vendeur","label":"Adresse du vendeur","type":"text","required":true},
              {"key":"acheteur","label":"Nom / Raison sociale de l'acheteur","type":"text","required":true},
              {"key":"adresse_acheteur","label":"Adresse de l'acheteur","type":"text","required":true},
              {"key":"denomination","label":"Dénomination / Enseigne du fonds","type":"text","required":true},
              {"key":"activite","label":"Activité principale du fonds","type":"text","required":true},
              {"key":"adresse_fonds","label":"Adresse d'exploitation","type":"text","required":true},
              {"key":"prix","label":"Prix de cession (TND)","type":"text","required":true},
              {"key":"elements_inclus","label":"Éléments inclus (clientèle, matériel, stocks, contrats...)","type":"textarea","required":true},
              {"key":"date_cession","label":"Date de la cession","type":"date","required":true}
            ]""",
            """
            RÈGLES ABSOLUES (FORMAT PDF REQUIS) :
            1. AUCUN FORMATAGE MARKDOWN (ni **, ni #).

            STRUCTURE EXACTE À SUIVRE À LA LETTRE :

            ACTE LÉGAL DE SAISIE DE PASSATION D'ENTREPRISE ET CESSION UNILATERALE DE FONDS MATERIEL OU IMMATERIEL COMMERCIAL

            LA MAIN VENDEUSE, QUI S'EVAPORE DANS LE DOSSIER EST LA RESPONSABLE DU TITRE A CE JOUR :
            - [Nom / Raison sociale du vendeur], logée au compte civil ou professionnel au : [Adresse du vendeur]

            LA MAIN POURVOYEUSE D'ACHAT ET RÉCUPERATRICE EN L'ETAT, LE NOUVEL ENTRANT :
            - [Nom / Raison sociale de l'acheteur], fixée judiciairement quant à elle sur son domicilie / local sis au : [Adresse de l'acheteur]

            LE LIEN D'ACCORD OBLIGATIONNEL S'APPUYANT SUR LE CODE COMMERCIAL TUNISIEN PREND NAISSANCE :

            ARTICLE 1 - IMMATÉRIALITÉ, EXPLOITATION, RAYON ET ENSEIGNE DÉFINITIFS INCLUS
            Au cœur l'exigence du rachat sans faille et ambiguïté, justifie l'abandon commercial et le transfert d'acquisitions morales sur une entité d'exploitation aux visuels qui demeurent réels connus sous les vocabulaires des tribunaux selon le nom qui identifie globalement cet espace de chalandise public pour un titre et enseigne inabrogeable : [Dénomination / Enseigne du fonds].

            ARTICLE 2 - BUT DU LOCAL ET CONTEXTE DES ACTIVITÉS PROFESSIONNELLES RATTACHÉES A L'ENCOMBREMENT COMMERCIAL
            Sous une rigueur descriptive claire, la patte et l'œuvre du travail assaini au cours de la longévité de ce fond repose sur des manières marchandes autorisées fiscalement décrites comme : [Activité principale du fonds].
            Les murs ne sont pas achetés par ce transfert mais l'activité de service et marchande se tenait en toute logique formelle physiquement exploitable aux géo-indices tunisiens clairs sous : [Adresse d'exploitation].

            ARTICLE 3 - DECOUPAGE DES PIECES, DE CHALANDISE, LOGICIELS, FOURNISSEUR ET CONTENU GLOBAL
            L'inventaire, qu'il fut par un huissier dressé ou en toute bonne foi commerciale amiable est transféré de manière équitable et totale pour ce qui constitue intrinsèquement les listes avérées qui font corps aux lignes de description exhaustives, à savoir ce qu'il se dote des apports listés et cédés pécuniairement ainsi : [Éléments inclus (clientèle, matériel, stocks, contrats...)].

            ARTICLE 4 - SOLDE ENTIER SÉQUESTRÉ RÉPARTI DANS L'ESPACE PAIEMENT NUMÉRAIRE
            Les comptes sans dol ou falsification, équilibrant la perte pour l'ancien et le coût du neuf requiert numéralement sans évasion un débours comptable en un virement complet (qui subira l'attente légale de quinzaine pour opposition par des fournisseurs insatisfaits sous le code local des créances) plafonnant à : [Prix de cession (TND)] d'unités de dinars locaux validés.

            ARTICLE 5 - L'ACTIVATION DE DATE SOUVERAINE DE PASSASSION ET ENREGISTREMENT AU JORT
            Aucune réclamation de manque à gagner ou dol dérobé aux créanciers ne freinera en instance le changement final à la date absolue dépeinte au : [Date de la cession].

            AVERTISSEMENT : Document généré par IA à titre indicatif, un acte de fonds de commerce doit voir opposition au JORT via avocat impératif.""");
    }

    // =========================================================================
    //  Helper
    // =========================================================================

    private ContractTemplate t(String type, String label, String description,
                                String fieldsJson, String systemPrompt) {
        ContractTemplate ct = new ContractTemplate();
        ct.setTypeContrat(type);
        ct.setLabel(label);
        ct.setDescription(description);
        ct.setFieldsJson(fieldsJson.strip());
        ct.setSystemPrompt(systemPrompt.strip());
        ct.setActive(true);
        return ct;
    }
}
