package com.example.monpremiersite.config;

import com.example.monpremiersite.security.JwtAuthenticationFilter;
import com.example.monpremiersite.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/users/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/roles/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/user-roles/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/lawyers/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/cases/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/appointments/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/documents/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/case-notes/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/trials/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/tasks/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/payments/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/phone-calls/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE")
                .requestMatchers("/presence-journal/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE")
                .requestMatchers("/messages/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }
}
