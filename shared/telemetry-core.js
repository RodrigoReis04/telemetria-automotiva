// ==========================================================
// CENTRAL DE REGRAS E CONSTANTES (SHARED CORE)
// Utilizado tanto pelo B2C (App Local) quanto pelo B2B (Gestão de Frotas)
// ==========================================================

export const CONFIG = {
    VERSAO_SISTEMA: "1.2.0-prod",
    FATOR_SENSOR_YF_B1: 450, // Pulsos por litro padrão do sensor YF-B1
    LIMIAR_MARCHA_LENTA_RPM: 800,
    ALERTA_CONSUMO_MINIMO_KM_L: 10.0 // Abaixo disso, gera alerta de ineficiência
};

/**
 * Calcula o consumo espacial (Litros por Quilômetro rodado)
 * @param {number} pulsos - Total de pulsos contados pelo sensor de fluxo
 * @param {number} distanciaKm - Distância percorrida em Km
 * @returns {number} Consumo em L/Km
 */
export function calcularConsumoEspacial(pulsos, distanciaKm) {
    if (distanciaKm <= 0) return 0;
    const litros = pulsos / CONFIG.FATOR_SENSOR_YF_B1;
    return Number((litros / distanciaKm).toFixed(3));
}

/**
 * Valida se o motor está em marcha lenta excessiva
 * @param {number} rpm - Rotação por minuto atual
 * @param {number} velocidade - Velocidade atual em Km/h
 * @returns {boolean} True se estiver em marcha lenta ociosa
 */
export function verificarMarchaLenta(rpm, velocidade) {
    return rpm > 0 && rpm <= CONFIG.LIMIAR_MARCHA_LENTA_RPM && velocidade === 0;
}