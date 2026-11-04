// ==========================================================
// MÓDULO DE AUTENTICAÇÃO E SEGURANÇA (ROBUST AUTH)
// ==========================================================

// Base de dados simulada do Back-end (No futuro, virá do Java Spring Boot via /api/auth/login)
const USUARIOS_AUTORIZADOS = [
    { email: "gestor@transportes.com", senha: "123", role: "ROLE_FLEET_MANAGER", nome: "Carlos Gestor" },
    { email: "admin@telemetria.com", senha: "admin", role: "ROLE_ADMIN", nome: "Engenheiro Master" }
];

function realizarLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('email').value.trim();
    const senhaInput = document.getElementById('senha').value.trim();
    const perfilSelect = document.getElementById('perfil').value;
    const errorMsg = document.getElementById('error-msg');

    // Busca o usuário na "base de dados"
    const usuarioEncontrado = USUARIOS_AUTORIZADOS.find(u => u.email === emailInput && u.role === perfilSelect);

    // Validação estrita de credenciais
    if (usuarioEncontrado && usuarioEncontrado.senha === senhaInput) {
        errorMsg.style.display = 'none';

        // Simulação de geração de um Token JWT assinado com claims de segurança
        const payload = {
            sub: usuarioEncontrado.email,
            name: usuarioEncontrado.nome,
            role: usuarioEncontrado.role,
            exp: Date.now() + (2 * 60 * 60 * 1000) // Validade de 2 horas
        };
        
        const tokenSimulado = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify(payload)) + ".sig_secure_hash_2026";

        // Armazenamento seguro no sessionStorage
        sessionStorage.setItem('jwt_token', tokenSimulado);
        sessionStorage.setItem('user_role', usuarioEncontrado.role);
        sessionStorage.setItem('user_name', usuarioEncontrado.nome);

        // Redireciona para o painel
        window.location.href = 'index.html';
    } else {
        // Bloqueia e exibe mensagem de erro corporativa
        errorMsg.innerText = "Credenciais inválidas ou perfil incorreto para este usuário.";
        errorMsg.style.display = 'block';
    }
}

// Função de Proteção de Rota (Guard de Segurança)
function verificarAutenticacao() {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Opcional: Aqui poderíamos checar a expiração do token (payload.exp)
}

// Função de Logout Seguro
function realizarLogout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}