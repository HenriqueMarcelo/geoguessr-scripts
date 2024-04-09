// ==UserScript==
// @name         Ranked History
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  This script will generate a log of all locations. where you played ranked matches. To access the map, wait for the game page to load completely and press the "H" key on your keyboard.
// @author       HenriqueM
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://jvectormap.com/js/jquery-jvectormap-2.0.5.min.js
// @require      https://cdn.jsdelivr.net/npm/ika.jvectormap@1.0.0/jquery-jvectormap-world-mill-en.js
// @resource     IMPORTED_CSS https://cdnjs.cloudflare.com/ajax/libs/jvectormap/2.0.5/jquery-jvectormap.css
// @license MIT
// ==/UserScript==

function loadMap() {
    // Criação da div do modal
    var modalDiv = document.createElement("div");
    modalDiv.id = "map-modal";
    modalDiv.style.position = "fixed";
    modalDiv.style.top = "0";
    modalDiv.style.right = "0";
    modalDiv.style.display = "flex";
    modalDiv.style.zIndex = "100";
    modalDiv.style.background = "white";
    modalDiv.style.justifyContent = "center";
    modalDiv.style.padding = "1rem";
    modalDiv.style.margin = "1rem";
    modalDiv.style.left = "50%";
    modalDiv.style.transform = "translate(-50%, 0)";

    // Criação da div do mapa dentro do modal
    var mapDiv = document.createElement("div");
    mapDiv.id = "world-map";
    mapDiv.style.width = "1000px";
    mapDiv.style.height = "600px";

    // Adicionando a div do mapa dentro da div do modal
    modalDiv.appendChild(mapDiv);

    // Adicionando a div do modal ao final do body do documento
    document.body.appendChild(modalDiv);

    $(function(){
        $('#world-map').vectorMap({
            map: 'world_mill_en',
            scaleColors: ['#C8EEFF', '#0071A4'],
            normalizeFunction: 'polynomial',
            hoverOpacity: 0.7,
            hoverColor: false,
            markerStyle: {
                initial: {
                    r: 4,
                    fill: '#F8E23B',
                    stroke: '#383f47'
                }
            },
            backgroundColor: '#383f47',
            markers: getAllCompetitiveLocations()
        
        });
    })

}

function getAllGameLocations() {
    let storageData = localStorage.getItem('gameLocations');
        if (storageData) {
            // A LocalStorage está definida, então analisar o conteúdo como JSON
            storageData = JSON.parse(storageData);
    
            // Verificar se o conteúdo é um array
            if (!Array.isArray(storageData)) {
                return []
            } else {
                const arrayDeArrays = storageData.map(game => game.rounds)

                const arrayAchatado = arrayDeArrays.reduce(function(acumulador, valorAtual) {
                    // Concatenar cada array no acumulador
                    return acumulador.concat(valorAtual);
                }, []);

                const formatado = arrayAchatado.map(l => {
                    return {
                        latLng: [l.lat, l.lng], 
                        name: ''
                    }
                })

                return formatado;
            }
        } else {
            return []
        }
}

function getAllCompetitiveLocations() {
    let storageData = localStorage.getItem('competitiveLocations');
        if (storageData) {
            // A LocalStorage está definida, então analisar o conteúdo como JSON
            storageData = JSON.parse(storageData);
    
            // Verificar se o conteúdo é um array
            if (!Array.isArray(storageData)) {
                return []
            } else {
                const arrayDeArrays = storageData.map(game => game.rounds)
                // Todo corrgiir o index abaixo
                const arrayDeArrays2 = storageData.map(game => game.teams[0].roundResults)

                const arrayAchatado = arrayDeArrays.reduce(function(acumulador, valorAtual) {
                    // Concatenar cada array no acumulador
                    return acumulador.concat(valorAtual);
                }, []);

                const arrayAchatado2 = arrayDeArrays2.reduce(function(acumulador, valorAtual) {
                    // Concatenar cada array no acumulador
                    return acumulador.concat(valorAtual);
                }, []);

                const formatado = arrayAchatado.map((l, i) => {
                    return {
                        latLng: [l.panorama.lat, l.panorama.lng], 
                        name: '',
                        color: '#5000ff',
                        style: {
                            fill: calcularCor(arrayAchatado2[i].score),
                            stroke: calcularCor(arrayAchatado2[i].score),
                        }
                    }
                })

                return formatado;
            }
        } else {
            return []
        }
}

