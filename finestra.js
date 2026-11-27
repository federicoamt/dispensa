// Dispensa — riquadro che sale dal basso con un elenco di scelte (usato da OUT).
// Uso: Finestra.apri({ titolo, sottotitolo, voci: [{ testo, dettaglio, classe, grande, azione }], indietro })

const Finestra = (() => {
  const sfondo = document.getElementById('finestra');
  const elTitolo = document.getElementById('fi-titolo');
  const elSottotitolo = document.getElementById('fi-sottotitolo');
  const elVoci = document.getElementById('fi-voci');
  const btnIndietro = document.getElementById('fi-indietro');
  const btnChiudi = document.getElementById('fi-chiudi');

  let azioneIndietro = null;

  function apri({ titolo, sottotitolo = '', voci = [], indietro = null }) {
    elTitolo.textContent = titolo;
    elSottotitolo.textContent = sottotitolo;
    elSottotitolo.hidden = !sottotitolo;
    azioneIndietro = indietro;
    btnIndietro.hidden = !indietro;

    elVoci.innerHTML = '';
    for (const voce of voci) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fi-voce' + (voce.grande ? ' grande-voce' : '') + (voce.classe ? ' ' + voce.classe : '');
      const testo = document.createElement('span');
      testo.className = 'fi-testo';
      testo.textContent = voce.testo;
      b.appendChild(testo);
      if (voce.dettaglio) {
        const dettaglio = document.createElement('span');
        dettaglio.className = 'fi-dettaglio';
        dettaglio.textContent = voce.dettaglio;
        b.appendChild(dettaglio);
      }
      b.addEventListener('click', voce.azione);
      elVoci.appendChild(b);
    }
    elVoci.scrollTop = 0;
    sfondo.hidden = false;
    document.body.classList.add('bloccato');
  }

  function chiudi() {
    sfondo.hidden = true;
    document.body.classList.remove('bloccato');
  }

  btnIndietro.addEventListener('click', () => { if (azioneIndietro) azioneIndietro(); });
  btnChiudi.addEventListener('click', chiudi);
  sfondo.addEventListener('click', (e) => { if (e.target === sfondo) chiudi(); });

  return { apri, chiudi };
})();
