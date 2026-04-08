package com.example.monpremiersite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MonpremiersiteApplication {

	public static void main(String[] args) {
		SpringApplication.run(MonpremiersiteApplication.class, args);
	}

}
