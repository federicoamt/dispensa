// Dispensa — collegamento al Google Sheet (tramite lo script Google) e schermata Impostazioni.
// Indirizzo dello script e chiave segreta sono salvati SOLO nel browser di questo telefono.

const Collegamento = (() => {
  const CHIAVE_URL = 'scriptUrl';
  const CHIAVE_SEGRETA = 'scriptChiave';
  const ATTESA_MASSIMA_MS = 25000;

  function leggi(nome) {
    try { return localStorage.getItem(nome) || ''; } catch (e) { return ''; }
  }
  function scrivi(nome, valore) {
    try { localStorage.setItem(nome, valore); } catch (e) { /* ignora */ }
  }

  function configurazione() {
    return { url: leggi(CHIAVE_URL), chiave: leggi(CHIAVE_SEGRETA) };
  }

  function eConfigurato() {
    const c = configurazione();
    return Boolean(c.url && c.chiave);
  }

  function salva(url, chiave) {
    scrivi(CHIAVE_URL, url);
    scrivi(CHIAVE_SEGRETA, chiave);
  }

  /** Controlla che l'indirizzo sia quello giusto; restituisce un messaggio d'errore o ''. */
  function problemaIndirizzo(url) {
    if (!url) return "Manca l'indirizzo dello script.";
    if (/\/dev$/.test(url)) {
      return "Hai copiato l'indirizzo di prova (finisce con /dev). Serve quello che finisce con /exec.";
    }
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
      return "L'indirizzo deve iniziare con https://script.google.com/ e finire con /exec.";
    }
    return '';
  }

  // Messaggi comprensibili per gli errori che può restituire lo script
  const SPIEGAZIONI = {
    chiave_sbagliata: 'Chiave segreta sbagliata. Ricopiala dal registro dello script.',
    non_configurato: 'Lo script non è configurato: esegui la funzione "configura" nell\'editor di Apps Script.',
    non_trovato: 'Non trovato in dispensa.',
    occupato: "Il foglio è occupato da un'altra operazione. Riprova tra un attimo.",
    richiesta_non_valida: "Richiesta non valida (problema nell'app).",
    azione_sconosciuta: "Lo script non conosce questa operazione: forse va aggiornato.",
  };

  /**
   * Manda una richiesta allo script e restituisce la risposta.
   * In caso di problemi lancia un errore con un messaggio in italiano.
   */
  async function chiama(azione, dati = {}) {
    const { url, chiave } = configurazione();
    if (!url || !chiave) throw new Error('Google Sheet non collegato: apri ⚙️ Impostazioni.');

    const controllo = new AbortController();
    const timer = setTimeout(() => controllo.abort(), ATTESA_MASSIMA_MS);
    let risposta;
    try {
      risposta = await fetch(url, {
        method: 'POST',
        // "text/plain" è necessario: con altri tipi Google rifiuta la richiesta dal browser
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...dati, azione, chiave }),
        signal: controllo.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Il foglio non risponde (tempo scaduto). Controlla la connessione e riprova.');
      throw new Error(
        "Non riesco a contattare lo script. Controlla l'indirizzo e che in \"Chi ha accesso\" sia scelto \"Chiunque\"."
      );
    } finally {
      clearTimeout(timer);
    }

    let json;
    try {
      json = await risposta.json();
    } catch (err) {
      throw new Error(
        'Lo script ha risposto in modo inatteso. Controlla che in "Chi ha accesso" sia scelto "Chiunque" e che l\'indirizzo sia giusto.'
      );
    }
    if (!json.ok) {
      const spiegazione = SPIEGAZIONI[json.errore] || 'Errore dello script: ' + (json.dettaglio || json.errore);
      const errore = new Error(spiegazione);
      errore.codice = json.errore;
      throw errore;
    }
    return json;
  }

  return { configurazione, eConfigurato, salva, problemaIndirizzo, chiama };
})();

// ---------- Schermata Impostazioni ----------
(() => {
  const vistaPrincipale = document.getElementById('vista-principale');
  const vistaImpostazioni = document.getElementById('vista-impostazioni');
  const btnImpostazioni = document.getElementById('btn-impostazioni');
  const btnIndietro = document.getElementById('btn-indietro');
  const btnSalvaProva = document.getElementById('btn-salva-prova');
  const campoUrl = document.getElementById('campo-url');
  const campoChiave = document.getElementById('campo-chiave');
  const esito = document.getElementById('esito-collegamento');
  const avviso = document.getElementById('avviso-collegamento');

  function mostraEsito(testo, tipo) {
    esito.textContent = testo;
    esito.className = 'messaggio' + (tipo ? ' ' + tipo : '');
  }

  function aggiornaAvviso() {
    avviso.hidden = Collegamento.eConfigurato();
  }

  function apriImpostazioni() {
    // Se la fotocamera è accesa, la spegne (la funzione è in app.js)
    if (typeof fermaScansione === 'function') fermaScansione();
    const c = Collegamento.configurazione();
    campoUrl.value = c.url;
    campoChiave.value = c.chiave;
    mostraEsito('');
    vistaPrincipale.hidden = true;
    vistaImpostazioni.hidden = false;
    window.scrollTo(0, 0);
  }

  function chiudiImpostazioni() {
    vistaImpostazioni.hidden = true;
    vistaPrincipale.hidden = false;
    aggiornaAvviso();
  }

  async function salvaEProva() {
    const url = campoUrl.value.trim();
    const chiave = campoChiave.value.trim();
    campoUrl.value = url;
    campoChiave.value = chiave;
    const problema = Collegamento.problemaIndirizzo(url);
    if (problema) return mostraEsito(problema, 'errore');
    if (!chiave) return mostraEsito('Manca la chiave segreta.', 'errore');

    Collegamento.salva(url, chiave);
    aggiornaAvviso();
    btnSalvaProva.disabled = true;
    mostraEsito('Salvato. Provo il collegamento…');
    try {
      const r = await Collegamento.chiama('ping');
      const pezzi = r.pezzi === 1 ? '1 pezzo' : r.pezzi + ' pezzi';
      mostraEsito('✅ Collegamento OK! In dispensa ci sono ' + pezzi + '.', 'successo');
    } catch (err) {
      mostraEsito('❌ ' + err.message, 'errore');
    } finally {
      btnSalvaProva.disabled = false;
    }
  }

  btnImpostazioni.addEventListener('click', () => {
    if (vistaImpostazioni.hidden) apriImpostazioni();
    else chiudiImpostazioni();
  });
  btnIndietro.addEventListener('click', chiudiImpostazioni);
  avviso.addEventListener('click', apriImpostazioni);
  btnSalvaProva.addEventListener('click', salvaEProva);

  aggiornaAvviso();
})();
