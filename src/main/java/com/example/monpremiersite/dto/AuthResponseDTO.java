package com.example.monpremiersite.dto;

import java.util.Set;

public class AuthResponseDTO {
    private String token;
    private String type = "Bearer";
    private Long idu;
    private String email;
    private String nom;
    private String prenom;
    private Set<String> roles;

    public AuthResponseDTO() {}

    public AuthResponseDTO(String token, Long idu, String email, String nom, String prenom, Set<String> roles) {
        this.token = token;
        this.idu = idu;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.roles = roles;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
