// ==========================================================
// APLICAÇÃO PRINCIPAL - TELEMETRIA B2C (MIDNIGHT TECH)
// ==========================================================

// Função auxiliar para formatar segundos em MM:SS
function formatarTempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Função de Tela Cheia para o painel do veículo
function alternarTelaCheia() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Erro ao ativar tela cheia: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ==========================================================
// CONFIGURAÇÃO DO GRÁFICO (Chart.js)
// ==========================================================
const ctx = document.getElementById('graficoConsumo').getContext('2d');
const graficoConsumo = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(15).fill(''),
        datasets: [{
            label: 'Consumo Espacial (mL/Km)',
            data: Array(15).fill(0),
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: {
                grid: { color: '#2a2e39' },
                ticks: { color: '#8b949e', font: { size: 10 } },
                beginAtZero: true
            }
        }
    }
});

// ==========================================================
// CONEXÃO COM O SIMULADOR DE TELEMETRIA
// ==========================================================
const telemetria = new SimuladorTelemetria((dados) => {
    
    // 1. Atualiza Tempo de Viagem e RPM/Velocidade
    document.getElementById('trip-time').innerText = `Tempo: ${formatarTempo(dados.tempo_viagem_seg)}`;
    document.getElementById('rpm-value').innerText = dados.rpm;
    document.getElementById('speed-value').innerHTML = `${dados.velocidade_kmh} <span class="unit">km/h</span>`;
    
    // 2. Calcula Eficiência Geral (Km/L) tratada contra divisão por zero
    let eficienciaKmL = "0.0";
    if (dados.velocidade_kmh > 0 && dados.metricas.consumo_espacial_mL_km > 0) {
        eficienciaKmL = (1000 / dados.metricas.consumo_espacial_mL_km).toFixed(1);
    }
    document.getElementById('efficiency-value').innerHTML = `${eficienciaKmL} <span class="unit">Km/L</span>`;
    
    // 3. Atualiza Litros Totais Consumidos
    document.getElementById('total-litros').innerText = dados.metricas.litros_totais;

    // 4. Cálculo Dinâmico do Custo da Viagem em Reais (R$) (Média de R$ 5,89/L)
    const precoLitro = 5.89;
    const custoTotalViagem = dados.metricas.litros_totais * precoLitro;
    document.getElementById('total-custo').innerText = `R$ ${custoTotalViagem.toFixed(2).replace('.', ',')}`;

    // 5. Atualiza Indicadores de Consumo na Base
    document.getElementById('spatial-value').innerHTML = `${dados.metricas.consumo_espacial_mL_km} <span class="unit">mL/Km</span>`;
    document.getElementById('temporal-value').innerHTML = `${dados.metricas.consumo_temporal_mL_min.toFixed(1)} <span class="unit">mL/Min</span>`;
    
    // 6. Regra de Negócio Visual (Linha de Base: Azul Neon vs Vermelho Alerta)
    const temporalValueElement = document.getElementById('temporal-value');
    if (dados.metricas.acima_da_media) {
        temporalValueElement.classList.remove('status-good');
        temporalValueElement.classList.add('status-bad');
    } else {
        temporalValueElement.classList.remove('status-bad');
        temporalValueElement.classList.add('status-good');
    }

    // 7. Atualização Dinâmica do Histograma
    let dadosGrafico = graficoConsumo.data.datasets[0].data;
    dadosGrafico.shift(); 
    dadosGrafico.push(dados.metricas.consumo_espacial_mL_km); 
    graficoConsumo.update();

});