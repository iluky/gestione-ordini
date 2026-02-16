const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIgYqSKkbH-o-PvMw72NilhOQ68N0kr8PliupNxSdMTQUBXDbvIQgPlj9ugRXhP0pQ/exec";

const getDeviceType = () => {
    return /Mobile|Android|iP(hone|od)/.test(navigator.userAgent) ? "Smartphone" : "PC Desktop";
};

// 1. Caricamento iniziale
window.onload = () => {
    richiestaJSONP(`${SCRIPT_URL}?action=read`, (dati) => {
        document.getElementById('loading-msg').style.display = 'none';
        dati.forEach(riga => {
            if (riga[3] === "Da Ordinare") creaElementoLista(riga[1], riga[2]);
            else if (riga[3] === "Ordinato") aggiungiAListaOrdinati(riga[1]);
        });
    });
};

// 2. Aggiunta prodotto
async function aggiungiProdotto() {
    const input = document.getElementById('productInput');
    const nome = input.value.trim();
    if (!nome) return;

    input.disabled = true;
    const disp = getDeviceType();
    const url = `${SCRIPT_URL}?action=write&prodotto=${encodeURIComponent(nome)}&dispositivo=${encodeURIComponent(disp)}`;

    richiestaJSONP(url, (risultato) => {
        creaElementoLista(nome, risultato.categoria || "Generico");
        input.disabled = false;
        input.value = "";
    });
}

// Sposta in "Ordinati" e aggiorna il Foglio
function azioneCambiaStato(bottone, nomeProdotto) {
    const url = `${SCRIPT_URL}?action=update&prodotto=${encodeURIComponent(nomeProdotto)}&stato=Ordinato`;
    
    bottone.disabled = true;
    bottone.innerText = "...";

    richiestaJSONP(url, (risultato) => {
        if (risultato.status === "updated") {
            const li = bottone.parentElement;
            li.remove();
            aggiungiAListaOrdinati(nomeProdotto);
        } else {
            alert("Errore nell'aggiornamento del foglio");
            bottone.disabled = false;
            bottone.innerText = "Ordina ✅";
        }
    });
}

// Segna come "Completato" e sparisce dall'app
function azioneRicevuto(bottone, nomeProdotto) {
    const url = `${SCRIPT_URL}?action=update&prodotto=${encodeURIComponent(nomeProdotto)}&stato=Completato`;
    
    bottone.disabled = true;

    richiestaJSONP(url, (risultato) => {
        if (risultato.status === "updated") {
            bottone.parentElement.remove();
        }
    });
}

// Helper: Crea UI "Da Ordinare"
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

// Helper: Crea UI "Ordinati"
function aggiungiAListaOrdinati(nome) {
    const listaOrdinati = document.getElementById('listaOrdinati');
    const li = document.createElement('li');
    li.innerHTML = `<span style="text-decoration:line-through; color:gray;">${nome}</span>
                    <button class="btn-elimina" onclick="azioneRicevuto(this, '${nome}')">Ricevuto 📦</button>`;
    listaOrdinati.appendChild(li);
}

// Funzione JSONP universale
function richiestaJSONP(url, callback) {
    const callbackName = 'jsonp_' + Math.round(100000 * Math.random());
    window[callbackName] = (data) => {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };
    const script = document.createElement('script');
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}`;
    document.body.appendChild(script);

}
// Permette di premere INVIO per aggiungere il prodotto
document.getElementById('productInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        aggiungiProdotto();
    }
});




