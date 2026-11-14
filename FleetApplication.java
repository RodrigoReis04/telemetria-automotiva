package com.midnight.fleet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FleetApplication {

    public static void main(String[] args) {
        SpringApplication.run(FleetApplication.class, args);
        System.out.println("==================================================");
        System.out.println("🚗 MIDNIGHT TECH FLEET BACKEND ONLINE (Port: 8080)");
        System.out.println("==================================================");
    }
}