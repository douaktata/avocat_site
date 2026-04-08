package com.example.monpremiersite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public class RegisterRequestDTO {
    private String nom;
    private String prenom;
    private String email;
    private String password;
    private String tel;
    private String adresse;
    private String CIN;
    private LocalDate date_naissance;
    private String role;

    public RegisterRequestDTO() {}

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTel() { return tel; }
    public void setTel(String tel) { this.tel = tel; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    @JsonProperty("CIN")
    public String getCIN() { return CIN; }
    @JsonProperty("CIN")
    public void setCIN(String CIN) { this.CIN = CIN; }

    public LocalDate getDate_naissance() { return date_naissance; }
    public void setDate_naissance(LocalDate date_naissance) { this.date_naissance = date_naissance; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
