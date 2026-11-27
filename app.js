// Dispensa — schermate e operazioni.
// IN (aggiungere un prodotto) e schermata iniziale con la LISTA (lista.js).

// ---------- Elementi della pagina ----------
const el = (id) => document.getElementById(id);

const sezioneHome = el('home');
const sezioneScansione = el('scansione');
const formIn = el('form-in');
const elMessaggio = el('messaggio');

const inCodice = el('in-codice');
const inNome = el('in-nome');
const inNomeStato = el('in-nome-stato');
const btnScegliData = el('btn-scegli-data');
const inDataLeggibile = el('in-data-leggibile');
const elPezzi = el('pezzi-numero');
const inErrore = el('in-errore');
const btnSalva = el('btn-salva');

// ---------- Stato del modulo IN ----------
const modulo = {
  codice: '',
  scadenza: '', // "AAAA-MM-GG"
  pezzi: 1,
};

function mostraMessaggio(testo, tipo) {
  elMessaggio.textContent = testo;
  elMessaggio.className = 'messaggio' + (tipo ? ' ' + tipo : '');
}

/** Mostra una sola parte della schermata principale: 'home', 'scansione' o 'in'. */
function mostra(parte) {
  sezioneHome.hidden = parte !== 'home';
  sezioneScansione.hidden = parte !== 'scansione';
  formIn.hidden = parte !== 'in';
  el('opzioni-fotocamera').hidden = parte === 'in';
  window.scrollTo(0, 0);
}

/** Torna alla schermata iniziale spegnendo la fotocamera (usata anche da Impostazioni). */
function tornaAllaHome() {
  Scanner.ferma();
  SelettoreData.chiudi();
  mostra('home');
}

// ---------- IN: scansione ----------
function iniziaIn() {
  if (!Collegamento.eConfigurato()) {
    mostraMessaggio('Prima collega il Google Sheet: tocca ⚙️ in alto a destra.', 'errore');
    return;
  }
  mostraMessaggio('');
  mostra('scansione');
  Scanner.avvia(apriModuloIn);
}

// ---------- IN: modulo ----------
function apriModuloIn(codice) {
  modulo.codice = codice;
  modulo.pezzi = 1;
  inCodice.textContent = codice;
  inNome.value = '';
  inErrore.textContent = '';
  impostaScadenza('');
  elPezzi.textContent = '1';
  btnSalva.disabled = false;
  mostra('in');
  cercaNome(codice);
}

/** Cerca il nome già usato in passato per questo codice (foglio "Prodotti"). */
async function cercaNome(codice) {
  inNomeStato.textContent = 'Cerco il nome…';
  try {
    const r = await Collegamento.chiama('nome', { codice });
    if (modulo.codice !== codice) return; // nel frattempo è cambiato prodotto
    if (r.nome && !inNome.value.trim()) {
      inNome.value = r.nome;
      inNomeStato.textContent = '✓ Nome ricordato dall\'ultima volta (puoi modificarlo).';
    } else if (!r.nome) {
      inNomeStato.textContent = 'Prodotto nuovo: scrivi il nome, la prossima volta lo ricorderò.';
    } else {
      inNomeStato.textContent = '';
    }
  } catch (err) {
    if (modulo.codice !== codice) return;
    inNomeStato.textContent = 'Non riesco a cercare il nome (' + err.message + '). Scrivilo a mano.';
  }
}

/** Imposta la scadenza scelta e aggiorna il pulsante della data e il testo leggibile. */
function impostaScadenza(testo) {
  modulo.scadenza = testo;
  btnScegliData.textContent = testo ? '📅 ' + Data.breve(testo) + ' (cambia)' : '📅 Scegli la data';
  btnScegliData.classList.toggle('scelta', Boolean(testo));
  if (!testo) {
    inDataLeggibile.textContent = '';
    inDataLeggibile.className = 'data-leggibile';
    return;
  }
  const giorni = Data.giorniMancanti(testo);
  inDataLeggibile.textContent = Data.leggibile(testo) + ' · ' + Data.distanza(testo);
  inDataLeggibile.className = 'data-leggibile' + (giorni < 0 ? ' errore' : ' scelta');
  inErrore.textContent = '';
}

btnScegliData.addEventListener('click', () => {
  SelettoreData.apri(impostaScadenza);
});

el('pezzi-meno').addEventListener('click', () => cambiaPezzi(-1));
el('pezzi-piu').addEventListener('click', () => cambiaPezzi(+1));
function cambiaPezzi(delta) {
  modulo.pezzi = Math.max(1, Math.min(20, modulo.pezzi + delta));
  elPezzi.textContent = String(modulo.pezzi);
}

formIn.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = inNome.value.trim();
  if (!nome) {
    inErrore.textContent = 'Scrivi il nome del prodotto.';
    return inNome.focus();
  }
  if (!modulo.scadenza) {
    inErrore.textContent = 'Scegli la data di scadenza.';
    return;
  }
  inErrore.textContent = '';
  btnSalva.disabled = true;
  btnSalva.textContent = 'Salvo…';
  try {
    const r = await Collegamento.chiama('aggiungi', {
      codice: modulo.codice,
      nome,
      scadenza: modulo.scadenza,
      pezzi: modulo.pezzi,
    });
    const quanti = modulo.pezzi > 1 ? ' ×' + modulo.pezzi : '';
    mostraMessaggio('✅ Salvato: ' + nome + quanti + ' (scade il ' + Data.breve(modulo.scadenza) + ')', 'successo');
    Lista.mostra(r.prodotti || []); // lo script restituisce già la lista aggiornata
    mostra('home');
  } catch (err) {
    inErrore.textContent = '❌ Non salvato: ' + err.message;
  } finally {
    btnSalva.disabled = false;
    btnSalva.textContent = 'Salva';
  }
});

// ---------- Pulsanti ----------
el('btn-in').addEventListener('click', iniziaIn);
el('btn-annulla-scansione').addEventListener('click', tornaAllaHome);
el('btn-annulla-in').addEventListener('click', () => {
  mostraMessaggio('');
  mostra('home');
});

// ---------- Avvio dell'app ----------
Lista.mostraDallaMemoria(); // subito l'ultima lista conosciuta…
Lista.carica();             // …poi quella aggiornata dal foglio

// Quando si torna sull'app (es. dopo averla lasciata aperta in background), riaggiorna la lista:
// così si vedono anche i prodotti aggiunti o tolti dall'altro telefono.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !sezioneHome.hidden) Lista.carica();
});
