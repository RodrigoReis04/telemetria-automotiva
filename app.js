/* ==========================================================
 * CONTROLADOR DA INTERFACE (APP.JS)
 * Gerencia a renderização do DOM, manipulação do Chart.js
 * e cálculos dinâmicos de custos e estatísticas.
 * ========================================================== */

// 1. Inicialização do Gráfico de Histograma (Chart.js)
const ctx = document.getElementById('histograma').getContext('2d');
const graficoConsumo = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['1km', '2km', '3km', '4km', '5km', '6km', '7km'],
        datasets: [{
            label: 'Consumo (mL/Km)',
            data: [0, 0, 0, 0, 0, 0, 0], 
            backgroundColor: '#cccccc', // Barras cinzas-claras minimalistas
            borderRadius: 4,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#222222' },
                ticks: { color: '#777777', stepSize: 50 }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#777777' }
            }
        },
        animation: {
            duration: 250 
        }
    }
});

// Função utilitária para formatar segundos em MM:SS
function formatarTempo(segundosTotal) {
    const minutos = Math.floor(segundosTotal / 60);
    const segundos = segundosTotal % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// Função global para alternar entre as abas do aplicativo (Painel, Histórico, Ajustes)
function mudarAba(nomeAba) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    if (nomeAba === 'dashboard') {
        document.getElementById('view-dashboard').classList.add('active');
    } else if (nomeAba === 'history') {
        document.getElementById('view-history').classList.add('active');
    } else if (nomeAba === 'settings') {
        document.getElementById('view-settings').classList.add('active');
    }

    event.currentTarget.classList.add('active');
}

// 2. Instanciação e Conexão do Simulador com a Interface
const telemetria = new SimuladorTelemetria((dados) => {
    
    // Atualiza Tempo de Viagem e RPM/Velocidade
    document.getElementById('trip-time').innerText = `Tempo: ${formatarTempo(dados.tempo_viagem_seg)}`;
    document.getElementById('rpm-value').innerText = dados.rpm;
    document.getElementById('speed-value').innerHTML = `${dados.velocidade_kmh} <span class="unit">km/h</span>`;
    
    // Calcula Eficiência Geral (Km/L) tratada contra divisão por zero
    let eficienciaKmL = "0.0";
    if (dados.velocidade_kmh > 0 && dados.metricas.consumo_espacial_mL_km > 0) {
        eficienciaKmL = (1000 / dados.metricas.consumo_espacial_mL_km).toFixed(1);
    }
    document.getElementById('efficiency-value').innerHTML = `${eficienciaKmL} <span class="unit">Km/L</span>`;
    
    // Atualiza Litros Totais Consumidos
    document.getElementById('total-litros').innerText = dados.metricas.litros_totais;

    // === CÁLCULO DINÂMICO DO CUSTO DA VIAGEM ===
    // Pega o valor digitado no input de configurações. Se estiver vazio, assume 5.89 por padrão.
    const precoLitro = parseFloat(document.getElementById('preco-combustivel').value) || 5.89;
    const custoTotalViagem = dados.metricas.litros_totais * precoLitro;
    
    // Renderiza o custo formatado em Reais na tela principal
    document.getElementById('total-custo').innerText = `R$ ${custoTotalViagem.toFixed(2).replace('.', ',')}`;
    // ===========================================

    // Atualiza Indicadores de Consumo na Base
    document.getElementById('spatial-value').innerHTML = `${dados.metricas.consumo_espacial_mL_km} <span class="unit">mL/Km</span>`;
    document.getElementById('temporal-value').innerHTML = `${dados.metricas.consumo_temporal_mL_min.toFixed(1)} <span class="unit">mL/Min</span>`;
    
    // Regra de Negócio Visual (Linha de Base Colorida: Azul Neon vs Vermelho Alerta)
    const temporalValueElement = document.getElementById('temporal-value');
    if (dados.metricas.acima_da_media) {
        temporalValueElement.classList.remove('status-good');
        temporalValueElement.classList.add('status-bad');
    } else {
        temporalValueElement.classList.remove('status-bad');
        temporalValueElement.classList.add('status-good');
    }

    // 3. Atualização Dinâmica do Histograma (Deslocamento de Fila / Shift & Push)
    let dadosGrafico = graficoConsumo.data.datasets[0].data;
    dadosGrafico.shift(); 
    dadosGrafico.push(dados.metricas.consumo_espacial_mL_km); 
    graficoConsumo.update();
});

// Inicialização automática ao carregar a janela do navegador
window.onload = () => {
    telemetria.iniciar();
};