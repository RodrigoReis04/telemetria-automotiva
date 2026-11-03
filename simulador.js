/* ==========================================================
 * SIMULADOR DE TELEMETRIA AUTOMOTIVA (Gêmeo Digital)
 * Arquitetura voltada para testes de Front-End e Validação de UI
 * ========================================================== */

class SimuladorTelemetria {
  constructor(callbackAoSaturar) {
    this.onData = callbackAoSaturar;
    this.timer = null;
    
    // Variáveis de Estado Interno do Veículo
    this.rpm = 800;
    this.velocidade_kmh = 0;
    this.consumoMedioViagem = 40.0; // Linha de corte para cores (mL/min)
    
    // Contadores acumulativos para a sessão de teste
    this.litrosTotaisGastos = 0.0;
    this.segundosEmViagem = 0;
  }

  iniciar() {
    console.log("[SIMULADOR] Motor de telemetria virtual iniciado com sucesso.");
    // Dispara a amostragem a cada 1000ms (1 segundo, igual ao microcontrolador real)
    this.timer = setInterval(() => this.gerarLeitura(), 1000);
  }

  parar() {
    clearInterval(this.timer);
    console.log("[SIMULADOR] Telemetria pausada.");
  }

  gerarLeitura() {
    this.segundosEmViagem++;
    
    // Cenários de simulação estocástica para testes de comportamento
    const cenarios = ['marcha_lenta', 'acelerando', 'cruzeiro', 'cut_off'];
    const cenarioAtual = cenarios[Math.floor(Math.random() * cenarios.length)];

    let v_in = 0, v_out = 0, consumo_mL_min = 0;

    switch (cenarioAtual) {
      case 'marcha_lenta':
        this.rpm = 800 + (Math.random() * 50);
        this.velocidade_kmh = 0;
        v_in = 1500;
        v_out = 1480;
        break;
      case 'acelerando':
        this.rpm = 2500 + (Math.random() * 1000);
        this.velocidade_kmh += 12;
        v_in = 1500;
        v_out = 1400;
        break;
      case 'cruzeiro':
        this.rpm = 2000 + (Math.random() * 200);
        this.velocidade_kmh = 80 + (Math.random() * 5);
        v_in = 1500;
        v_out = 1450;
        break;
      case 'cut_off': // Freio motor
        this.rpm = 3000 - (Math.random() * 500);
        this.velocidade_kmh -= 4;
        if(this.velocidade_kmh < 0) this.velocidade_kmh = 0;
        v_in = 1500;
        v_out = 1495;
        break;
    }

    // Aplicação da regra de diferença física (Entrada - Retorno) com filtro de ruído
    let diferencaBruta = v_in - v_out;
    if (diferencaBruta <= 25.0) {
      consumo_mL_min = 0.0;
    } else {
      consumo_mL_min = diferencaBruta;
    }

    // Cálculo do consumo espacial (mL por Km rodado)
    let consumo_mL_km = 0;
    if (this.velocidade_kmh > 0) {
      consumo_mL_km = (consumo_mL_min * 60) / this.velocidade_kmh;
    }

    // Acumula o consumo total da viagem em Litros 
    // (mL por minuto transformado em mL por segundo / 1000 para virar litros)
    let mLPorSegundo = consumo_mL_min / 60.0;
    this.litrosTotaisGastos += (mLPorSegundo / 1000.0);

    // Formatação do pacote JSON estruturado (Padrão idêntico ao que virá via Serial USB)
    const pacoteDeDados = {
      timestamp: new Date().toISOString(),
      tempo_viagem_seg: this.segundosEmViagem,
      estado_motor: cenarioAtual,
      rpm: Math.round(this.rpm),
      velocidade_kmh: Math.round(this.velocidade_kmh),
      metricas: {
        consumo_temporal_mL_min: consumo_mL_min,
        consumo_espacial_mL_km: parseFloat(consumo_mL_km.toFixed(1)),
        litros_totais: parseFloat(this.litrosTotaisGastos.toFixed(3)),
        acima_da_media: consumo_mL_min > this.consumoMedioViagem
      }
    };

    // Callback enviando os dados para a interface principal
    this.onData(pacoteDeDados);
  }
}