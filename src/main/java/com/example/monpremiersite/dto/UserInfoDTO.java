package com.example.monpremiersite.dto;

public class UserInfoDTO {
    private Long idu;
    private String nom;
    private String prenom;

    public UserInfoDTO() {}

    public UserInfoDTO(Long idu, String nom, String prenom) {
        this.idu = idu;
        this.nom = nom;
        this.prenom = prenom;
    }

    // Getters and Setters
    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
}
