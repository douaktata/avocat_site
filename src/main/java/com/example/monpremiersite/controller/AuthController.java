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
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
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

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

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

            if ("Inactif".equals(user.getStatut())) {
                return ResponseEntity.status(403).body(
                    new ErrorResponse(403, "Forbidden", "Compte bloqué. Contactez votre administrateur.")
                );
            }

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

        // Self-registration always assigns CLIENT role.
        // Other roles (AVOCAT, SECRETAIRE, STAGIAIRE) are assigned by an ADMINISTRATEUR.
        Role selectedRole = roleRepository.findByRoleName("CLIENT")
                .orElseThrow(() -> new RuntimeException("Role CLIENT not found. Please seed the database."));


        Set<Role> roles = new HashSet<>();
        roles.add(selectedRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        return ResponseEntity.status(201).body(new RegistrationSuccessDTO(
            savedUser.getIdu(),
            savedUser.getEmail(),
            "User registered successfully. Please login."
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Aucun compte trouvé avec cet email.");
            return ResponseEntity.status(404).body(err);
        }
        User user = optUser.get();
        String tempPassword = generateTempPassword();
        userRepository.resetPasswordByEmail(email, passwordEncoder.encode(tempPassword));
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(email);
            helper.setSubject("JurisHub - Reinitialisation de votre mot de passe");
            helper.setText(
                "<p>Bonjour " + user.getPrenom() + " " + user.getNom() + ",</p>" +
                "<p>Votre nouveau mot de passe temporaire est : <strong>" + tempPassword + "</strong></p>" +
                "<p>Veuillez vous connecter et modifier votre mot de passe des que possible.</p>" +
                "<p>L'equipe JurisHub</p>",
                true
            );
            mailSender.send(msg);
        } catch (Exception e) {
            // email failed but password was already reset — still return success
        }
        Map<String, String> ok = new HashMap<>();
        ok.put("message", "Un nouveau mot de passe a ete envoye a votre adresse email.");
        return ResponseEntity.ok(ok);
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
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
