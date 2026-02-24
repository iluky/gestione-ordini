const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzXcQ08DlQIBfhbO7Qmr_uDQmTSUYs0_8hBJBTlTaZll4cBDztzQZSGsFqLXyixeeND/exec";
let fotoBase64 = "";

const getDevice = () => /Mobile|Android|iP(hone|od)/.test(navigator.userAgent) ? "Smartphone" : "PC Desktop";

// GESTIONE FOTO
document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            fotoBase64 = event.target.result;
            document.getElementById('photoPreview').src = fotoBase64;
            document.getElementById('preview-container').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function cancellaFoto() {
    fotoBase64 = "";
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('photoInput').value = "";
}

// SINCRONIZZAZIONE (GET tramite JSONP)
function caricaDati() {
    const loading = document.getElementById('listaCategorie');
    loading.innerHTML = "<p>Sincronizzazione...</p>";
    
    const callbackName = 'jsonp_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');
    
    window[callbackName] = (dati) => {
        delete window[callbackName];
        document.body.removeChild(script);
        
        loading.innerHTML = "";
        document.getElementById('listaOrdinati').innerHTML = "";
        document.getElementById('listaArchivio').innerHTML = "";

        dati.forEach(r => {
            const dataStr = r[0] ? new Date(r[0]).toLocaleString('it-IT', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : "---";
            if (r[3] === "Da Ordinare") creaElementoLista(r[1], r[2], r[5]);
            else if (r[3] === "Ordinato") aggiungiAOrdinati(r[1], dataStr, r[5]);
            else if (r[3] === "Completato") aggiungiAArchivio(r[1], dataStr, r[5]);
        });
    };

    script.src = `${SCRIPT_URL}?callback=${callbackName}&t=${Date.now()}`;
    document.body.appendChild(script);
}

// INVIO (POST)
async function aggiungiProdotto() {
    const input = document.getElementById('productInput');
    const nome = input.value.trim();
    if (!nome) return;
    
    document.getElementById('btnInvio').disabled = true;

    await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "write", prodotto: nome, dispositivo: getDevice(), foto: fotoBase64 })
    });
    
    setTimeout(() => {
        input.value = "";
        cancellaFoto();
        document.getElementById('btnInvio').disabled = false;
        caricaDati();
    }, 1000);
}

async function cambiaStato(nome, nuovoStato) {
    await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "update", prodotto: nome, stato: nuovoStato })
    });
    setTimeout(caricaDati, 1000);
}

// UI HELPERS
function creaElementoLista(nome, cat, foto) {
    let box = document.getElementById(`cat-${cat}`);
    if (!box) {
        document.getElementById('listaCategorie').insertAdjacentHTML('beforeend', `<div id="cat-${cat}" class="categoria-box"><div class="categoria-titolo">${cat}</div><ul id="ul-${cat}"></ul></div>`);
        box = document.getElementById(`cat-${cat}`);
    }
    const li = document.createElement('li');
    li.innerHTML = `<div class="info-prod">${foto ? `<img src="${foto}" class="img-mini" onclick="window.open(this.src)">` : ''}<span>${nome}</span></div>
                    <button onclick="cambiaStato('${nome}', 'Ordinato')" style="background:#ffc107; border:none; padding:8px; border-radius:8px; font-weight:bold; cursor:pointer">Ordina</button>`;
    document.getElementById(`ul-${cat}`).appendChild(li);
}

function aggiungiAOrdinati(nome, data, foto) {
    const li = document.createElement('li');
    li.innerHTML = `<div class="info-prod">${foto ? `<img src="${foto}" class="img-mini" onclick="window.open(this.src)">` : ''}
                    <div><b>${nome}</b><span class="data-label">Ord: ${data}</span></div></div>
                    <div style="display:flex; gap:5px">
                        <button onclick="cambiaStato('${nome}', 'Da Ordinare')" style="border:none; background:#eee; padding:8px; border-radius:8px; cursor:pointer">↩️</button>
                        <button onclick="cambiaStato('${nome}', 'Completato')" style="border:none; background:#dc3545; color:white; padding:8px; border-radius:8px; cursor:pointer">Ricevuto</button>
                    </div>`;
    document.getElementById('listaOrdinati').appendChild(li);
}

function aggiungiAArchivio(nome, data, foto) {
    const li = document.createElement('li');
    li.style.opacity = "0.7";
    li.innerHTML = `<div class="info-prod">${foto ? `<img src="${foto}" class="img-mini" style="filter:grayscale(1)">` : ''}
                    <div><span>${nome}</span><span class="data-label">Ricevuto il: ${data}</span></div></div>`;
    document.getElementById('listaArchivio').appendChild(li);
}

function toggleArchivio() {
    const s = document.getElementById('sezioneArchivio');
    s.style.display = s.style.display === "none" ? "block" : "none";
}

window.onload = caricaDati;




