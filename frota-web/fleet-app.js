// ==========================================================
// MÓDULO DE MAPAS E ROTEIRIZAÇÃO COM MÚLTIPLAS PARADAS
// ==========================================================

let mapInstance = null;
let currentRouteLayer = null;
let marcadoresCamada = [];

// Inicializa o mapa com o provedor OpenStreetMap padrão (100% gratuito, sem chave de API)
function initLeafletMap() {
    if (mapInstance) return;

    // Centraliza em São Paulo / Santa Isabel
    mapInstance = L.map('leaflet-map').setView([-23.315, -46.221], 10);

    // Usa o OpenStreetMap padrão com estilo limpo garantindo ZERO erro de "API key required"
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapInstance);
}

// Função para adicionar dinamicamente mais um campo de destino na tela
function adicionarCampoDestino() {
    const container = document.getElementById('destinos-container');
    const totalDestinos = container.getElementsByClassName('destino-item').length + 1;

    const div = document.createElement('div');
    div.className = 'form-group destino-item';
    div.style.marginBottom = '12px';
    div.innerHTML = `
        <label style="font-size: 0.75rem; color: var(--text-muted);">Destino ${totalDestinos}</label>
        <input type="text" class="input-destino" placeholder="Ex: São Paulo, SP" style="width: 100%; background: #111; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; color: #fff;">
    `;
    container.appendChild(div);
}

// Geocodificação de endereço (Transforma texto em Lat/Lon)
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
        throw new Error(`Não localizado: ${enderecoTexto}`);
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Função principal que calcula a rota com origem e múltiplos destinos (waypoints)
async function calcularRotaMultiplasParadas() {
    const origemTexto = document.getElementById('ponto-origem').value;
    const inputsDestinos = document.querySelectorAll('.input-destino');
    const infoDiv = document.getElementById('rota-info-resultado');

    if (!origemTexto) {
        alert("Preencha o ponto de partida.");
        return;
    }

    // Coleta todos os destinos preenchidos
    let textosDestinos = [];
    inputsDestinos.forEach(input => {
        if (input.value.trim() !== '') {
            textosDestinos.push(input.value.trim());
        }
    });

    if (textosDestinos.length === 0) {
        alert("Adicione pelo menos um destino.");
        return;
    }

    infoDiv.innerHTML = `<span style="color: var(--neon-blue);">⏳ Geocodificando endereços e calculando rota otimizada...</span>`;

    // 1. Converte origem e todos os destinos em coordenadas geográficas
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

    // 2. Monta a URL da API OSRM concatenando todas as coordenadas (Origem -> Parada 1 -> Parada 2...)
    let coordenadasString = pontosCoordenadas.map(p => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordenadasString}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === "Ok") {
            const route = data.routes[0];
            const km = (route.distance / 1000).toFixed(1);
            const minutos = Math.ceil(route.duration / 60);

            // Exibe o resumo do trajeto multi-paradas
            infoDiv.innerHTML = `
                <div style="background: #1a1a1a; padding: 12px; border-radius: 6px; border-left: 3px solid var(--neon-blue);">
                    <strong style="color: var(--neon-blue);">✅ Rota com ${textosDestinos.length} Parada(s) Calculada!</strong><br>
                    • Distância Total: <strong>${km} Km</strong><br>
                    • Tempo Total Estimado: <strong>${minutos} minutos</strong><br>
                    • Roteirizado via OpenStreetMap / OSRM.
                </div>
            `;

            // 3. Limpa marcações e linhas antigas do mapa
            if (currentRouteLayer) {
                mapInstance.removeLayer(currentRouteLayer);
            }
            marcadoresCamada.forEach(m => mapInstance.removeLayer(m));
            marcadoresCamada = [];

            // Adiciona marcadores nos pontos de parada
            pontosCoordenadas.forEach((pt, index) => {
                let labelCor = index === 0 ? "🟢 Origem" : `📍 Parada ${index}`;
                const marker = L.marker([pt.lat, pt.lon]).addTo(mapInstance)
                    .bindPopup(`<b>${labelCor}</b><br>${pt.nome}`);
                marcadoresCamada.push(marker);
            });

            // Desenha a linha da rota conectando todos os pontos
            const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
            currentRouteLayer = L.polyline(coordinates, {
                color: '#00e5ff',
                weight: 5,
                opacity: 0.85
            }).addTo(mapInstance);

            // Enquadra o mapa perfeitamente na rota inteira
            mapInstance.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });

        } else {
            infoDiv.innerHTML = `<span style="color: var(--alert-red);">Erro ao calcular o roteiro encadeado nas ruas.</span>`;
        }
    } catch (error) {
        console.error(error);
        infoDiv.innerHTML = `<span style="color: var(--alert-red);">Erro de conexão com o servidor de rotas.</span>`;
    }
}
// ==========================================================
// CONTROLADOR DE ABAS DA SPA (B2B) - VERSÃO DEFINITIVA
// ==========================================================

