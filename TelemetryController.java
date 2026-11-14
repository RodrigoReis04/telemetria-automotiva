package com.midnight.fleet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/telemetria")
@CrossOrigin(origins = "*")
public class TelemetryController {

    @GetMapping("/frota")
    public ResponseEntity<List>> listarTelemetriaFrota() {
        // Dados gerados pelo backend para entregar ao Front-end B2B
        List> frota = List.of(
            Map.of("id", 1, "modelo", "Chevrolet Corsa 1.0", "placa", "ABC-1234", "motorista", "João Silva", "velocidade", 82, "consumo", "14.2 Km/L", "status", "Normal"),
            Map.of("id", 2, "modelo", "Fiat Uno 1.4", "placa", "XYZ-5678", "motorista", "Carlos Souza", "velocidade", 0, "consumo", "9.1 Km/L", "status", "Marcha Lenta"),
            Map.of("id", 3, "modelo", "VW Gol 1.6", "placa", "DEF-9012", "motorista", "Marcos Lima", "velocidade", 65, "consumo", "12.5 Km/L", "status", "Normal")
        );

        return ResponseEntity.ok(frota);
    }
}