// Dispensa — Tappa 1: lettura del codice a barre con la fotocamera.
// Per ora l'app legge il codice e lo mostra a schermo. Nessun dato viene salvato online.

const elLettore = document.getElementById('lettore');
const btnScansiona = document.getElementById('btn-scansiona');
const btnStop = document.getElementById('btn-stop');
const elMessaggio = document.getElementById('messaggio');
const elRisultato = document.getElementById('risultato');
const elCodice = document.getElementById('codice');
const elStorico = document.getElementById('storico-letture');

// Solo i formati dei prodotti al supermercato: rende la lettura più veloce e affidabile.
const FORMATI = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

const lettore = new Html5Qrcode('lettore', {
  formatsToSupport: FORMATI,
  useBarCodeDetectorIfSupported: true,
  verbose: false,
});

let inScansione = false;

function mostraMessaggio(testo, errore = false) {
  elMessaggio.textContent = testo;
  elMessaggio.classList.toggle('errore', errore);
}

async function avviaScansione() {
  elRisultato.hidden = true;
  elLettore.hidden = false;
  btnScansiona.hidden = true;
  btnStop.hidden = false;
  mostraMessaggio('Inquadra il codice a barre…');

  try {
    await lettore.start(
      { facingMode: 'environment' }, // fotocamera posteriore
      {
        fps: 10,
        // Riquadro di lettura largo e basso, adatto ai codici a barre
        qrbox: (larghezza, altezza) => ({
          width: Math.floor(larghezza * 0.85),
          height: Math.floor(Math.min(altezza, larghezza) * 0.45),
        }),
      },
      codiceLetto,
      () => {} // nessun codice in questo fotogramma: si continua a cercare
    );
    inScansione = true;
  } catch (err) {
    fermaInterfaccia();
    mostraMessaggio(
      'Non riesco ad aprire la fotocamera. Controlla di aver dato il permesso (vedi istruzioni). Dettaglio: ' + err,
      true
    );
  }
}

async function fermaScansione() {
  if (inScansione) {
    try { await lettore.stop(); } catch (e) { /* già fermo */ }
    inScansione = false;
  }
  fermaInterfaccia();
}

function fermaInterfaccia() {
  elLettore.hidden = true;
  btnScansiona.hidden = false;
  btnStop.hidden = true;
}

async function codiceLetto(codice) {
  if (!inScansione) return; // evita letture doppie
  await fermaScansione();
  if (navigator.vibrate) navigator.vibrate(100);

  elCodice.textContent = codice;
  elRisultato.hidden = false;
  mostraMessaggio('Letto! ✅');
  aggiungiAlloStorico(codice);
}

function aggiungiAlloStorico(codice) {
  const li = document.createElement('li');
  const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  li.textContent = codice;
  const span = document.createElement('span');
  span.textContent = ora;
  li.appendChild(span);
  elStorico.prepend(li);
  while (elStorico.children.length > 5) elStorico.lastChild.remove();
}

btnScansiona.addEventListener('click', avviaScansione);
btnStop.addEventListener('click', async () => {
  await fermaScansione();
  mostraMessaggio('');
});
