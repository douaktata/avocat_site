package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Tribunal;

public class TribunalDTO {

    public Long id;
    public String name;
    public String ville;
    public String adresse;
    public String telephone;
    public String email;
    public Boolean isActive;

    public static TribunalDTO fromEntity(Tribunal t) {
        TribunalDTO dto = new TribunalDTO();
        dto.id = t.getId();
        dto.name = t.getName();
        dto.ville = t.getVille();
        dto.adresse = t.getAdresse();
        dto.telephone = t.getTelephone();
        dto.email = t.getEmail();
        dto.isActive = t.getIsActive();
        return dto;
    }
}
