package com.example.monpremiersite.events;

import com.example.monpremiersite.entities.Appointment;
import org.springframework.context.ApplicationEvent;

public class AppointmentCreatedEvent extends ApplicationEvent {
    private final Appointment appointment;

    public AppointmentCreatedEvent(Object source, Appointment appointment) {
        super(source);
        this.appointment = appointment;
    }

    public Appointment getAppointment() { return appointment; }
}
