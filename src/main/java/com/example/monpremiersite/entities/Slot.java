package com.example.monpremiersite.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "slots")
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jour;
    private String date; // "YYYY-MM-DD" — date spécifique (prioritaire sur jour)
    private String heureDebut;
    private String heureFin;
    private int dureeConsultation;
    private boolean actif;

    public Slot() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJour() { return jour; }
    public void setJour(String jour) { this.jour = jour; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getHeureDebut() { return heureDebut; }
    public void setHeureDebut(String heureDebut) { this.heureDebut = heureDebut; }

    public String getHeureFin() { return heureFin; }
    public void setHeureFin(String heureFin) { this.heureFin = heureFin; }

    public int getDureeConsultation() { return dureeConsultation; }
    public void setDureeConsultation(int dureeConsultation) { this.dureeConsultation = dureeConsultation; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }
}
