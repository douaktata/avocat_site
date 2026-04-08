package com.example.monpremiersite.events;

import com.example.monpremiersite.entities.Audience;
import org.springframework.context.ApplicationEvent;

public class AudienceCreatedEvent extends ApplicationEvent {
    private final Audience audience;

    public AudienceCreatedEvent(Object source, Audience audience) {
        super(source);
        this.audience = audience;
    }

    public Audience getAudience() { return audience; }
}
