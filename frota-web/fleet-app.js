/**
 * ============================================================================
 * FLEETMANAGER PRO - CONTROLADOR PRINCIPAL DA APLICAÇÃO B2B (SPA)
 * ============================================================================
 * Responsabilidades:
 * 1. Gerenciar a malha viária real (Rodovia Presidente Dutra, Ayrton Senna,
 *    Marginal Tietê, Mogi-Dutra e Rodoanel Leste) com ajuste fino via OSRM.
 * 2. Gerenciar a frota (22 veículos + CRUD persistente via localStorage).
 * 3. Executar a telemetria em tempo real deslocando os veículos estritamente
 *    sobre o eixo das rodovias e avenidas (sem sair do asfalto).
 * 4. Executar o módulo de roteirização inteligente multi-paradas (Aba 2).
 * 5. Gerar laudos analíticos dinâmicos baseados nos dados da frota (Aba 3).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. MALHA VIÁRIA REAL (COORDENADAS ANCORADAS NAS RODOVIAS E AVENIDAS)
// ----------------------------------------------------------------------------
// Cada corredor possui pontos iniciais reais e será refinado automaticamente
// com centenas de vértices exatos das curvas via API pública do OSRM.
const MALHA_VIARIA = {
    dutra_sp_sjc: {
        nome: "Rodovia Presidente Dutra (BR-116)",
        waypointsOstm: [
            [-23.4892, -46.5488], // Início Dutra (Vila Guilherme)
            [-23.3965, -46.3260], // Arujá / Pedágio
            [-23.3568, -46.2412], // Trevo Santa Isabel (Km 185)
            [-23.2925, -45.9910], // Trevo Jacareí
            [-23.1985, -45.8815]  // São José dos Campos (Km 145)
        ],
        pontos: [
            [-23.4892, -46.5488],
            [-23.4735, -46.5180],
            [-23.4560, -46.4850],
            [-23.4318, -46.4105],
            [-23.3965, -46.3260],
            [-23.3568, -46.2412],
            [-23.3140, -46.1320],
            [-23.2925, -45.9910],
            [-23.2245, -45.9015],
            [-23.1985, -45.8815]
        ]
    },
    ayrton_senna: {
        nome: "Rodovia Ayrton Senna (SP-070)",
        waypointsOstm: [
            [-23.5138, -46.5365], // Penha / Início SP-070
            [-23.4675, -46.3650], // Pedágio Itaquaquecetuba
            [-23.4780, -46.2460]  // Saída Mogi das Cruzes
        ],
        pontos: [
            [-23.5138, -46.5365],
            [-23.4885, -46.4920],
            [-23.4748, -46.4670],
            [-23.4675, -46.3650],
            [-23.4780, -46.2460]
        ]
    },
    marginal_tiete: {
        nome: "Marginal Tietê (SP-015)",
        waypointsOstm: [
            [-23.5078, -46.7055], // Ponte do Piqueri
            [-23.5165, -46.6252], // Ponte das Bandeiras
            [-23.5235, -46.5480]  // Ponte da Penha
        ],
        pontos: [
            [-23.5078, -46.7055],
            [-23.5122, -46.6548],
            [-23.5165, -46.6252],
            [-23.5198, -46.5885],
            [-23.5235, -46.5480]
        ]
    },
    mogi_dutra: {
        nome: "Rodovia Mogi-Dutra (SP-088)",
        waypointsOstm: [
            [-23.3985, -46.3210], // Trevo Arujá (Dutra x Mogi-Dutra)
            [-23.4680, -46.2610], // Serra do Itapeti
            [-23.5080, -46.2120]  // Entrada Mogi das Cruzes
        ],
        pontos: [
            [-23.3985, -46.3210],
            [-23.4350, -46.2920],
            [-23.4680, -46.2610],
            [-23.5080, -46.2120]
        ]
    },
    rodoanel_leste: {
        nome: "Rodoanel Mário Covas (SP-021)",
        waypointsOstm: [
            [-23.5480, -46.4460], // Av. Jacu-Pêssego (Itaquera)
            [-23.5180, -46.3520], // Rodoanel (Poá / Suzano)
            [-23.4050, -46.3340]  // Entroncamento Rodoanel x Dutra
        ],
        pontos: [
            [-23.5480, -46.4460],
            [-23.5180, -46.3520],
            [-23.4550, -46.3410],
            [-23.4050, -46.3340]
        ]
    }
};

/**
 * Calcula a coordenada exata [lat, lon] sobre o eixo de um corredor viário
 * a partir de um fator de progresso entre 0.0 (início da via) e 1.0 (fim da via).
 */
