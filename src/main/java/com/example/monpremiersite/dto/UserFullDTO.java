package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Role;
import com.example.monpremiersite.entities.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public class UserFullDTO {
    private Long idu;
    private String nom;
    private String prenom;
    private String email;
    private String adresse;
    private String CIN;
    private String tel;
    private LocalDateTime created_at;
    private LocalDate date_naissance;
    private String statut;
    private String photo_url;
    private Set<String> roles;

    public static UserFullDTO fromEntity(User u) {
        UserFullDTO dto = new UserFullDTO();
        dto.idu = u.getIdu();
        dto.nom = u.getNom();
        dto.prenom = u.getPrenom();
        dto.email = u.getEmail();
        dto.adresse = u.getAdresse();
        dto.CIN = u.getCIN();
        dto.tel = u.getTel();
        dto.created_at = u.getCreated_at();
        dto.date_naissance = u.getDate_naissance();
        dto.statut = u.getStatut() != null ? u.getStatut() : "Actif";
        dto.photo_url = u.getPhoto_url();
        dto.roles = u.getRoles().stream().map(Role::getRole_name).collect(Collectors.toSet());
        return dto;
    }

    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
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
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
