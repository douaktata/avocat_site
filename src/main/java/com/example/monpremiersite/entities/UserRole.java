package com.example.monpremiersite.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "user_role")
public class UserRole {
    @EmbeddedId
    private UserRoleId id;

    @ManyToOne
    @MapsId("idu")
    @JoinColumn(name = "idu")
    private User user;

    @ManyToOne
    @MapsId("idr")
    @JoinColumn(name = "idr")
    private Role role;

    public UserRoleId getId() { return id; }
    public void setId(UserRoleId id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
