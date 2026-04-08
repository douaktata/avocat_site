package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.LawyerDTO;
import com.example.monpremiersite.entities.Lawyer;
import com.example.monpremiersite.repository.LawyerRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/lawyers")
public class LawyerController {

    private final LawyerRepository repo;
    private final UserRepository userRepo;

    public LawyerController(LawyerRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<LawyerDTO> all() {
        return repo.findAll().stream().map(LawyerDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LawyerDTO> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(l -> ResponseEntity.ok(LawyerDTO.fromEntity(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<LawyerDTO> getByUser(@PathVariable Long userId) {
        return repo.findByUser_Idu(userId)
                .map(l -> ResponseEntity.ok(LawyerDTO.fromEntity(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LawyerDTO> create(@RequestBody LawyerRequest req) {
        Lawyer l = new Lawyer();
        l.setSpecialite(req.specialite);
        l.setBar_registration_num(req.bar_registration_num);
        l.setTel_bureau(req.tel_bureau);
        l.setBureau(req.bureau);
        l.setRegion(req.region);
        if (req.user_id != null) {
            userRepo.findById(req.user_id).ifPresent(l::setUser);
        }
        return ResponseEntity.status(201).body(LawyerDTO.fromEntity(repo.save(l)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LawyerDTO> update(@PathVariable Long id, @RequestBody LawyerRequest req) {
        return repo.findById(id).map(l -> {
            if (req.specialite != null) l.setSpecialite(req.specialite);
            if (req.bar_registration_num != null) l.setBar_registration_num(req.bar_registration_num);
            if (req.tel_bureau != null) l.setTel_bureau(req.tel_bureau);
            if (req.bureau != null) l.setBureau(req.bureau);
            if (req.region != null) l.setRegion(req.region);
            if (req.user_id != null) {
                userRepo.findById(req.user_id).ifPresent(l::setUser);
            }
            return ResponseEntity.ok(LawyerDTO.fromEntity(repo.save(l)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    static class LawyerRequest {
        public String specialite;
        public String bar_registration_num;
        public String tel_bureau;
        public String bureau;
        public String region;
        public Long user_id;
    }
}