function getGameMode() {
    if(location.pathname.includes("/battle-royale/") ) {
        return 'battle-royale'
    }
    if(location.pathname.includes("/duels/") ) {
        return 'duels'
    }

    return null
}

function calcularCor(valor) {
    // Normalizar o valor para um intervalo entre 0 e 1
    const normalizedValue = valor / 5000;

    // Calcular os componentes RGB da cor
    const red = Math.round(255 * (1 - normalizedValue));
    const green = Math.round(255 * normalizedValue);
    const blue = 0; // Sem azul para esta transição

    // Formatar a cor no formato RGB
    const cor = `rgb(${red}, ${green}, ${blue})`;

    return cor;
}


(function() {
    'use strict';

    const myCss = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(myCss);

    async function getLocationObjectGame() {
        const tag = window.location.href.substring(window.location.href.lastIndexOf('/') + 1)
        const gameMode = getGameMode()
        console.log(getGameMode(), 'a');
        let game_endpoint = "https://www.geoguessr.com/api/v3/games/" + tag;
        if(gameMode) {
            game_endpoint = `https://game-server.geoguessr.com/api/${gameMode}/${tag}`
        }
        const api_url = game_endpoint

        const res = await fetch(api_url, {
            method: 'GET',
            credentials: 'include'
        });
        return await res.json();
    }

    async function saveGameLocations() {
        const chave = getGameMode() ? 'competitiveLocations' : 'gameLocations'
        const chavePrimaria = getGameMode() ? 'gameId' : 'token'
        // Obter o objeto de localização do jogo
        const gameinfo = await getLocationObjectGame();
    
        // Verificar se a LocalStorage está definida e se é um array
        let storageData = localStorage.getItem(chave);
        if (storageData) {
            // A LocalStorage está definida, então analisar o conteúdo como JSON
            storageData = JSON.parse(storageData);
    
            // Verificar se o conteúdo é um array
            if (!Array.isArray(storageData)) {
                // Se não for um array, definir como um array vazio
                storageData = [];
            } else {
                // Verificar se já existe um objeto com o mesmo token na LocalStorage
                const existingIndex = storageData.findIndex(item => item[chavePrimaria] === gameinfo[chavePrimaria]);
                if (existingIndex !== -1) {
                    // Se um objeto com o mesmo token foi encontrado, substituí-lo pelo novo objeto
                    storageData[existingIndex] = gameinfo;
                } else {
                    // Se não houver um objeto com o mesmo token, adicionar o novo objeto ao array
                    storageData.push(gameinfo);
                }
            }
        } else {
            // Se a LocalStorage não estiver definida, definir como um array contendo apenas o novo objeto
            storageData = [gameinfo];
        }
    
        // Salvar o array atualizado de volta na LocalStorage
        localStorage.setItem(chave, JSON.stringify(storageData));
    }

    

    function checkGameMode() {
        return location.pathname.includes("/game/") 
            || location.pathname.includes("/challenge/") 
            || location.pathname.includes("/battle-royale/") 
            || location.pathname.includes("/duels/");

    };

    

    function doCheck() {
        if (!document.querySelector('div[class*="result-layout_root__"]') && !document.querySelector('div[class*="game-finished-ranked_"]')) {
            sessionStorage.setItem("Checked", 0);
        } else if ((sessionStorage.getItem("Checked") || 0) == 0) {
            saveGameLocations();
            sessionStorage.setItem("Checked", 1);
        }
    };

    let lastDoCheckCall = 0;
    new MutationObserver(async (mutations) => {
        if (!checkGameMode() || lastDoCheckCall >= (Date.now() - 50)) return;
        lastDoCheckCall = Date.now();
        doCheck()
    }).observe(document.body, {
        subtree: true,
        childList: true
    });

    // ---------------
    
    document.addEventListener("keypress", function handleKeyPress(event) {
        // Verificar se a tecla pressionada é "h"
        if (event.key === "h") {
            loadMap()
        }
        if (event.key === "ç") {
            alert('salvo');
            saveGameLocations();
        }
    });
})();