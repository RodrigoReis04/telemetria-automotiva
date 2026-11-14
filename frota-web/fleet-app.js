/**
 * ============================================================================
 * FLEETMANAGER PRO - CONTROLADOR PRINCIPAL DA APLICAÇÃO B2B (SPA)
 * ============================================================================
 * Responsabilidades:
 * 1. Gerenciar a base de dados da frota (22 veículos + CRUD via localStorage).
 * 2. Executar o loop de telemetria em tempo real (velocidade, fluxo L/h, Km/L e GPS).
 * 3. Controlar o mapa ao vivo multi-veículos (Leaflet + CARTO Dark).
 * 4. Executar o módulo de roteirização inteligente multi-paradas (Nominatim + OSRM).
 * 5. Gerar laudos analíticos dinâmicos baseados nos indicadores da frota.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. BASE DE DADOS INICIAL DA FROTA (22 VEÍCULOS NO EIXO SP / DUTRA / ALTO TIETÊ)
// ----------------------------------------------------------------------------
const FROTA_INICIAL = [
    { id: 1, modelo: "Chevrolet Corsa 1.0", placa: "ABC-1234", motorista: "João Silva", vel: 82, consumo: 14.2, fluxo: 5.8, status: "Normal", lat: -23.315, lon: -46.221 },
    { id: 2, modelo: "Fiat Fiorino 1.4", placa: "FGH-4512", motorista: "Carlos Souza", vel: 0, consumo: 0.0, fluxo: 1.9, status: "Alerta de Fluxo", lat: -23.462, lon: -46.533 },
    { id: 3, modelo: "VW Gol 1.6", placa: "DEF-9012", motorista: "Marcos Lima", vel: 68, consumo: 12.5, fluxo: 5.4, status: "Normal", lat: -23.520, lon: -46.300 },
    { id: 4, modelo: "Hyundai HR 2.5", placa: "JKL-8821", motorista: "Roberto Alves", vel: 0, consumo: 0.0, fluxo: 2.4, status: "Marcha Lenta", lat: -23.435, lon: -46.470 },
    { id: 5, modelo: "Renault Master 2.3", placa: "MNO-3310", motorista: "Fernando Costa", vel: 91, consumo: 9.8, fluxo: 9.3, status: "Normal", lat: -23.390, lon: -46.350 },
    { id: 6, modelo: "Fiat Strada 1.3", placa: "PQR-7741", motorista: "Lucas Mendes", vel: 74, consumo: 13.6, fluxo: 5.4, status: "Normal", lat: -23.540, lon: -46.610 },
    { id: 7, modelo: "Mercedes Sprinter", placa: "STU-1190", motorista: "André Santos", vel: 88, consumo: 9.2, fluxo: 9.6, status: "Normal", lat: -23.280, lon: -46.150 },
    { id: 8, modelo: "VW Delivery 9.170", placa: "VWX-6654", motorista: "Paulo Rocha", vel: 62, consumo: 6.4, fluxo: 9.7, status: "Normal", lat: -23.495, lon: -46.420 },
    { id: 9, modelo: "Iveco Daily 35S14", placa: "YZA-5523", motorista: "Ricardo Gomes", vel: 79, consumo: 8.1, fluxo: 9.8, status: "Normal", lat: -23.350, lon: -46.280 },
    { id: 10, modelo: "Fiat Ducato Cargo", placa: "BCD-9981", motorista: "Thiago Martins", vel: 0, consumo: 0.0, fluxo: 2.1, status: "Marcha Lenta", lat: -23.510, lon: -46.580 },
    { id: 11, modelo: "Chevrolet Onix 1.0", placa: "EFG-2045", motorista: "Juliana Pires", vel: 85, consumo: 15.1, fluxo: 5.6, status: "Normal", lat: -23.410, lon: -46.400 },
    { id: 12, modelo: "Ford Cargo 816", placa: "HIJ-3098", motorista: "Sérgio Nunes", vel: 58, consumo: 5.9, fluxo: 9.8, status: "Alerta de Fluxo", lat: -23.220, lon: -45.950 },
    { id: 13, modelo: "VW Saveiro 1.6", placa: "KLM-4120", motorista: "Bruno Ferreira", vel: 71, consumo: 12.8, fluxo: 5.5, status: "Normal", lat: -23.550, lon: -46.380 },
    { id: 14, modelo: "Renault Kangoo 1.6", placa: "NOP-5234", motorista: "Diego Ribeiro", vel: 64, consumo: 11.9, fluxo: 5.4, status: "Normal", lat: -23.475, lon: -46.510 },
    { id: 15, modelo: "Peugeot Partner", placa: "QRS-6345", motorista: "Eduardo Dias", vel: 77, consumo: 12.1, fluxo: 6.4, status: "Normal", lat: -23.370, lon: -46.320 },
    { id: 16, modelo: "Kia Bongo K2500", placa: "TUV-7456", motorista: "Marcelo Castro", vel: 69, consumo: 8.9, fluxo: 7.8, status: "Normal", lat: -23.530, lon: -46.490 },
    { id: 17, modelo: "Fiat Uno Way 1.0", placa: "WXY-8567", motorista: "Camila Teixeira", vel: 80, consumo: 14.8, fluxo: 5.4, status: "Normal", lat: -23.330, lon: -46.250 },
    { id: 18, modelo: "Mercedes Accelo 815", placa: "ZAB-9678", motorista: "Fábio Moreira", vel: 65, consumo: 6.2, fluxo: 10.5, status: "Normal", lat: -23.190, lon: -45.890 },
    { id: 19, modelo: "Citroën Jumpy", placa: "CDE-1789", motorista: "Rafael Cardoso", vel: 84, consumo: 10.4, fluxo: 8.1, status: "Normal", lat: -23.445, lon: -46.550 },
    { id: 20, modelo: "VW Constellation", placa: "FGH-2890", motorista: "Jorge Barros", vel: 72, consumo: 4.1, fluxo: 17.5, status: "Alerta de Fluxo", lat: -23.260, lon: -46.050 },
    { id: 21, modelo: "Chevrolet Montana", placa: "IJK-3901", motorista: "Renato Lopes", vel: 76, consumo: 12.7, fluxo: 6.0, status: "Normal", lat: -23.490, lon: -46.330 },
    { id: 22, modelo: "Fiat Argo 1.0", placa: "LMN-4012", motorista: "Patricia Moraes", vel: 81, consumo: 14.5, fluxo: 5.6, status: "Normal", lat: -23.420, lon: -46.440 }
];

// Carrega veículos salvos no navegador ou utiliza a base inicial de 22 veículos
let frotaDados = JSON.parse(localStorage.getItem('fleet_frota_dados_v2')) || FROTA_INICIAL;
let veiculoSelecionadoId = 1;
let simulacaoAtiva = true;

// Instâncias globais dos mapas Leaflet (Aba 1 e Aba 2)
let liveMapInstance = null;
let marcadoresFrota = {};
let mapInstance = null;
let currentRouteLayer = null;
let marcadoresRota = [];

// ----------------------------------------------------------------------------
// 2. RENDERIZAÇÃO DA LISTA DE VEÍCULOS, DETALHES E KPIs (ABA 1)
// ----------------------------------------------------------------------------

function renderizarListaVeiculos() {
    const ul = document.getElementById('lista-veiculos-ul');
    const contador = document.getElementById('contador-lista');
    if (!ul) return;

    const termo = (document.getElementById('filtro-veiculo')?.value || '').toLowerCase();
    ul.innerHTML = '';

    const filtrados = frotaDados.filter(v =>
        v.modelo.toLowerCase().includes(termo) ||
        v.placa.toLowerCase().includes(termo) ||
        v.motorista.toLowerCase().includes(termo)
    );

    if (contador) contador.innerText = `${filtrados.length} veículos`;

    filtrados.forEach(v => {
        const isSelected = v.id === veiculoSelecionadoId;
        const statusClass = v.status === 'Normal' ? 'status-good' : 'status-bad';

        const li = document.createElement('li');
        li.className = `vehicle-item ${isSelected ? 'selected' : ''}`;
        li.onclick = () => focarVeiculo(v.id);
        li.innerHTML = `
            <div>
                <strong>${v.modelo} <span class="plate">${v.placa}</span></strong>
                <small>Motorista: ${v.motorista} • ${v.status}</small>
            </div>
            <span class="${statusClass}">${v.consumo > 0 ? v.consumo.toFixed(1) + ' Km/L' : v.fluxo.toFixed(1) + ' L/h'}</span>
        `;
        ul.appendChild(li);
    });

    atualizarPainelDetalhes();
    atualizarKPIsEAlertas();
}

function atualizarPainelDetalhes() {
    const v = frotaDados.find(item => item.id === veiculoSelecionadoId) || frotaDados[0];
    if (!v) return;

    const titleEl = document.getElementById('selected-vehicle-title');
    const speedEl = document.getElementById('tel-speed');
    const fluxoEl = document.getElementById('tel-fluxo');
    const consumoEl = document.getElementById('tel-consumo');
    const statusEl = document.getElementById('tel-status');

    if (titleEl) titleEl.innerText = `Telemetria: ${v.modelo} (${v.placa})`;
    if (speedEl) speedEl.innerHTML = `${v.vel} <span class="unit">km/h</span>`;
    if (fluxoEl) fluxoEl.innerHTML = `${v.fluxo.toFixed(1)} <span class="unit">L/h</span>`;
    if (consumoEl) consumoEl.innerHTML = `${v.consumo > 0 ? v.consumo.toFixed(1) : '0.0'} <span class="unit">Km/L</span>`;
    
    if (statusEl) {
        statusEl.innerText = v.status;
        statusEl.className = v.status === 'Normal' ? 'status-good' : 'status-bad';
    }
}

function atualizarKPIsEAlertas() {
    const total = frotaDados.length;
    const ativos = frotaDados.filter(v => v.vel > 0);
    const criticos = frotaDados.filter(v => v.status !== 'Normal');
    const mediaConsumo = ativos.reduce((acc, v) => acc + v.consumo, 0) / (ativos.length || 1);
    const fluxoTotal = frotaDados.reduce((acc, v) => acc + v.fluxo, 0);

    const kpiTotal = document.getElementById('kpi-total-veiculos');
    const kpiMedia = document.getElementById('kpi-media-consumo');
    const kpiFluxo = document.getElementById('kpi-fluxo-total');
    const kpiAlertas = document.getElementById('kpi-alertas');

    if (kpiTotal) kpiTotal.innerHTML = `${ativos.length} <span class="unit">/ ${total}</span>`;
    if (kpiMedia) kpiMedia.innerHTML = `${mediaConsumo.toFixed(1)} <span class="unit">Km/L</span>`;
    if (kpiFluxo) kpiFluxo.innerHTML = `${fluxoTotal.toFixed(1)} <span class="unit">L/h</span>`;
    if (kpiAlertas) kpiAlertas.innerText = `${criticos.length} Ativos`;

    // Atualiza o feed de ocorrências críticas
    const feedUl = document.getElementById('feed-alertas-ul');
    if (feedUl) {
        feedUl.innerHTML = criticos.map(c => `
            <li onclick="focarVeiculo(${c.id})" style="cursor: pointer;">
                <span class="alert-time" style="background: ${c.status === 'Alerta de Fluxo' ? '#ff4444' : '#ffbb00'}; color: #000;">${c.placa}</span>
                <strong>${c.modelo}:</strong> ${c.status === 'Alerta de Fluxo' ? `Desvio de fluxo diferencial (${c.fluxo.toFixed(1)} L/h).` : `Ociosidade em marcha lenta (${c.fluxo.toFixed(1)} L/h).`}
            </li>
        `).join('');
    }
}

// ----------------------------------------------------------------------------
// 3. CADASTRO DE NOVO VEÍCULO (CRUD COM PERSISTÊNCIA EM LOCALSTORAGE)
// ----------------------------------------------------------------------------

function abrirModalCadastro() {
    const box = document.getElementById('box-cadastro-veiculo');
    if (box) box.style.display = 'block';
}

function fecharModalCadastro() {
    const box = document.getElementById('box-cadastro-veiculo');
    if (box) box.style.display = 'none';
}

function salvarNovoVeiculo() {
    const modelo = document.getElementById('novo-modelo').value.trim();
    const placa = document.getElementById('nova-placa').value.trim().toUpperCase();
    const motorista = document.getElementById('novo-motorista').value.trim();

    if (!modelo || !placa || !motorista) {
        alert("Preencha o modelo, a placa e o nome do motorista.");
        return;
    }

    const novoVeiculo = {
        id: Date.now(),
        modelo: modelo,
        placa: placa,
        motorista: motorista,
        vel: 70,
        consumo: 13.0,
        fluxo: 5.4,
        status: "Normal",
        lat: -23.330 + (Math.random() * 0.04),
        lon: -46.240 + (Math.random() * 0.04)
    };

    // Adiciona no topo da frota e salva no localStorage
    frotaDados.unshift(novoVeiculo);
    localStorage.setItem('fleet_frota_dados_v2', JSON.stringify(frotaDados));

    // Limpa os campos e fecha o formulário
    document.getElementById('novo-modelo').value = '';
    document.getElementById('nova-placa').value = '';
    document.getElementById('novo-motorista').value = '';
    fecharModalCadastro();

    renderizarListaVeiculos();
    focarVeiculo(novoVeiculo.id);
}

// ----------------------------------------------------------------------------
// 4. MAPA AO VIVO MULTI-VEÍCULOS & MOTOR DE TELEMETRIA EM TEMPO REAL
// ----------------------------------------------------------------------------

function initLiveMap() {
    if (liveMapInstance) return;

    liveMapInstance = L.map('live-map').setView([-23.400, -46.380], 10);

    // Provedor CARTO Dark: Compatível com Midnight Tech e livre de bloqueios CORS/HTTPS
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
    }).addTo(liveMapInstance);

    atualizarMarcadoresNoMapa();
}

function atualizarMarcadoresNoMapa() {
    if (!liveMapInstance) return;

    frotaDados.forEach(v => {
        let cor = '#00ff88'; // Verde: Normal
        if (v.status === 'Marcha Lenta') cor = '#ffbb00'; // Amarelo: Ocioso
        if (v.status === 'Alerta de Fluxo') cor = '#ff4444'; // Vermelho: Anomalia de sensor

        const isSelected = v.id === veiculoSelecionadoId;
        const popupHtml = `<b>${v.modelo} (${v.placa})</b><br>Motorista: ${v.motorista}<br>Vel: ${v.vel} km/h | Fluxo: ${v.fluxo.toFixed(1)} L/h`;

        if (marcadoresFrota[v.id]) {
            marcadoresFrota[v.id].setLatLng([v.lat, v.lon]);
            marcadoresFrota[v.id].setStyle({
                color: isSelected ? '#00e5ff' : cor,
                fillColor: cor,
                radius: isSelected ? 10 : 6,
                weight: isSelected ? 3 : 1
            });
            marcadoresFrota[v.id].setPopupContent(popupHtml);
        } else {
            const marker = L.circleMarker([v.lat, v.lon], {
                radius: isSelected ? 10 : 6,
                color: isSelected ? '#00e5ff' : cor,
                fillColor: cor,
                fillOpacity: 0.9
            }).addTo(liveMapInstance).bindPopup(popupHtml);

            marker.on('click', () => focarVeiculo(v.id));
            marcadoresFrota[v.id] = marker;
        }
    });
}

function focarVeiculo(id) {
    veiculoSelecionadoId = id;
    const v = frotaDados.find(item => item.id === id);
    renderizarListaVeiculos();
    atualizarMarcadoresNoMapa();

    if (liveMapInstance && v) {
        liveMapInstance.setView([v.lat, v.lon], 13);
        if (marcadoresFrota[v.id]) marcadoresFrota[v.id].openPopup();
    }
}

function alternarSimulacaoAoVivo() {
    simulacaoAtiva = !simulacaoAtiva;
    const btn = document.getElementById('btn-toggle-live');
    if (btn) {
        btn.innerText = simulacaoAtiva ? '⏸ Pausar Ao Vivo' : '▶ Retomar Ao Vivo';
    }
}

// Loop contínuo a cada 2,5 segundos: simula variação real dos sensores de fluxo e GPS
setInterval(() => {
    if (!simulacaoAtiva) return;

    frotaDados.forEach(v => {
        if (v.vel > 0) {
            // Oscila velocidade entre -3 e +3 km/h
            const deltaVel = Math.floor(Math.random() * 7) - 3;
            v.vel = Math.max(35, Math.min(105, v.vel + deltaVel));
            
            // Recalcula consumo e fluxo diferencial proporcionalmente
            v.consumo = Math.max(3.5, v.consumo + ((Math.random() * 0.4) - 0.2));
            v.fluxo = Math.max(3.0, (v.vel / v.consumo));

            // Desloca coordenadas geográficas simulando tráfego na via
            v.lat += (Math.random() - 0.45) * 0.0012;
            v.lon += (Math.random() - 0.45) * 0.0012;
        } else {
            // Oscilação sutil de consumo em marcha lenta
            v.fluxo = Math.max(1.2, v.fluxo + ((Math.random() * 0.2) - 0.1));
        }
    });

    renderizarListaVeiculos();
    atualizarMarcadoresNoMapa();
}, 2500);

// ----------------------------------------------------------------------------
// 5. ROTEIRIZAÇÃO INTELIGENTE MULTI-PARADAS (ABA 2 - NOMINATIM + OSRM)
// ----------------------------------------------------------------------------

function initLeafletMap() {
    if (mapInstance) return;

    mapInstance = L.map('leaflet-map').setView([-23.315, -46.221], 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
    }).addTo(mapInstance);
}

function adicionarCampoDestino() {
    const container = document.getElementById('destinos-container');
    const totalDestinos = container.getElementsByClassName('destino-item').length + 1;

    const div = document.createElement('div');
    div.className = 'form-group destino-item';
    div.style.marginBottom = '12px';
    div.innerHTML = `
        <label style="font-size: 0.75rem; color: var(--text-muted);">Destino ${totalDestinos}</label>
        <input type="text" class="input-destino" placeholder="Ex: São José dos Campos, SP" style="width: 100%; background: #111; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; color: #fff;">
    `;
    container.appendChild(div);
}

async function geocodeEndereco(enderecoTexto) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoTexto)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                nome: enderecoTexto
            };
        }
        return null;
    } catch (error) {
        console.error("Erro na geocodificação:", error);
        return null;
    }
}

async function calcularRotaMultiplasParadas() {
    const origemTexto = document.getElementById('ponto-origem').value.trim();
    const inputsDestinos = document.querySelectorAll('.input-destino');
    const infoDiv = document.getElementById('rota-info-resultado');

    if (!origemTexto) {
        alert("Preencha o ponto de partida.");
        return;
    }

    let textosDestinos = [];
    inputsDestinos.forEach(input => {
        if (input.value.trim() !== '') textosDestinos.push(input.value.trim());
    });

    if (textosDestinos.length === 0) {
        alert("Adicione pelo menos um destino.");
        return;
    }

    infoDiv.innerHTML = `<span style="color: var(--neon-blue);">⏳ Geocodificando endereços e calculando rota otimizada...</span>`;

    let pontosCoordenadas = [];
    const coordOrigem = await geocodeEndereco(origemTexto);
    if (!coordOrigem) {
        infoDiv.innerHTML = `<span style="color: var(--alert-red);">Erro: Origem não encontrada (${origemTexto}).</span>`;
        return;
    }
    pontosCoordenadas.push(coordOrigem);

    for (let texto of textosDestinos) {
        const coord = await geocodeEndereco(texto);
        if (coord) {
            pontosCoordenadas.push(coord);
        } else {
            infoDiv.innerHTML = `<span style="color: var(--alert-red);">Erro: Destino não encontrado (${texto}).</span>`;
            return;
        }
    }

    // Concatena todas as coordenadas para chamada única à API pública do OSRM
    const coordenadasString = pontosCoordenadas.map(p => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordenadasString}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === "Ok") {
            const route = data.routes[0];
            const km = (route.distance / 1000).toFixed(1);
            const minutos = Math.ceil(route.duration / 60);

            infoDiv.innerHTML = `
                <div style="background: #1a1a1a; padding: 12px; border-radius: 6px; border-left: 3px solid var(--neon-blue);">
                    <strong style="color: var(--neon-blue);">✅ Rota com ${textosDestinos.length} Parada(s) Calculada!</strong><br>
                    • Distância Total: <strong>${km} Km</strong><br>
                    • Tempo Estimado: <strong>${minutos} minutos</strong><br>
                    • Roteirizado via OpenStreetMap / OSRM.
                </div>
            `;

            // Limpa camadas anteriores do mapa
            if (currentRouteLayer) mapInstance.removeLayer(currentRouteLayer);
            marcadoresRota.forEach(m => mapInstance.removeLayer(m));
            marcadoresRota = [];

            // Adiciona pinos em cada parada
            pontosCoordenadas.forEach((pt, index) => {
                const label = index === 0 ? "🟢 Origem" : `📍 Parada ${index}`;
                const marker = L.marker([pt.lat, pt.lon]).addTo(mapInstance)
                    .bindPopup(`<b>${label}</b><br>${pt.nome}`);
                marcadoresRota.push(marker);
            });

            // Desenha o traçado da rota
            const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
            currentRouteLayer = L.polyline(coordinates, {
                color: '#00e5ff',
                weight: 5,
                opacity: 0.85
            }).addTo(mapInstance);

            mapInstance.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
        } else {
            infoDiv.innerHTML = `<span style="color: var(--alert-red);">Erro ao traçar o roteiro nas vias.</span>`;
        }
    } catch (error) {
        console.error(error);
        infoDiv.innerHTML = `<span style="color: var(--alert-red);">Erro de conexão com o servidor de rotas.</span>`;
    }
}

// ----------------------------------------------------------------------------
// 6. GERADOR DE LAUDOS ANALÍTICOS DE IA (ABA 3)
// ----------------------------------------------------------------------------

function gerarLaudoIA() {
    const container = document.getElementById('laudo-ia-container');
    if (!container) return;

    container.innerHTML = `<p style="color: var(--neon-blue);">⏳ Processando telemetria diferencial de ${frotaDados.length} veículos via motor analítico...</p>`;

    setTimeout(() => {
        const criticos = frotaDados.filter(v => v.status !== 'Normal');
        const emMovimento = frotaDados.filter(v => v.vel > 0);
        const maisEficiente = [...emMovimento].sort((a, b) => b.consumo - a.consumo)[0];
        const maisGastao = [...emMovimento].sort((a, b) => a.consumo - b.consumo)[0];

        container.innerHTML = `
            <div style="border-left: 4px solid var(--neon-blue); padding-left: 16px;">
                <h4 style="color: var(--neon-blue); margin-bottom: 12px; font-size: 1.05rem;">
                    🧠 Diagnóstico Executivo da Frota (${frotaDados.length} Veículos Auditados)
                </h4>
                <p style="margin-bottom: 10px;">
                    <strong>1. Auditoria de Fluxo Diferencial (Sensores Efeito Hall):</strong> Foram detectadas <strong>${criticos.length} anomalias operacionais</strong> no turno atual (desvio entre linha de ida e retorno ou marcha lenta prolongada). Recomenda-se verificação preventiva nos veículos sinalizados em vermelho no mapa.
                </p>
                <p style="margin-bottom: 10px;">
                    <strong>2. Ranking de Eficiência Energética:</strong> O melhor desempenho da frota pertence ao <strong>${maisEficiente.modelo} (${maisEficiente.placa})</strong> conduzido por <em>${maisEficiente.motorista}</em>, atingindo <strong>${maisEficiente.consumo.toFixed(1)} Km/L</strong>. O maior consumo específico está no <strong>${maisGastao.modelo} (${maisGastao.placa})</strong> com ${maisGastao.consumo.toFixed(1)} Km/L.
                </p>
                <p style="color: #00ff88; font-weight: 500;">
                    <strong>3. Impacto Financeiro Projetado:</strong> A mitigação da ociosidade em marcha lenta combinada à roteirização multi-paradas OSRM projeta uma economia mensal estimada em <strong>R$ 5.240,00</strong> na operação desta frota.
                </p>
            </div>
        `;
    }, 600);
}

// ----------------------------------------------------------------------------
// 7. CONTROLADOR DE NAVEGAÇÃO ENTRE ABAS (SPA ROUTER)
// ----------------------------------------------------------------------------

function mudarAba(abaId) {
    // Oculta todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove destaque de todos os itens do menu lateral
    document.querySelectorAll('.menu-list li').forEach(item => {
        item.classList.remove('active');
    });

    // Exibe a aba selecionada e destaca o menu correspondente
    const targetTab = document.getElementById(`tab-${abaId}`);
    const targetMenu = document.getElementById(`menu-${abaId}`);
    if (targetTab) targetTab.style.display = 'block';
    if (targetMenu) targetMenu.classList.add('active');

    // Recalcula o tamanho dos mapas Leaflet ao exibir a aba correspondente
    if (abaId === 'live') {
        setTimeout(() => {
            initLiveMap();
            if (liveMapInstance) liveMapInstance.invalidateSize();
        }, 150);
    } else if (abaId === 'routes') {
        setTimeout(() => {
            initLeafletMap();
            if (mapInstance) mapInstance.invalidateSize();
        }, 150);
    }
}

// Inicialização automática ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
    renderizarListaVeiculos();
    setTimeout(() => {
        initLiveMap();
    }, 250);
});