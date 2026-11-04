// ==========================================================
// SIMULADOR DE DADOS DE TELEMETRIA (MÓDULO ISOLADO)
// Simula a leitura de hardware (USB-OTG / OBD-II / Sensor YF-B1)
// ==========================================================

class SimuladorTelemetria {
    constructor(callback) {
        this.callback = callback;
        this.tempoViagem = 0;
        this.litrosTotais = 0.0;
        this.iniciarLoop();
    }

    iniciarLoop() {
        setInterval(() => {
            this.tempoViagem++;

            // Gera valores simulados realistas de condução
            const rpm = Math.floor(Math.random() * 1500) + 1800; // Entre 1800 e 3300 RPM
            const velocidade = Math.floor(Math.random() * 30) + 50; // Entre 50 e 80 km/h
            
            // Simulação do sensor de fluxo YF-B1
            const consumoEspacial = Math.floor(Math.random() * 25) + 65; // 65 a 90 mL/Km
            const consumoTemporal = (consumoEspacial * velocidade) / 60; // mL/min
            
            // Incrementa litros totais consumidos proporcionalmente
            const litrosNesteSegundo = (consumoTemporal / 60) / 1000;
            this.litrosTotais += litrosNesteSegundo;

            const dados = {
                tempo_viagem_seg: this.tempoViagem,
                rpm: rpm,
                velocidade_kmh: velocidade,
                metricas: {
                    consumo_espacial_mL_km: consumoEspacial,
                    consumo_temporal_mL_min: consumoTemporal,
                    litros_totais: Number(this.litrosTotais.toFixed(2)),
                    acima_da_media: consumoEspacial > 80
                }
            };

            // Envia os dados gerados para a função de callback da interface
            this.callback(dados);
        }, 1000); // Executa a cada 1 segundo
    }
}