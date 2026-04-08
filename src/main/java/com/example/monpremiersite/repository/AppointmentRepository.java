package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUser_Idu(Long userId);

    @Query("SELECT a FROM Appointment a WHERE a.appointment_date BETWEEN :start AND :end")
    List<Appointment> findByAppointment_dateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT a FROM Appointment a WHERE a.user.idu = :userId AND a.appointment_date BETWEEN :start AND :end")
    List<Appointment> findByUser_IduAndAppointment_dateBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
