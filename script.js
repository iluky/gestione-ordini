const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybEpVSj9brXjcaw2YYTQpRNYPWE1n6vUkkdUPbT-87bXtZb_Jl5bvSeLWLjh-TQFve/exec";

const getDeviceType = () => /Mobile|Android|iP(hone|od)/.test(navigator.userAgent) ? "Smartphone" : "PC Desktop";

// Funzione per formattare la data in modo leggibile
function formattaData(isoString) {
    const d = new Date(isoString);
    if (isNaN(d)) return "Data n.d.";
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Caricamento iniziale dei dati
window.onload = () => {
    richiestaJSONP(`${SCRIPT_URL}?action=read_all`, (dati) => {
        document.getElementById('loading-msg').style.display = 'none';
        dati.forEach(riga => {
            const dataStr = formattaData(riga[0]);
            if (riga[3] === "Da Ordinare") {
                creaElementoLista(riga[1], riga[2]);
            } else if (riga[3] === "Ordinato") {
                aggiungiAListaOrdinati(riga[1], dataStr);
            } else if (riga[3] === "Completato") {
                aggiungiAStorico(riga[1], dataStr);
            }
        });
    });
};

// Invio con tasto Enter
document.getElementById('productInput').addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') aggiungiProdotto(); 
});

// Aggiunta nuovo prodotto
function aggiungiProdotto() {
    const input = document.getElementById('productInput');
    const nome = input.value.trim();
    if (!nome) return;
    input.disabled = true;
    const url = `${SCRIPT_URL}?action=write&prodotto=${encodeURIComponent(nome)}&dispositivo=${encodeURIComponent(getDeviceType())}`;
    richiestaJSONP(url, (res) => {
        creaElementoLista(nome, res.categoria || "Generico");
        input.disabled = false;
        input.value = "";
    });
}

// Passaggio da "Da Ordinare" a "Ordinato"
function azioneCambiaStato(bottone, nome) {
    const url = `${SCRIPT_URL}?action=update&prodotto=${encodeURIComponent(nome)}&stato=Ordinato`;
    bottone.disabled = true;
    richiestaJSONP(url, (res) => {
        if (res.found) {
            bottone.parentElement.remove();
            // Aggiungiamo la data corrente per la sezione "In Arrivo"
            aggiungiAListaOrdinati(nome, formattaData(new Date()));
        }
    });
}

// Passaggio da "Ordinato" a "Completato" (Sparisce e va in archivio)
function azioneRicevuto(bottone, nome) {
    const url = `${SCRIPT_URL}?action=update&prodotto=${encodeURIComponent(nome)}&stato=Completato`;
    bottone.disabled = true;
    richiestaJSONP(url, (res) => {
        if (res.found) {
            // Rimuove l'elemento dalla lista "In Arrivo"
            bottone.parentElement.remove();
            // Lo aggiunge allo storico (visibile solo se l'archivio è aperto)
            aggiungiAStorico(nome, formattaData(new Date()));
        }
    });
}

function creaElementoLista(nome, categoria) {
    const contenitore = document.getElementById('listaCategorie');
    let divCat = document.getElementById(`cat-${categoria}`);
    if (!divCat) {
        divCat = document.createElement('div');
        divCat.id = `cat-${categoria}`;
        divCat.className = 'categoria-box';
        divCat.innerHTML = `<div class="categoria-titolo">${categoria}</div><ul id="ul-${categoria}"></ul>`;
        contenitore.appendChild(divCat);
    }
    const li = document.createElement('li');
    li.innerHTML = `<span>${nome}</span><button class="btn-ordina" onclick="azioneCambiaStato(this, '${nome}')">Ordina ✅</button>`;
    document.getElementById(`ul-${categoria}`).appendChild(li);
}

function aggiungiAListaOrdinati(nome, dataStr) {
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="info-prod">
            <span style="text-decoration:line-through; color:gray; font-weight:bold;">${nome}</span>
            <span class="data-label">Ordinato il: ${dataStr}</span>
        </div>
        <button class="btn-elimina" onclick="azioneRicevuto(this, '${nome}')">Ricevuto 📦</button>
    `;
    document.getElementById('listaOrdinati').appendChild(li);
}

function aggiungiAStorico(nome, dataStr) {
    const li = document.createElement('li');
    li.style.background = "#f1f3f5";
    li.style.flexDirection = "column";
    li.style.alignItems = "flex-start";
    li.innerHTML = `
        <span style="font-weight:bold;">${nome}</span>
        <span class="data-label">Completato il: ${dataStr}</span>
    `;
    document.getElementById('listaArchivio').appendChild(li);
}

function toggleArchivio() {
    const sez = document.getElementById('sezioneArchivio');
    const btn = document.getElementById('btnArchivio');
    const isHidden = sez.style.display === "none";
    sez.style.display = isHidden ? "block" : "none";
    btn.innerText = isHidden ? "Nascondi Storico" : "Mostra Storico Ricevuti";
}

function richiestaJSONP(url, callback) {
    const name = 'jsonp_' + Math.round(100000 * Math.random());
    window[name] = (data) => { delete window[name]; document.body.removeChild(script); callback(data); };
    const script = document.createElement('script');
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${name}`;
    document.body.appendChild(script);
}
