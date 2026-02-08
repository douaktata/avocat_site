package com.example.monpremiersite.dto;

public class UserRoleDTO {
    private Long idu;
    private Long idr;

    public UserRoleDTO() {}

    public UserRoleDTO(Long idu, Long idr) {
        this.idu = idu;
        this.idr = idr;
    }

    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }

    public Long getIdr() { return idr; }
    public void setIdr(Long idr) { this.idr = idr; }

}
