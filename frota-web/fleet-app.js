/* ==========================================================
 * CONTROLADOR DO DASHBOARD DE FROTAS (B2B)
 * ========================================================== */

import { CONFIG, calcularConsumoEspacial, verificarMarchaLenta } from '../shared/telemetry-core.js';

// Exemplo de uso prático na telemetria:
const pulsosAtuais = 900;
const distanciaAtual = 2.5; // km
const consumo = calcularConsumoEspacial(pulsosAtuais, distanciaAtual);

console.log(`Versão rodando: ${CONFIG.VERSAO_SISTEMA}`);
console.log(`Consumo calculado: ${consumo} L/Km`);


function selecionarVeiculo(nomeVeiculo, motorista, velocidade, consumo, status) {
    // Atualiza o título do card de telemetria
    document.getElementById('selected-vehicle-title').innerText = `Telemetria: ${nomeVeiculo}`;
    
    // Atualiza os valores dos mini cards com os dados do veículo escolhido
    document.getElementById('tel-speed').innerHTML = `${velocidade}`;
    document.getElementById('tel-rpm').innerHTML = `${Math.floor(Math.random() * 1000) + 1800} <span class="unit">RPM</span>`;
    document.getElementById('tel-spatial').innerHTML = `${consumo}`;
    
    const statusElement = document.getElementById('tel-status');
    statusElement.innerText = status;
    
    if(status === 'Normal' || status === 'Operação Eficiente') {
        statusElement.className = 'status-good';
    } else {
        statusElement.className = 'status-bad';
    }

    // Gerencia a seleção visual na lista lateral
    document.querySelectorAll('.vehicle-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}
