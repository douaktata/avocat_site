package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idu;

    private String nom;
    private String prenom;
    private String email;

    @Column(nullable = false)
    private String password;

    private String adresse;
    private String CIN;
    private String tel;

    private LocalDateTime created_at;
    private LocalDate date_naissance;
    private String statut = "Actif";
    private String photo_url;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_role",
            joinColumns = @JoinColumn(name = "idu"),
            inverseJoinColumns = @JoinColumn(name = "idr"))
    @JsonIgnore
    private Set<Role> roles = new HashSet<>();

    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getCIN() { return CIN; }
    public void setCIN(String CIN) { this.CIN = CIN; }

    public String getTel() { return tel; }
    public void setTel(String tel) { this.tel = tel; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDate getDate_naissance() { return date_naissance; }
    public void setDate_naissance(LocalDate date_naissance) { this.date_naissance = date_naissance; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getPhoto_url() { return photo_url; }
    public void setPhoto_url(String photo_url) { this.photo_url = photo_url; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
}
