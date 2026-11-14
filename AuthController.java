package com.midnight.fleet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Libera o CORS para o Front-end conversar com a API
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> autenticar(@RequestBody Map<String, String> credenciais) {
        String email = credenciais.get("email");
        String senha = credenciais.get("senha");
        String perfil = credenciais.get("perfil");

        // Simulação de validação real no backend (No futuro, consultaria o MySQL com Spring Data JPA)
        if (("gestor@transportes.com".equals(email) && "123".equals(senha)) ||
            ("admin@telemetria.com".equals(email) && "admin".equals(senha))) {

            Map<String, Object> resposta = new HashMap<>();
            String tokenSimulado = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + java.util.Base64.getEncoder().encodeToString(email.getBytes()) + ".sig_secure_java_2026";
            
            resposta.put("token", tokenSimulado);
            resposta.put("status", "SUCESSO");
            resposta.put("role", perfil);
            resposta.put("mensagem", "Autenticado com sucesso via Spring Security.");

            return ResponseEntity.ok(resposta);
        }

        return ResponseEntity.status(401).body(Map.of("erro", "Credenciais inválidas no servidor Java."));
    }
}