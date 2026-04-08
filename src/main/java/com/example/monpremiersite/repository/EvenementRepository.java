package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Evenement;
import com.example.monpremiersite.entities.StatutEvenement;
import com.example.monpremiersite.entities.TypeEvenement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    List<Evenement> findByAvocatIduAndDateDebutBetween(Long avocatId, LocalDateTime start, LocalDateTime end);

    List<Evenement> findByAvocatIduAndStatutNot(Long avocatId, StatutEvenement statut);

    List<Evenement> findByDateDebutBetweenAndAvocatIdu(LocalDateTime start, LocalDateTime end, Long avocatId);

    List<Evenement> findByTypeAndAvocatIdu(TypeEvenement type, Long avocatId);

    List<Evenement> findByStatut(StatutEvenement statut);

    List<Evenement> findByCaseEntityIdc(Long caseId);

    List<Evenement> findByClientIdu(Long clientId);

    List<Evenement> findByAudienceId(Long audienceId);

    List<Evenement> findByAppointmentId(Long appointmentId);

    List<Evenement> findByTaskId(Long taskId);

    @Query("SELECT e FROM Evenement e WHERE e.avocat.idu = :avocatId " +
           "AND e.statut NOT IN ('ANNULE', 'REPORTE') " +
           "AND e.dateDebut < :fin AND e.dateFin > :debut")
    List<Evenement> findConflicts(@Param("avocatId") Long avocatId,
                                  @Param("debut") LocalDateTime debut,
                                  @Param("fin") LocalDateTime fin);
}
