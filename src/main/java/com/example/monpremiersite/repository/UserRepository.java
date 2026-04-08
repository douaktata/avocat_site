package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.role_name = :roleName")
    List<User> findByRoles_Role_name(@Param("roleName") String roleName);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.password = :password, u.statut = CASE WHEN u.statut = 'Bloqué' THEN 'Actif' ELSE u.statut END WHERE u.email = :email")
    int resetPasswordByEmail(@Param("email") String email, @Param("password") String password);
}
