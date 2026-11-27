// Dispensa — LISTA dei prodotti in dispensa, ordinati per scadenza e colorati.
// Uso: Lista.carica()  (scarica dal foglio)   Lista.mostra(prodotti)  (disegna una lista già ricevuta)

const Lista = (() => {
  // Soglie dei colori (giorni mancanti alla scadenza)
  const SOGLIA_ARANCIONE = 3; // da oggi a 3 giorni
  const SOGLIA_GIALLO = 7;    // da 4 a 7 giorni
  const MEMORIA = 'ultimaLista';

  const elLista = document.getElementById('lista-prodotti');
  const elTitolo = document.getElementById('lista-titolo');
  const elRiepilogo = document.getElementById('lista-riepilogo');
  const elStato = document.getElementById('lista-stato');
  const btnAggiorna = document.getElementById('btn-aggiorna');

  let inCaricamento = false;

  /** 'scaduto' | 'arancione' | 'giallo' | '' */
  function livello(giorni) {
    if (giorni === null) return '';
    if (giorni < 0) return 'scaduto';
    if (giorni <= SOGLIA_ARANCIONE) return 'arancione';
    if (giorni <= SOGLIA_GIALLO) return 'giallo';
    return '';
  }

  /** Unisce i pezzi uguali (stesso codice, nome e scadenza) in una riga "×N". */
  function raggruppa(prodotti) {
    const gruppi = [];
    const indice = {};
    for (const p of prodotti) {
      const chiave = p.codice + '|' + p.nome + '|' + p.scadenza;
      if (indice[chiave] === undefined) {
        indice[chiave] = gruppi.length;
        gruppi.push({ ...p, pezzi: 0 });
      }
      gruppi[indice[chiave]].pezzi++;
    }
    // Prima chi scade prima; senza data in fondo; a parità, in ordine alfabetico
    return gruppi.sort((a, b) =>
      (a.scadenza || '9999').localeCompare(b.scadenza || '9999') || a.nome.localeCompare(b.nome, 'it'));
  }

  function mostra(prodotti) {
    salvaInMemoria(prodotti);
    const gruppi = raggruppa(prodotti);
    elLista.innerHTML = '';

    const conteggi = { scaduto: 0, arancione: 0, giallo: 0 };
    for (const g of gruppi) {
      const giorni = Data.giorniMancanti(g.scadenza);
      const liv = livello(giorni);
      if (liv) conteggi[liv] += g.pezzi;

      const li = document.createElement('li');
      li.className = 'prodotto' + (liv ? ' ' + liv : '');

      const sinistra = document.createElement('div');
      sinistra.className = 'prodotto-nome';
      sinistra.textContent = g.nome || '(senza nome)';
      if (g.pezzi > 1) {
        const quanti = document.createElement('span');
        quanti.className = 'quanti';
        quanti.textContent = '×' + g.pezzi;
        sinistra.appendChild(quanti);
      }

      const destra = document.createElement('div');
      destra.className = 'prodotto-data';
      const data = document.createElement('span');
      data.className = 'data';
      data.textContent = g.scadenza ? Data.breve(g.scadenza) : 'senza data';
      destra.appendChild(data);
      // "tra 2 giorni", "scaduto da…": solo per le righe colorate (scadute o in scadenza)
      if (liv) {
        const distanza = document.createElement('span');
        distanza.className = 'distanza';
        distanza.textContent = Data.distanza(g.scadenza);
        destra.appendChild(distanza);
      }

      li.append(sinistra, destra);
      elLista.appendChild(li);
    }

    const totale = prodotti.length;
    elTitolo.textContent = 'In dispensa' + (totale ? ' · ' + (totale === 1 ? '1 pezzo' : totale + ' pezzi') : '');

    const parti = [];
    if (conteggi.scaduto) parti.push('🔴 ' + conteggi.scaduto + (conteggi.scaduto === 1 ? ' scaduto' : ' scaduti'));
    if (conteggi.arancione) parti.push('🟠 ' + conteggi.arancione + ' entro 3 giorni');
    if (conteggi.giallo) parti.push('🟡 ' + conteggi.giallo + ' entro 7 giorni');
    elRiepilogo.innerHTML = '';
    for (const parte of parti) {
      const span = document.createElement('span');
      span.textContent = parte;
      elRiepilogo.appendChild(span);
    }
    elRiepilogo.hidden = parti.length === 0;

    if (!totale) stato('La dispensa è vuota. Aggiungi il primo prodotto con ➕');
  }

  function stato(testo, errore = false) {
    elStato.textContent = testo;
    elStato.classList.toggle('errore', errore);
  }

  /** Scarica la lista dal foglio. Nel frattempo resta visibile l'ultima lista conosciuta. */
  async function carica() {
    if (!Collegamento.eConfigurato()) {
      elLista.innerHTML = '';
      elRiepilogo.hidden = true;
      elTitolo.textContent = 'In dispensa';
      stato('');
      return;
    }
    if (inCaricamento) return;
    inCaricamento = true;
    btnAggiorna.disabled = true;
    stato('Aggiorno la lista…');
    try {
      const r = await Collegamento.chiama('lista');
      stato('');
      mostra(r.prodotti || []);
    } catch (err) {
      stato('❌ Lista non aggiornata: ' + err.message, true);
    } finally {
      inCaricamento = false;
      btnAggiorna.disabled = false;
    }
  }

  function salvaInMemoria(prodotti) {
    try { localStorage.setItem(MEMORIA, JSON.stringify(prodotti)); } catch (e) { /* ignora */ }
  }

  /** Mostra subito l'ultima lista salvata nel telefono (se c'è), senza aspettare Google. */
  function mostraDallaMemoria() {
    if (!Collegamento.eConfigurato()) return;
    try {
      const salvata = JSON.parse(localStorage.getItem(MEMORIA) || 'null');
      if (Array.isArray(salvata)) mostra(salvata);
    } catch (e) { /* ignora */ }
  }

  btnAggiorna.addEventListener('click', carica);

  return { carica, mostra, mostraDallaMemoria, livello, raggruppa };
})();
