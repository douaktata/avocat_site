package com.example.monpremiersite.security;

import com.example.monpremiersite.entities.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

public class UserDetailsImpl implements UserDetails {

    private Long idu;
    private String email;
    private String password;
    private String statut;
    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long idu, String email, String password, String statut,
                           Collection<? extends GrantedAuthority> authorities) {
        this.idu = idu;
        this.email = email;
        this.password = password;
        this.statut = statut;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        Collection<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getRole_name()))
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getIdu(),
                user.getEmail(),
                user.getPassword(),
                user.getStatut(),
                authorities
        );
    }

    public Long getIdu() { return idu; }

    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return password; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !"Bloqué".equals(statut); }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
