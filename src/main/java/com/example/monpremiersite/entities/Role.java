package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idr;

    private String role_name;

    @ManyToMany(mappedBy = "roles")
    @JsonIgnore
    private Set<User> users = new HashSet<>();

    public Long getIdr() { return idr; }
    public void setIdr(Long idr) { this.idr = idr; }

    public String getRole_name() { return role_name; }
    public void setRole_name(String role_name) { this.role_name = role_name; }

    public Set<User> getUsers() { return users; }
    public void setUsers(Set<User> users) { this.users = users; }
}
