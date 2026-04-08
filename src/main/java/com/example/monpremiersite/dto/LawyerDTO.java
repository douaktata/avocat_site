package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Lawyer;

public class LawyerDTO {
    private Long idl;
    private String specialite;
    private String bar_registration_num;
    private String tel_bureau;
    private String bureau;
    private String region;
    // Linked user fields (populated when user_id is set)
    private Long user_id;
    private String nom;
    private String prenom;
    private String email;
    private String tel;
    private String adresse;
    private String statut;

    public static LawyerDTO fromEntity(Lawyer l) {
        LawyerDTO dto = new LawyerDTO();
        dto.idl = l.getIdl();
        dto.specialite = l.getSpecialite();
        dto.bar_registration_num = l.getBar_registration_num();
        dto.tel_bureau = l.getTel_bureau();
        dto.bureau = l.getBureau();
        dto.region = l.getRegion();
        if (l.getUser() != null) {
            dto.user_id = l.getUser().getIdu();
            dto.nom = l.getUser().getNom();
            dto.prenom = l.getUser().getPrenom();
            dto.email = l.getUser().getEmail();
            dto.tel = l.getUser().getTel();
            dto.adresse = l.getUser().getAdresse();
            dto.statut = l.getUser().getStatut() != null ? l.getUser().getStatut() : "Actif";
        }
        return dto;
    }

    public Long getIdl() { return idl; }
    public void setIdl(Long idl) { this.idl = idl; }
    public String getSpecialite() { return specialite; }
    public void setSpecialite(String specialite) { this.specialite = specialite; }
    public String getBar_registration_num() { return bar_registration_num; }
    public void setBar_registration_num(String bar_registration_num) { this.bar_registration_num = bar_registration_num; }
    public String getTel_bureau() { return tel_bureau; }
    public void setTel_bureau(String tel_bureau) { this.tel_bureau = tel_bureau; }
    public String getBureau() { return bureau; }
    public void setBureau(String bureau) { this.bureau = bureau; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public Long getUser_id() { return user_id; }
    public void setUser_id(Long user_id) { this.user_id = user_id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTel() { return tel; }
    public void setTel(String tel) { this.tel = tel; }
    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
