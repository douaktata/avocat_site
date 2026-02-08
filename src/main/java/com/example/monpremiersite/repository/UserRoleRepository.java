package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.UserRole;
import com.example.monpremiersite.entities.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {

}
