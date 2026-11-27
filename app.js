// Dispensa — schermate e operazioni.
// Tappa 3: IN (aggiungere un prodotto).

// ---------- Elementi della pagina ----------
const el = (id) => document.getElementById(id);

const sezioneHome = el('home');
const sezioneScansione = el('scansione');
const formIn = el('form-in');
const elMessaggio = el('messaggio');

const inCodice = el('in-codice');
const inNome = el('in-nome');
const inNomeStato = el('in-nome-stato');
const inData = el('in-data');
const inDataTesto = el('in-data-testo');
const inDataLeggibile = el('in-data-leggibile');
const elScorciatoie = el('scorciatoie');
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
  inDataTesto.value = '';
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

/** Imposta la scadenza scelta e aggiorna calendario, scorciatoie e testo leggibile. */
function impostaScadenza(testo, origine) {
  modulo.scadenza = testo;
  if (origine !== 'calendario') inData.value = testo;
  if (origine !== 'scorciatoia') {
    for (const b of elScorciatoie.children) b.classList.remove('attivo');
  }
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

elScorciatoie.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const data = Data.aggiungi({
    giorni: parseInt(b.dataset.giorni || '0', 10),
    mesi: parseInt(b.dataset.mesi || '0', 10),
  });
  for (const altro of elScorciatoie.children) altro.classList.toggle('attivo', altro === b);
  inDataTesto.value = '';
  impostaScadenza(data, 'scorciatoia');
});

inData.addEventListener('change', () => {
  inDataTesto.value = '';
  impostaScadenza(inData.value, 'calendario');
});

inDataTesto.addEventListener('input', () => {
  const testo = inDataTesto.value.trim();
  if (!testo) return impostaScadenza('');
  const data = Data.interpreta(testo);
  if (data) {
    impostaScadenza(data, 'testo');
  } else {
    modulo.scadenza = '';
    inData.value = '';
    for (const b of elScorciatoie.children) b.classList.remove('attivo');
    inDataLeggibile.textContent = 'Non riconosco una data (es. 12/03/27, 03/2027, 12 MAR 2027).';
    inDataLeggibile.className = 'data-leggibile errore';
  }
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
    await Collegamento.chiama('aggiungi', {
      codice: modulo.codice,
      nome,
      scadenza: modulo.scadenza,
      pezzi: modulo.pezzi,
    });
    const quanti = modulo.pezzi > 1 ? ' ×' + modulo.pezzi : '';
    mostraMessaggio('✅ Salvato: ' + nome + quanti + ' (scade il ' + Data.breve(modulo.scadenza) + ')', 'successo');
    aggiungiAUltime(nome + quanti, Data.breve(modulo.scadenza));
    mostra('home');
  } catch (err) {
    inErrore.textContent = '❌ Non salvato: ' + err.message;
  } finally {
    btnSalva.disabled = false;
    btnSalva.textContent = 'Salva';
  }
});

/** Piccolo elenco di conferma di ciò che è stato aggiunto in questa sessione. */
function aggiungiAUltime(testo, scadenza) {
  const lista = el('ultime-aggiunte');
  const li = document.createElement('li');
  li.textContent = testo;
  const span = document.createElement('span');
  span.textContent = scadenza;
  li.appendChild(span);
  lista.prepend(li);
  while (lista.children.length > 5) lista.lastChild.remove();
  el('sezione-ultime').hidden = false;
}

// ---------- Pulsanti ----------
el('btn-in').addEventListener('click', iniziaIn);
el('btn-annulla-scansione').addEventListener('click', tornaAllaHome);
el('btn-annulla-in').addEventListener('click', () => {
  mostraMessaggio('');
  mostra('home');
});
