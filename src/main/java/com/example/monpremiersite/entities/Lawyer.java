package com.example.monpremiersite.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "lawyers")
public class Lawyer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idl;

    private String specialite;
    private String bar_registration_num;
    private String tel_bureau;
    private String bureau;
    private String region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private com.example.monpremiersite.entities.User user;

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

    public com.example.monpremiersite.entities.User getUser() { return user; }
    public void setUser(com.example.monpremiersite.entities.User user) { this.user = user; }
}
