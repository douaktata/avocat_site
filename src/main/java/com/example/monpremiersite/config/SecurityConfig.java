package com.example.monpremiersite.config;

import com.example.monpremiersite.security.JwtAuthenticationFilter;
import com.example.monpremiersite.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
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
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(authenticationProvider());
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
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
                .requestMatchers("/", "/index.html", "/static/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/users/by-role/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/users/*/photo").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/users/*/change-password").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/users/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/users/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT", "SECRETAIRE", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/users/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT")
                .requestMatchers("/users/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/staff", "/staff/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT")
                .requestMatchers("/roles/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/user-roles/**").hasAuthority("ADMINISTRATEUR")
                .requestMatchers("/lawyers/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "STAGIAIRE")
                .requestMatchers("/cases/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.GET,    "/api/cases/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.POST,   "/api/cases/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.PUT,    "/api/cases/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/cases/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers("/appointments/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/documents/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "STAGIAIRE", "CLIENT")
                .requestMatchers("/documents/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "STAGIAIRE")
                .requestMatchers("/case-notes/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/trials/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers("/trials/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/slots", "/slots/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT", "CLIENT", "SECRETAIRE")
                .requestMatchers("/slots", "/slots/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT", "SECRETAIRE")
                .requestMatchers("/tasks/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "STAGIAIRE")
.requestMatchers("/invoices/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT")
                .requestMatchers("/client-portal/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT")
                .requestMatchers("/receipts/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT")
                .requestMatchers("/tribunals/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT", "SECRETAIRE")
                .requestMatchers("/provisions/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT", "SECRETAIRE", "CLIENT")
                .requestMatchers("/timesheets/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT", "STAGIAIRE")
                .requestMatchers("/reminders/**").hasAnyAuthority("ADMINISTRATEUR", "AVOCAT")
                .requestMatchers("/phone-calls/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/presence-journal/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/presence-journals/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT")
                .requestMatchers("/messages/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .requestMatchers("/api/chat/**").hasAnyAuthority("ADMINISTRATEUR", "SECRETAIRE", "AVOCAT", "CLIENT", "STAGIAIRE")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }
}
