package com.example.monpremiersite.dto;

public class UserInfoDTO {
    private Long idu;
    private String nom;
    private String prenom;
    private String photo_url;

    public UserInfoDTO() {}

    public UserInfoDTO(Long idu, String nom, String prenom) {
        this.idu = idu;
        this.nom = nom;
        this.prenom = prenom;
    }

    public UserInfoDTO(Long idu, String nom, String prenom, String photo_url) {
        this.idu = idu;
        this.nom = nom;
        this.prenom = prenom;
        this.photo_url = photo_url;
    }

    // Getters and Setters
    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getPhoto_url() { return photo_url; }
    public void setPhoto_url(String photo_url) { this.photo_url = photo_url; }
}
