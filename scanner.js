// Dispensa — lettura del codice a barre con la fotocamera.
// Uso: Scanner.avvia(codice => { ... })  e  Scanner.ferma()

const Scanner = (() => {
  // ---------- Lettore di codici (zxing-wasm) ----------
  // Il "motore" del lettore è nel file lib/zxing_reader.wasm, servito dal nostro sito.
  if (typeof ZXingWASM === 'undefined') {
    throw new Error('il lettore di codici non si è caricato (lib/zxing-reader.js)');
  }
  ZXingWASM.prepareZXingModule({
    overrides: {
      locateFile: (percorso, prefisso) =>
        percorso.endsWith('.wasm') ? new URL('lib/' + percorso, location.href).href : prefisso + percorso,
    },
  });

  const OPZIONI_LETTURA = {
    formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'], // codici dei prodotti al supermercato
    tryHarder: true,
    maxNumberOfSymbols: 1,
  };

  // Area di lettura rispetto al riquadro visibile (deve corrispondere al mirino nel CSS)
  const MIRINO_LARGHEZZA = 0.85;
  const MIRINO_ALTEZZA = 0.5;

  const elLettore = document.getElementById('lettore');
  const video = document.getElementById('video');
  const elZoom = document.getElementById('zoom');
  const elStato = document.getElementById('stato-scanner');
  const selCamera = document.getElementById('scelta-camera');
  const elDiagnosi = document.getElementById('diagnosi');

  let flusso = null;      // il "flusso" video della fotocamera
  let traccia = null;     // la traccia video (serve per lo zoom)
  let inScansione = false;
  let staLeggendo = false;
  let quandoLetto = null; // funzione da chiamare quando legge un codice
  // Numero dell'accensione in corso: se nel frattempo si chiede di fermare la fotocamera,
  // l'accensione (che richiede un attimo) si accorge di essere "vecchia" e si interrompe.
  let accensione = 0;
  const tela = document.createElement('canvas');
  const contesto = tela.getContext('2d', { willReadFrequently: true });

  function leggiPreferenza(nome) {
    try { return localStorage.getItem(nome); } catch (e) { return null; }
  }
  function salvaPreferenza(nome, valore) {
    try { localStorage.setItem(nome, valore); } catch (e) { /* ignora */ }
  }

  function stato(testo, errore = false) {
    elStato.textContent = testo;
    elStato.classList.toggle('errore', errore);
  }

  // ---------- Avvio e stop ----------
  async function avvia(callback) {
    const questa = ++accensione;
    const superata = () => questa !== accensione;
    quandoLetto = callback;
    elLettore.hidden = false;
    stato('Avvio fotocamera…');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      elLettore.hidden = true;
      stato('Questo browser non permette di usare la fotocamera. Prova con Safari o Chrome aggiornati.', true);
      return;
    }

    const idCamera = leggiPreferenza('camera');
    const vincoli = {
      audio: false,
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        ...(idCamera ? { deviceId: { exact: idCamera } } : { facingMode: { ideal: 'environment' } }),
      },
    };

    let nuovoFlusso;
    try {
      nuovoFlusso = await navigator.mediaDevices.getUserMedia(vincoli);
    } catch (err) {
      if (superata()) return;
      if (idCamera) {
        // La fotocamera scelta non è più disponibile: torno a quella automatica
        salvaPreferenza('camera', '');
        return avvia(callback);
      }
      elLettore.hidden = true;
      stato('Non riesco ad aprire la fotocamera. Controlla di aver dato il permesso. (' + err.name + ')', true);
      return;
    }

    if (superata()) {
      nuovoFlusso.getTracks().forEach((t) => t.stop()); // nel frattempo è stata fermata
      return;
    }
    flusso = nuovoFlusso;
    traccia = flusso.getVideoTracks()[0];
    video.srcObject = flusso;
    try { await video.play(); } catch (e) { /* su iPhone parte comunque */ }
    if (superata()) return;

    inScansione = true;
    await preparaZoom();
    if (superata()) return;
    aggiornaElencoCamere();
    aggiornaDiagnosi();
    stato('Inquadra il codice a barre dentro il riquadro…');
    cicloLettura();
  }

  function ferma() {
    accensione++; // interrompe un'eventuale accensione in corso
    inScansione = false;
    if (flusso) flusso.getTracks().forEach((t) => t.stop());
    flusso = null;
    traccia = null;
    video.srcObject = null;
    elLettore.hidden = true;
    elZoom.hidden = true;
    stato('');
  }

  // ---------- Zoom ----------
  async function preparaZoom() {
    elZoom.innerHTML = '';
    elZoom.hidden = true;
    const capacita = traccia.getCapabilities ? traccia.getCapabilities() : {};
    if (!capacita.zoom) return; // questo telefono/browser non permette lo zoom

    const min = capacita.zoom.min || 1;
    const max = capacita.zoom.max || 1;
    const livelli = [1, 1.5, 2, 3].filter((z) => z >= min && z <= max);
    if (livelli.length < 2) return;

    const salvato = parseFloat(leggiPreferenza('zoom'));
    const iniziale = livelli.includes(salvato) ? salvato : (livelli.includes(1.5) ? 1.5 : livelli[0]);

    for (const z of livelli) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = z + '×';
      b.dataset.zoom = z;
      b.addEventListener('click', () => impostaZoom(z));
      elZoom.appendChild(b);
    }
    elZoom.hidden = false;
    await impostaZoom(iniziale);
  }

  async function impostaZoom(z) {
    if (!traccia) return;
    try {
      await traccia.applyConstraints({ advanced: [{ zoom: z }] });
      salvaPreferenza('zoom', String(z));
      for (const b of elZoom.children) b.classList.toggle('attivo', parseFloat(b.dataset.zoom) === z);
    } catch (e) { /* zoom non applicabile: si continua senza */ }
    aggiornaDiagnosi();
  }

  // ---------- Lettura continua dei fotogrammi ----------
  function cicloLettura() {
    if (!inScansione) return;
    setTimeout(async () => {
      if (!inScansione) return;
      if (!staLeggendo && video.readyState >= 2 && video.videoWidth > 0) {
        staLeggendo = true;
        try {
          const codice = await leggiFotogramma();
          if (codice && inScansione) {
            const callback = quandoLetto;
            ferma();
            if (navigator.vibrate) navigator.vibrate(100);
            if (callback) callback(codice);
            return;
          }
        } catch (e) {
          console.error(e);
        } finally {
          staLeggendo = false;
        }
      }
      cicloLettura();
    }, 120);
  }

  // Prende dal video, a piena risoluzione, solo la parte dentro il mirino e la passa al lettore.
  async function leggiFotogramma() {
    const vw = video.videoWidth, vh = video.videoHeight;
    const cw = video.clientWidth, ch = video.clientHeight;
    // Il video riempie il riquadro tagliando i bordi ("cover"): calcolo la parte visibile
    const scala = Math.max(cw / vw, ch / vh);
    const w = Math.round((cw / scala) * MIRINO_LARGHEZZA);
    const h = Math.round((ch / scala) * MIRINO_ALTEZZA);
    const x = Math.round((vw - w) / 2);
    const y = Math.round((vh - h) / 2);

    tela.width = w;
    tela.height = h;
    contesto.drawImage(video, x, y, w, h, 0, 0, w, h);
    const immagine = contesto.getImageData(0, 0, w, h);
    const risultati = await ZXingWASM.readBarcodes(immagine, OPZIONI_LETTURA);
    const valido = risultati.find((r) => r.isValid && r.text);
    return valido ? valido.text : null;
  }

  // ---------- Scelta della fotocamera ----------
  async function aggiornaElencoCamere() {
    if (!navigator.mediaDevices.enumerateDevices) return;
    const dispositivi = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    const scelta = leggiPreferenza('camera') || '';
    selCamera.innerHTML = '<option value="">Automatica (posteriore)</option>';
    dispositivi.forEach((d, i) => {
      const o = document.createElement('option');
      o.value = d.deviceId;
      o.textContent = d.label || 'Fotocamera ' + (i + 1);
      selCamera.appendChild(o);
    });
    selCamera.value = scelta;
  }

  selCamera.addEventListener('change', async () => {
    salvaPreferenza('camera', selCamera.value);
    if (inScansione) {
      const callback = quandoLetto;
      ferma();
      await avvia(callback);
    }
  });

  // Riga di informazioni tecniche: utile se qualcosa non funziona
  function aggiornaDiagnosi() {
    if (!traccia) return;
    const imp = traccia.getSettings ? traccia.getSettings() : {};
    const cap = traccia.getCapabilities ? traccia.getCapabilities() : {};
    elDiagnosi.textContent =
      'Info: ' + (traccia.label || 'fotocamera') +
      ' · ' + video.videoWidth + '×' + video.videoHeight +
      ' · zoom ' + (cap.zoom ? (imp.zoom || 1) + '× (max ' + cap.zoom.max + '×)' : 'non disponibile');
  }

  // ---------- Codice scritto a mano ----------
  const btnManuale = document.getElementById('btn-codice-manuale');
  const formCodice = document.getElementById('form-codice');
  const campoCodice = document.getElementById('campo-codice');
  const erroreCodice = document.getElementById('errore-codice');
  let codiceDaConfermare = ''; // codice con cifra di controllo sbagliata, già segnalato una volta

  /** Controlla l'ultima cifra (cifra di controllo) dei codici EAN-13, EAN-8 e UPC-A. */
  function cifraDiControlloGiusta(codice) {
    const cifre = codice.split('').map(Number);
    const controllo = cifre.pop();
    let somma = 0;
    cifre.reverse().forEach((c, i) => { somma += c * (i % 2 === 0 ? 3 : 1); });
    return (10 - (somma % 10)) % 10 === controllo;
  }

  const titoloScansione = document.getElementById('titolo-scansione');

  function preparaManuale() {
    titoloScansione.hidden = false;
    btnManuale.hidden = false;
    formCodice.hidden = true;
    campoCodice.value = '';
    erroreCodice.textContent = '';
    codiceDaConfermare = '';
  }

  btnManuale.addEventListener('click', () => {
    const callback = quandoLetto;
    ferma();             // spegne la fotocamera…
    quandoLetto = callback; // …ma ricorda cosa fare con il codice
    btnManuale.hidden = true;
    titoloScansione.hidden = true; // "Inquadra…" non serve più
    formCodice.hidden = false;
    campoCodice.focus(); // apre subito il tastierino
  });

  campoCodice.addEventListener('input', () => {
    erroreCodice.textContent = '';
    codiceDaConfermare = '';
  });

  formCodice.addEventListener('submit', (e) => {
    e.preventDefault();
    const codice = campoCodice.value.replace(/\D/g, '');
    if (![8, 12, 13].includes(codice.length)) {
      erroreCodice.textContent = 'Il codice deve avere 13 cifre (a volte 8 o 12). Ne hai scritte ' + codice.length + '.';
      return;
    }
    if (!cifraDiControlloGiusta(codice) && codiceDaConfermare !== codice) {
      codiceDaConfermare = codice;
      erroreCodice.textContent = 'Forse c\'è una cifra sbagliata: ricontrolla. Se il codice è giusto, tocca di nuovo Conferma.';
      return;
    }
    campoCodice.blur(); // chiude il tastierino
    const callback = quandoLetto;
    preparaManuale();
    if (callback) callback(codice);
  });

  /** Avvia la fotocamera e prepara anche l'inserimento a mano. */
  function avviaTutto(callback) {
    preparaManuale();
    return avvia(callback);
  }

  return { avvia: avviaTutto, ferma, cifraDiControlloGiusta };
})();
