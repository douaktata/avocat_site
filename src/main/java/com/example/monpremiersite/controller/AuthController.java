package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.AuthResponseDTO;
import com.example.monpremiersite.dto.ErrorResponse;
import com.example.monpremiersite.dto.LoginRequestDTO;
import com.example.monpremiersite.dto.RegisterRequestDTO;
import com.example.monpremiersite.entities.Role;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.repository.RoleRepository;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.security.JwtUtil;
import com.example.monpremiersite.security.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository,
                          RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtil.generateToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Set<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

            return ResponseEntity.ok(new AuthResponseDTO(
                jwt,
                user.getIdu(),
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                roles
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                new ErrorResponse(401, "Unauthorized", "Invalid email or password")
            );
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.status(400).body(
                new ErrorResponse(400, "Bad Request", "Email already in use")
            );
        }

        User user = new User();
        user.setNom(registerRequest.getNom());
        user.setPrenom(registerRequest.getPrenom());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setTel(registerRequest.getTel());
        user.setAdresse(registerRequest.getAdresse());
        user.setCIN(registerRequest.getCIN());
        user.setDate_naissance(registerRequest.getDate_naissance());
        user.setCreated_at(LocalDateTime.now());

        Role clientRole = roleRepository.findByRoleName("CLIENT")
                .orElseThrow(() -> new RuntimeException("CLIENT role not found. Please seed the database."));

        Set<Role> roles = new HashSet<>();
        roles.add(clientRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        return ResponseEntity.status(201).body(new RegistrationSuccessDTO(
            savedUser.getIdu(),
            savedUser.getEmail(),
            "User registered successfully. Please login."
        ));
    }

    private static class RegistrationSuccessDTO {
        private Long idu;
        private String email;
        private String message;

        public RegistrationSuccessDTO(Long idu, String email, String message) {
            this.idu = idu;
            this.email = email;
            this.message = message;
        }

        public Long getIdu() { return idu; }
        public String getEmail() { return email; }
        public String getMessage() { return message; }
    }
}