function mudarAba(abaId) {
    console.log("Mudando para a aba:", abaId); // Para debugar no F12 se necessário

    // 1. Esconde todas as abas
    const abas = document.querySelectorAll('.tab-content');
    abas.forEach(tab => {
        tab.style.display = 'none';
    });
    
    // 2. Remove a classe 'active' de todos os itens do menu
    const itensMenu = document.querySelectorAll('.menu-list li');
    itensMenu.forEach(item => {
        item.classList.remove('active');
    });

    // 3. Exibe a aba correta e ativa o menu correspondente
    if (abaId === 'live') {
        const tabLive = document.getElementById('tab-live');
        const menuLive = document.getElementById('menu-live');
        if (tabLive) tabLive.style.display = 'block';
        if (menuLive) menuLive.classList.add('active');
    } 
    else if (abaId === 'routes') {
        const tabRoutes = document.getElementById('tab-routes');
        const menuRoutes = document.getElementById('menu-routes');
        
        if (tabRoutes) tabRoutes.style.display = 'block';
        if (menuRoutes) menuRoutes.classList.add('active');

        // Inicializa o mapa Leaflet de forma segura
        setTimeout(() => {
            if (typeof initLeafletMap === 'function') {
                initLeafletMap();
            }
            if (typeof mapInstance !== 'undefined' && mapInstance !== null) {
                mapInstance.invalidateSize();
            }
        }, 150);
    } 
    else if (abaId === 'reports') {
        const tabReports = document.getElementById('tab-reports');
        const menuReports = document.getElementById('menu-reports');
        if (tabReports) tabReports.style.display = 'block';
        if (menuReports) menuReports.classList.add('active');
    }
}
// Variável para o mapa ao vivo da Aba 1
let liveMapInstance = null;
let liveMarker = null;

function initLiveMap() {
    if (liveMapInstance) return;

    // Inicializa o mapa na região central (Ex: São Paulo / Santa Isabel)
    liveMapInstance = L.map('live-map').setView([-23.315, -46.221], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(liveMapInstance);

    // Adiciona o pino inicial do Corsa
    liveMarker = L.marker([-23.315, -46.221]).addTo(liveMapInstance)
        .bindPopup('<b>Chevrolet Corsa 1.0 (ABC-1234)</b><br>Status: Em movimento').openPopup();
}

// Atualiza a função de selecionar veículo para também mover o mapa ao vivo
const originalSelecionarVeiculo = window.selecionarVeiculo;
window.selecionarVeiculo = function(nomeVeiculo, motorista, velocidade, consumo, status, event) {
    if (typeof originalSelecionarVeiculo === 'function') {
        originalSelecionarVeiculo(nomeVeiculo, motorista, velocidade, consumo, status, event);
    }

    // Altera coordenadas simuladas com base no veículo escolhido para dar realismo
    let lat = -23.315;
    let lon = -46.221;
    if(nomeVeiculo.includes('Fiat Uno')) { lat = -23.480; lon = -46.450; }
    if(nomeVeiculo.includes('VW Gol')) { lat = -23.520; lon = -46.300; }

    if (liveMapInstance) {
        liveMapInstance.setView([lat, lon], 13);
        if (liveMarker) {
            liveMarker.setLatLng([lat, lon])
                .setPopupContent(`<b>${nomeVeiculo}</b><br>Motorista: ${motorista}<br>Status: ${status}`)
                .openPopup();
        }
    }
};

// Garante que o mapa ao vivo seja carregado ao abrir a aba 'live'
const originalMudarAba2 = window.mudarAba;
window.mudarAba = function(abaId) {
    if (typeof originalMudarAba2 === 'function') {
        originalMudarAba2(abaId);
    }
    if (abaId === 'live') {
        setTimeout(() => {
            initLiveMap();
            if (liveMapInstance) liveMapInstance.invalidateSize();
        }, 150);
    }
};

// Inicializa o mapa ao vivo logo na carga inicial se a aba ativa for a 'live'
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        initLiveMap();
    }, 300);
});