package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.ContractTemplate;

public class ContractTemplateDTO {
    private Long id;
    private String label;
    private String typeContrat;
    private String description;
    private String fieldsJson;

    public static ContractTemplateDTO fromEntity(ContractTemplate e) {
        ContractTemplateDTO dto = new ContractTemplateDTO();
        dto.setId(e.getId());
        dto.setLabel(e.getLabel());
        dto.setTypeContrat(e.getTypeContrat()); 
        dto.setDescription(e.getDescription());
        dto.setFieldsJson(e.getFieldsJson());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getTypeContrat() { return typeContrat; }
    public void setTypeContrat(String typeContrat) { this.typeContrat = typeContrat; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFieldsJson() { return fieldsJson; }
    public void setFieldsJson(String fieldsJson) { this.fieldsJson = fieldsJson; }
}