function calcularPosicaoNaVia(corredorId, progresso) {
    const corredor = MALHA_VIARIA[corredorId] || MALHA_VIARIA.dutra_sp_sjc;
    const pts = corredor.pontos;

    if (!pts || pts.length === 0) return [-23.3568, -46.2412];
    if (pts.length === 1) return pts[0];

    const pClamped = Math.max(0, Math.min(1, progresso));
    const totalSegmentos = pts.length - 1;
    const posExata = pClamped * totalSegmentos;
    const indice = Math.min(Math.floor(posExata), totalSegmentos - 1);
    const fracao = posExata - indice;

    const p1 = pts[indice];
    const p2 = pts[indice + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * fracao;
    const lon = p1[1] + (p2[1] - p1[1]) * fracao;

    return [lat, lon];
}

/**
 * Consulta a API pública do OSRM em segundo plano para obter as curvas exatas
 * das 5 rodovias/avenidas, garantindo precisão milimétrica sobre o desenho do mapa.
 */
async function carregarGeometriaRealRodovias() {
    const chaves = Object.keys(MALHA_VIARIA);

    for (const chave of chaves) {
        const via = MALHA_VIARIA[chave];
        const coordsStr = via.waypointsOstm.map(p => `${p[1]},${p[0]}`).join(';'); const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data && data.code === "Ok" && data.routes && data.routes[0]) {
                // Converte [lon, lat] do GeoJSON para [lat, lon] do Leaflet
                via.pontos = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (err) {
            // Mantém os pontos base pré-configurados caso haja falha de rede
            console.warn(`Usando malha base para ${via.nome}:`, err);
        }
    }

    // Reposiciona imediatamente todos os veículos nas curvas reais recém-carregadas
    sincronizarCoordenadasFrota();
    atualizarMarcadoresNoMapa();
}

// ----------------------------------------------------------------------------
// 2. BASE DE DADOS INICIAL DA FROTA (22 VEÍCULOS ANCORADOS NAS VIAS)
// ----------------------------------------------------------------------------
// Maioria distribuída ao longo da Rodovia Presidente Dutra (BR-116) e eixos conectados.
const FROTA_INICIAL = [
    { id: 1,  modelo: "Chevrolet Corsa 1.0",  placa: "ABC-1234", motorista: "João Silva",      vel: 82, consumo: 14.2, fluxo: 5.8,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.52, direcao: 1 },
    { id: 2,  modelo: "Fiat Fiorino 1.4",     placa: "FGH-4512", motorista: "Carlos Souza",    vel: 0,  consumo: 0.0,  fluxo: 1.9,  status: "Alerta de Fluxo", corredorId: "dutra_sp_sjc",   progresso: 0.25, direcao: 1 },
    { id: 3,  modelo: "VW Gol 1.6",           placa: "DEF-9012", motorista: "Marcos Lima",     vel: 68, consumo: 12.5, fluxo: 5.4,  status: "Normal",          corredorId: "ayrton_senna",   progresso: 0.35, direcao: 1 },
    { id: 4,  modelo: "Hyundai HR 2.5",       placa: "JKL-8821", motorista: "Roberto Alves",   vel: 0,  consumo: 0.0,  fluxo: 2.4,  status: "Marcha Lenta",    corredorId: "dutra_sp_sjc",   progresso: 0.41, direcao: 1 },
    { id: 5,  modelo: "Renault Master 2.3",   placa: "MNO-3310", motorista: "Fernando Costa",  vel: 91, consumo: 9.8,  fluxo: 9.3,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.63, direcao: -1 },
    { id: 6,  modelo: "Fiat Strada 1.3",      placa: "PQR-7741", motorista: "Lucas Mendes",    vel: 74, consumo: 13.6, fluxo: 5.4,  status: "Normal",          corredorId: "marginal_tiete", progresso: 0.48, direcao: 1 },
    { id: 7,  modelo: "Mercedes Sprinter",    placa: "STU-1190", motorista: "André Santos",    vel: 88, consumo: 9.2,  fluxo: 9.6,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.74, direcao: 1 },
    { id: 8,  modelo: "VW Delivery 9.170",    placa: "VWX-6654", motorista: "Paulo Rocha",     vel: 62, consumo: 6.4,  fluxo: 9.7,  status: "Normal",          corredorId: "rodoanel_leste", progresso: 0.55, direcao: -1 },
    { id: 9,  modelo: "Iveco Daily 35S14",    placa: "YZA-5523", motorista: "Ricardo Gomes",   vel: 79, consumo: 8.1,  fluxo: 9.8,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.46, direcao: -1 },
    { id: 10, modelo: "Fiat Ducato Cargo",    placa: "BCD-9981", motorista: "Thiago Martins",  vel: 0,  consumo: 0.0,  fluxo: 2.1,  status: "Marcha Lenta",    corredorId: "marginal_tiete", progresso: 0.72, direcao: 1 },
    { id: 11, modelo: "Chevrolet Onix 1.0",   placa: "EFG-2045", motorista: "Juliana Pires",   vel: 85, consumo: 15.1, fluxo: 5.6,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.31, direcao: 1 },
    { id: 12, modelo: "Ford Cargo 816",       placa: "HIJ-3098", motorista: "Sérgio Nunes",    vel: 58, consumo: 5.9,  fluxo: 9.8,  status: "Alerta de Fluxo", corredorId: "dutra_sp_sjc",   progresso: 0.85, direcao: -1 },
    { id: 13, modelo: "VW Saveiro 1.6",       placa: "KLM-4120", motorista: "Bruno Ferreira",  vel: 71, consumo: 12.8, fluxo: 5.5,  status: "Normal",          corredorId: "mogi_dutra",     progresso: 0.60, direcao: 1 },
    { id: 14, modelo: "Renault Kangoo 1.6",   placa: "NOP-5234", motorista: "Diego Ribeiro",   vel: 64, consumo: 11.9, fluxo: 5.4,  status: "Normal",          corredorId: "ayrton_senna",   progresso: 0.68, direcao: -1 },
    { id: 15, modelo: "Peugeot Partner",      placa: "QRS-6345", motorista: "Eduardo Dias",    vel: 77, consumo: 12.1, fluxo: 6.4,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.58, direcao: 1 },
    { id: 16, modelo: "Kia Bongo K2500",      placa: "TUV-7456", motorista: "Marcelo Castro",  vel: 69, consumo: 8.9,  fluxo: 7.8,  status: "Normal",          corredorId: "rodoanel_leste", progresso: 0.30, direcao: 1 },
    { id: 17, modelo: "Fiat Uno Way 1.0",     placa: "WXY-8567", motorista: "Camila Teixeira", vel: 80, consumo: 14.8, fluxo: 5.4,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.49, direcao: -1 },
    { id: 18, modelo: "Mercedes Accelo 815",  placa: "ZAB-9678", motorista: "Fábio Moreira",   vel: 65, consumo: 6.2,  fluxo: 10.5, status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.92, direcao: -1 },
    { id: 19, modelo: "Citroën Jumpy",        placa: "CDE-1789", motorista: "Rafael Cardoso",  vel: 84, consumo: 10.4, fluxo: 8.1,  status: "Normal",          corredorId: "ayrton_senna",   progresso: 0.22, direcao: 1 },
    { id: 20, modelo: "VW Constellation",     placa: "FGH-2890", motorista: "Jorge Barros",    vel: 72, consumo: 4.1,  fluxo: 17.5, status: "Alerta de Fluxo", corredorId: "dutra_sp_sjc",   progresso: 0.79, direcao: 1 },
    { id: 21, modelo: "Chevrolet Montana",    placa: "IJK-3901", motorista: "Renato Lopes",    vel: 76, consumo: 12.7, fluxo: 6.0,  status: "Normal",          corredorId: "mogi_dutra",     progresso: 0.28, direcao: -1 },
    { id: 22, modelo: "Fiat Argo 1.0",        placa: "LMN-4012", motorista: "Patricia Moraes", vel: 81, consumo: 14.5, fluxo: 5.6,  status: "Normal",          corredorId: "dutra_sp_sjc",   progresso: 0.37, direcao: 1 }
];

// Chave v3 garante atualização limpa sobre versões anteriores no localStorage
let frotaDados = JSON.parse(localStorage.getItem('fleet_frota_dados_v3')) || FROTA_INICIAL;
let veiculoSelecionadoId = 1;
let simulacaoAtiva = true;

// Instâncias globais dos mapas Leaflet (Aba 1 e Aba 2)
let liveMapInstance = null;
let marcadoresFrota = {};
let mapInstance = null;
let currentRouteLayer = null;
let marcadoresRota = [];

/**
 * Sincroniza as propriedades lat e lon de todos os veículos com base no
 * corredor viário e progresso atual. Garante que nenhum carro fique fora da pista.
 */
function sincronizarCoordenadasFrota() {
    frotaDados.forEach((v, idx) => {
        if (!v.corredorId || !MALHA_VIARIA[v.corredorId]) {
            v.corredorId = "dutra_sp_sjc";
            v.progresso = ((idx * 0.04) % 0.9) + 0.05;
            v.direcao = 1;
        }
        const [lat, lon] = calcularPosicaoNaVia(v.corredorId, v.progresso);
        v.lat = lat;
        v.lon = lon;
    });
}

// Executa sincronização inicial antes da primeira renderização
sincronizarCoordenadasFrota();

/**
 * Adiciona camada de mapa oficial Esri World Street Map (gratuito, sem API Key
 * e exibe claramente o traçado das rodovias Dutra, Ayrton Senna, Marginal, etc.).
 */
function adicionarCamadaMapaBase(mapa) {
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18
    }).addTo(mapa);
}

// ----------------------------------------------------------------------------
// 3. RENDERIZAÇÃO DA LISTA DE VEÍCULOS, DETALHES E KPIs (ABA 1)
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

    if (contador) contador.innerText = `${filtrados.length} veículos`;  filtrados.forEach(v => { const isSelected = v.id === veiculoSelecionadoId; const statusClass = v.status === 'Normal' ? 'status-good' : 'status-bad'; const nomeVia = MALHA_VIARIA[v.corredorId]?.nome \vert{}\vert{} 'Rodovia Presidente Dutra';  const li = document.createElement('li'); li.className = `vehicle-item ${isSelected ? 'selected' : ''}`;
        li.onclick = () => focarVeiculo(v.id);
        li.innerHTML = `
            <div>
                <strong>${v.modelo} <span class="plate">${v.placa}</span></strong>
                <small>Motorista: ${v.motorista} •${v.status}</small>
                <small style="display: block; font-size: 0.7rem; color: var(--neon-blue