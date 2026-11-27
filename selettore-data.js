// Dispensa — selettore della data in tre tocchi: giorno → mese → anno.
// Uso: SelettoreData.apri(dataScelta => { ... })   (dataScelta è "AAAA-MM-GG")

const SelettoreData = (() => {
  const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
    'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const ANNI_AVANTI = 10;

  const sfondo = document.getElementById('selettore-data');
  const elTitolo = document.getElementById('sd-titolo');
  const elRiepilogo = document.getElementById('sd-riepilogo');
  const elGriglia = document.getElementById('sd-griglia');
  const btnIndietro = document.getElementById('sd-indietro');
  const btnChiudi = document.getElementById('sd-chiudi');

  let passo = 'giorno';
  let scelta = { giorno: 0, mese: 0, anno: 0 };
  let quandoScelta = null;

  const due = (n) => String(n).padStart(2, '0');
  const bisestile = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
  const giorniNelMese = (mese, anno) => (mese === 2 ? (bisestile(anno) ? 29 : 28) : [4, 6, 9, 11].includes(mese) ? 30 : 31);
  const inTesto = (a, m, g) => a + '-' + due(m) + '-' + due(g);

  /** La data esiste e non è già passata? */
  function valida(g, m, a) {
    return g <= giorniNelMese(m, a) && inTesto(a, m, g) >= Data.oggi();
  }

  function apri(callback) {
    quandoScelta = callback;
    scelta = { giorno: 0, mese: 0, anno: 0 };
    vaiA('giorno');
    sfondo.hidden = false;
    document.body.classList.add('bloccato');
  }

  function chiudi() {
    sfondo.hidden = true;
    document.body.classList.remove('bloccato');
  }

  function vaiA(nuovoPasso) {
    passo = nuovoPasso;
    btnIndietro.hidden = passo === 'giorno';
    aggiornaRiepilogo();
    elGriglia.innerHTML = '';
    elGriglia.className = 'sd-griglia sd-' + passo;
    const annoCorrente = new Date().getFullYear();

    if (passo === 'giorno') {
      elTitolo.textContent = 'Giorno';
      for (let g = 1; g <= 31; g++) aggiungiPulsante(String(g), true, () => { scelta.giorno = g; vaiA('mese'); });
    } else if (passo === 'mese') {
      elTitolo.textContent = 'Mese';
      MESI.forEach((nome, i) => {
        const m = i + 1;
        // Il mese va bene se almeno uno degli anni proposti dà una data valida
        let possibile = false;
        for (let a = annoCorrente; a <= annoCorrente + ANNI_AVANTI; a++) {
          if (valida(scelta.giorno, m, a)) { possibile = true; break; }
        }
        aggiungiPulsante(nome, possibile, () => { scelta.mese = m; vaiA('anno'); });
      });
    } else {
      elTitolo.textContent = 'Anno';
      for (let a = annoCorrente; a <= annoCorrente + ANNI_AVANTI; a++) {
        aggiungiPulsante(String(a), valida(scelta.giorno, scelta.mese, a), () => {
          scelta.anno = a;
          const data = inTesto(a, scelta.mese, scelta.giorno);
          chiudi();
          if (quandoScelta) quandoScelta(data);
        });
      }
    }
  }

  function aggiungiPulsante(testo, attivo, azione) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = testo;
    b.disabled = !attivo;
    b.addEventListener('click', azione);
    elGriglia.appendChild(b);
  }

  function aggiornaRiepilogo() {
    const g = scelta.giorno ? String(scelta.giorno) : '__';
    const m = scelta.mese ? MESI_LUNGHI[scelta.mese - 1] : '______';
    elRiepilogo.textContent = g + ' ' + m + ' ____';
  }

  btnIndietro.addEventListener('click', () => {
    if (passo === 'anno') { scelta.mese = 0; vaiA('mese'); }
    else if (passo === 'mese') { scelta.giorno = 0; vaiA('giorno'); }
  });
  btnChiudi.addEventListener('click', chiudi);
  // Tocco sullo sfondo scuro (fuori dal riquadro) = chiudi
  sfondo.addEventListener('click', (e) => { if (e.target === sfondo) chiudi(); });

  return { apri, chiudi };
})();
