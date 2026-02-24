const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGPGkM61evA5quGZ5JJfnON7f5FcOINwcoMMN8MvZeWlYjlfSm4WAJJRITXqacJxPS/exec";
let fotoBase64 = "";

const getDevice = () => /Mobile|Android|iP(hone|od)/.test(navigator.userAgent) ? "Smartphone" : "PC Desktop";

// Gestione Foto
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
}

// Caricamento Dati (GET)
async function caricaDati() {
    document.getElementById('listaCategorie').innerHTML = "Sincronizzazione...";
    const res = await fetch(SCRIPT_URL);
    const dati = await res.json();
    
    document.getElementById('listaCategorie').innerHTML = "";
    document.getElementById('listaOrdinati').innerHTML = "";
    document.getElementById('listaArchivio').innerHTML = "";

    dati.forEach(r => {
        const dataStr = new Date(r[0]).toLocaleString('it-IT', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
        if (r[3] === "Da Ordinare") creaElementoLista(r[1], r[2], r[5]);
        else if (r[3] === "Ordinato") aggiungiAOrdinati(r[1], dataStr, r[5]);
        else if (r[3] === "Completato") aggiungiAArchivio(r[1], dataStr);
    });
}

// Invio Dati (POST)
async function aggiungiProdotto() {
    const nome = document.getElementById('productInput').value.trim();
    if (!nome) return;
    document.getElementById('btnInvio').disabled = true;

    await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "write", prodotto: nome, dispositivo: getDevice(), foto: fotoBase64 })
    });
    
    document.getElementById('productInput').value = "";
    cancellaFoto();
    document.getElementById('btnInvio').disabled = false;
    caricaDati();
}

async function cambiaStato(nome, nuovoStato) {
    await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "update", prodotto: nome, stato: nuovoStato })
    });
    caricaDati();
}

// Interfaccia
function creaElementoLista(nome, cat, foto) {
    let box = document.getElementById(`cat-${cat}`);
    if (!box) {
        document.getElementById('listaCategorie').innerHTML += `<div id="cat-${cat}" class="categoria-box"><div class="categoria-titolo">${cat}</div><ul id="ul-${cat}"></ul></div>`;
        box = document.getElementById(`cat-${cat}`);
    }
    const li = document.createElement('li');
    li.innerHTML = `<div class="info-prod">${foto ? `<img src="${foto}" class="img-mini">` : ''}<span>${nome}</span></div>
                    <button onclick="cambiaStato('${nome}', 'Ordinato')" style="background:#ffc107">Ordina</button>`;
    document.getElementById(`ul-${cat}`).appendChild(li);
}

function aggiungiAOrdinati(nome, data, foto) {
    const li = document.createElement('li');
    li.innerHTML = `<div class="info-prod">${foto ? `<img src="${foto}" class="img-mini">` : ''}
                    <div><b>${nome}</b><br><span class="data-label">${data}</span></div></div>
                    <div style="display:flex; gap:5px">
                        <button onclick="cambiaStato('${nome}', 'Da Ordinare')">↩️</button>
                        <button onclick="cambiaStato('${nome}', 'Completato')" style="background:#dc3545; color:white">Ricevuto</button>
                    </div>`;
    document.getElementById('listaOrdinati').appendChild(li);
}

function aggiungiAArchivio(nome, data) {
    document.getElementById('listaArchivio').innerHTML += `<li><span>${nome}</span><span class="data-label">${data}</span></li>`;
}

function toggleArchivio() {
    const s = document.getElementById('sezioneArchivio');
    s.style.display = s.style.display === "none" ? "block" : "none";
}

window.onload = caricaDati;
