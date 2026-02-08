package com.example.monpremiersite.dto;

import java.util.Set;

public class RoleDTO {
    private Long idr;
    private String role_name;
    private Set<UserDTO> users;

    public RoleDTO() {}

    public RoleDTO(Long idr, String role_name, Set<UserDTO> users) {
        this.idr = idr;
        this.role_name = role_name;
        this.users = users;
    }

    public Long getIdr() { return idr; }
    public void setIdr(Long idr) { this.idr = idr; }

    public String getRole_name() { return role_name; }
    public void setRole_name(String role_name) { this.role_name = role_name; }

    public Set<UserDTO> getUsers() { return users; }
    public void setUsers(Set<UserDTO> users) { this.users = users; }
}
