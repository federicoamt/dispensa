// Dispensa — schermate e operazioni.
// IN (aggiungere), OUT (togliere) e schermata iniziale con la LISTA (lista.js).

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
  document.body.classList.toggle('con-barra', parte === 'home');
  window.scrollTo(0, 0);
}

/** Torna alla schermata iniziale spegnendo la fotocamera (usata anche da Impostazioni). */
function tornaAllaHome() {
  Scanner.ferma();
  SelettoreData.chiudi();
  Finestra.chiudi();
  mostra('home');
}

// ---------- IN: scansione ----------
function iniziaIn() {
  if (!Collegamento.eConfigurato()) {
    mostraMessaggio('Prima collega il Google Sheet: tocca ⚙️ in alto a destra.', 'errore');
    return;
  }
  mostraMessaggio('');
  nascondiAnnulla();
  el('titolo-scansione').textContent = 'Inquadra il codice a barre';
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

// ---------- OUT: togliere un pezzo ----------
let ultimoTolto = null; // per "Annulla"

/** Passo 1: come scegliere il prodotto? */
function iniziaOut() {
  if (!Collegamento.eConfigurato()) {
    mostraMessaggio('Prima collega il Google Sheet: tocca ⚙️ in alto a destra.', 'errore');
    return;
  }
  nascondiAnnulla();
  if (!Lista.prodotti().length) {
    mostraMessaggio('La dispensa è vuota: non c\'è niente da togliere.');
    return;
  }
  mostraMessaggio('');
  Finestra.apri({
    titolo: 'Togli un prodotto',
    voci: [
      { testo: '📷 Inquadra il codice', grande: true, azione: outInquadra },
      { testo: '📋 Scegli dalla lista', grande: true, azione: outDallaLista },
    ],
  });
}

/** Passo 2a: inquadra il codice a barre. */
function outInquadra() {
  Finestra.chiudi();
  el('titolo-scansione').textContent = 'Inquadra il prodotto da togliere';
  mostra('scansione');
  Scanner.avvia((codice) => {
    mostra('home');
    const pezzi = Lista.prodotti().filter((p) => p.codice === codice);
    if (!pezzi.length) {
      mostraMessaggio('Non trovato in dispensa (codice ' + codice + ').', 'errore');
      return;
    }
    scegliScadenza(pezzi, null);
  });
}

/** Passo 2b: scegli il prodotto dall'elenco (in ordine alfabetico). */
function outDallaLista() {
  const gruppi = {};
  for (const p of Lista.prodotti()) {
    const chiave = p.codice + '|' + p.nome;
    (gruppi[chiave] = gruppi[chiave] || []).push(p);
  }
  const elenco = Object.values(gruppi)
    .map((pezzi) => ({ pezzi, nome: pezzi[0].nome || '(senza nome)', prima: primaScadenza(pezzi) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));

  Finestra.apri({
    titolo: 'Scegli il prodotto',
    indietro: iniziaOut,
    voci: elenco.map((g) => ({
      testo: g.nome + (g.pezzi.length > 1 ? '  ×' + g.pezzi.length : ''),
      dettaglio: g.prima ? 'scade il ' + Data.breve(g.prima) : 'senza data',
      classe: Lista.livello(Data.giorniMancanti(g.prima)),
      azione: () => scegliScadenza(g.pezzi, outDallaLista),
    })),
  });
}

function primaScadenza(pezzi) {
  return pezzi.map((p) => p.scadenza).filter(Boolean).sort()[0] || '';
}

/** Passo 3: quale scadenza togliere? (una riga per data, con il numero di pezzi) */
function scegliScadenza(pezzi, indietro) {
  const perData = {};
  for (const p of pezzi) (perData[p.scadenza] = perData[p.scadenza] || []).push(p);
  const date = Object.keys(perData).sort((a, b) => (a || '9999').localeCompare(b || '9999'));

  Finestra.apri({
    titolo: 'Quale scadenza togli?',
    sottotitolo: pezzi[0].nome,
    indietro,
    voci: date.map((data) => {
      const stessi = perData[data];
      const liv = Lista.livello(Data.giorniMancanti(data));
      const dettagli = [stessi.length === 1 ? '1 pezzo' : stessi.length + ' pezzi'];
      if (liv) dettagli.push(Data.distanza(data));
      // Di quelli con la stessa data, tolgo il pezzo entrato per primo
      const pezzo = stessi.slice().sort((a, b) => (a.entrata || '').localeCompare(b.entrata || ''))[0];
      return {
        testo: data ? Data.breve(data) : 'senza data',
        dettaglio: dettagli.join(' · '),
        classe: liv,
        azione: () => togli(pezzo),
      };
    }),
  });
}

/** Passo 4: toglie il pezzo (lo sposta nello Storico) e offre "Annulla". */
async function togli(pezzo) {
  Finestra.chiudi();
  mostra('home');
  mostraMessaggio('Tolgo ' + pezzo.nome + '…');
  try {
    const r = await Collegamento.chiama('rimuovi', { id: pezzo.id });
    Lista.mostra(r.prodotti || []);
    const scadeva = r.rimosso.scadenza ? ' (scadeva il ' + Data.breve(r.rimosso.scadenza) + ')' : '';
    mostraMessaggio('✅ Tolto: ' + r.rimosso.nome + scadeva, 'successo');
    ultimoTolto = r.rimosso;
    el('btn-annulla-out').hidden = false;
  } catch (err) {
    if (err.codice === 'non_trovato') {
      mostraMessaggio('Questo pezzo era già stato tolto (forse dall\'altro telefono). Ho aggiornato la lista.', 'errore');
      Lista.carica();
    } else {
      mostraMessaggio('❌ Non tolto: ' + err.message, 'errore');
    }
  }
}

function nascondiAnnulla() {
  ultimoTolto = null;
  el('btn-annulla-out').hidden = true;
}

/** "Annulla": rimette in dispensa l'ultimo pezzo tolto. */
async function annullaOut() {
  if (!ultimoTolto) return;
  const pezzo = ultimoTolto;
  nascondiAnnulla();
  mostraMessaggio('Rimetto ' + pezzo.nome + ' in dispensa…');
  try {
    const r = await Collegamento.chiama('ripristina', { id: pezzo.id });
    Lista.mostra(r.prodotti || []);
    mostraMessaggio('↩︎ Rimesso in dispensa: ' + pezzo.nome, 'successo');
  } catch (err) {
    if (err.codice === 'azione_sconosciuta') {
      mostraMessaggio('Per usare "Annulla" va prima aggiornato lo script Google alla versione 2.', 'errore');
    } else {
      mostraMessaggio('❌ Non annullato: ' + err.message, 'errore');
    }
  }
}

// ---------- Pulsanti ----------
el('btn-in').addEventListener('click', iniziaIn);
el('btn-out').addEventListener('click', iniziaOut);
el('btn-annulla-out').addEventListener('click', annullaOut);
el('btn-annulla-scansione').addEventListener('click', tornaAllaHome);
el('btn-annulla-in').addEventListener('click', () => {
  mostraMessaggio('');
  mostra('home');
});

// ---------- Avvio dell'app ----------
// Misura l'altezza della barra in basso (cambia quando compare un messaggio o "Annulla")
const barra = el('barra-azioni');
const misuraBarra = () => document.body.style.setProperty('--altezza-barra', barra.offsetHeight + 'px');
if (window.ResizeObserver) new ResizeObserver(misuraBarra).observe(barra);
misuraBarra();
document.body.classList.add('con-barra');

Lista.mostraDallaMemoria(); // subito l'ultima lista conosciuta…
Lista.carica();             // …poi quella aggiornata dal foglio

// Quando si torna sull'app (es. dopo averla lasciata aperta in background), riaggiorna la lista:
// così si vedono anche i prodotti aggiunti o tolti dall'altro telefono.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !sezioneHome.hidden) Lista.carica();
});
