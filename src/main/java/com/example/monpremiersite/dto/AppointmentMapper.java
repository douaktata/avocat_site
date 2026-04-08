package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Appointment;

public class AppointmentMapper {

    public static AppointmentDTO toDTO(Appointment appointment) {
        if (appointment == null) {
            return null;
        }

        UserInfoDTO userInfo = null;
        if (appointment.getUser() != null) {
            userInfo = new UserInfoDTO(
                appointment.getUser().getIdu(),
                appointment.getUser().getNom(),
                appointment.getUser().getPrenom(),
                appointment.getUser().getPhoto_url()
            );
        }

        return new AppointmentDTO(
            appointment.getIda(),
            userInfo,
            appointment.getAppointment_date(),
            appointment.getStatus(),
            appointment.getCreated_at(),
            appointment.getReason()
        );
    }
}
