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

    try {
      flusso = await navigator.mediaDevices.getUserMedia(vincoli);
    } catch (err) {
      if (idCamera) {
        // La fotocamera scelta non è più disponibile: torno a quella automatica
        salvaPreferenza('camera', '');
        return avvia(callback);
      }
      elLettore.hidden = true;
      stato('Non riesco ad aprire la fotocamera. Controlla di aver dato il permesso. (' + err.name + ')', true);
      return;
    }

    traccia = flusso.getVideoTracks()[0];
    video.srcObject = flusso;
    try { await video.play(); } catch (e) { /* su iPhone parte comunque */ }

    inScansione = true;
    await preparaZoom();
    aggiornaElencoCamere();
    aggiornaDiagnosi();
    stato('Inquadra il codice a barre dentro il riquadro…');
    cicloLettura();
  }

  function ferma() {
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

  return { avvia, ferma };
})();
