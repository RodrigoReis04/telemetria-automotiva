// ==========================================================
// CONTROLADOR DO DASHBOARD DE FROTAS (B2B - SPA)
// ==========================================================

// Função para alternar entre as abas do painel corporativo
function mudarAba(abaId) {
    // Esconde todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove a classe active de todos os itens do menu
    document.querySelectorAll('.menu-list li').forEach(item => {
        item.classList.remove('active');
    });

    // Exibe a aba selecionada e ativa o menu correspondente
    if (abaId === 'live') {
        document.getElementById('tab-live').style.display = 'block';
        document.getElementById('menu-live').classList.add('active');
    } else if (abaId === 'routes') {
        document.getElementById('tab-routes').style.display = 'block';
        document.getElementById('menu-routes').classList.add('active');
    } else if (abaId === 'reports') {
        document.getElementById('tab-reports').style.display = 'block';
        document.getElementById('menu-reports').classList.add('active');
    }
}

// Seleção de veículos na aba de Monitoramento Ao Vivo
function selecionarVeiculo(nomeVeiculo, motorista, velocidade, consumo, status, event) {
    document.getElementById('selected-vehicle-title').innerText = `Telemetria: ${nomeVeiculo}`;
    document.getElementById('tel-speed').innerHTML = `${velocidade}`;
    document.getElementById('tel-rpm').innerHTML = `${Math.floor(Math.random() * 1000) + 1800} <span class="unit">RPM</span>`;
    document.getElementById('tel-spatial').innerHTML = `${consumo}`;
    
    const statusElement = document.getElementById('tel-status');
    statusElement.innerText = status;
    
    if(status.includes('Normal') || status.includes('Eficiente')) {
        statusElement.className = 'status-good';
    } else {
        statusElement.className = 'status-bad';
    }

    document.querySelectorAll('.vehicle-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

// Simulação da IA gerando o Laudo de Desempenho dos Motoristas
function gerarLaudoIA() {
    const container = document.getElementById('laudo-ia-container');
    container.innerHTML = `<span style="color: var(--neon-blue);">⏳ Processando telemetria de 12 veículos via modelo preditivo...</span>`;
    
    setTimeout(() => {
        container.innerHTML = `
            <strong style="color: var(--neon-blue);">🤖 Laudo Técnico Gerado em ${new Date().toLocaleDateString()} - 03 Motoristas Analisados:</strong><br><br>
            • <strong>João Silva (Corsa ABC-1234):</strong> Excelente padrão de condução. Mantém rotação estável e índice de eficiência de 14.2 Km/L. Risco operacional baixo.<br><br>
            • <strong>Carlos Souza (Uno XYZ-5678):</strong> ⚠️ Alerta de ociosidade. Detectado tempo elevado em marcha lenta (acima de 10% da jornada). Sugere-se treinamento de conscientização sobre consumo em ponto morto.<br><br>
            • <strong>Marcos Lima (Gol DEF-9012):</strong> Bom aproveitamento de inércia em cruzeiro. Consumo dentro da média esperada da frota (12.5 Km/L).
        `;
    }, 1200);
}