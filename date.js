// Dispensa — calcoli sulle date.
// Le date viaggiano tra app e foglio come testo "AAAA-MM-GG" (es. "2026-12-31").

const Data = (() => {
  const MESI = {
    GEN: 1, JAN: 1, FEB: 2, MAR: 3, APR: 4, MAG: 5, MAY: 5, GIU: 6, JUN: 6,
    LUG: 7, JUL: 7, AGO: 8, AUG: 8, SET: 9, SEP: 9, OTT: 10, OCT: 10, NOV: 11, DIC: 12, DEC: 12,
  };
  const NOMI_MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
    'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const NOMI_GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

  const due = (n) => String(n).padStart(2, '0');

  /** Data (ora locale) → "AAAA-MM-GG" */
  function inTesto(d) {
    return d.getFullYear() + '-' + due(d.getMonth() + 1) + '-' + due(d.getDate());
  }

  /** "AAAA-MM-GG" → Data a mezzogiorno (ora locale), o null */
  function daTesto(t) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t || '');
    if (!m) return null;
    return creaValida(+m[1], +m[2], +m[3]);
  }

  /** Crea la data solo se esiste davvero (niente 31 febbraio) */
  function creaValida(anno, mese, giorno) {
    if (mese < 1 || mese > 12 || giorno < 1) return null;
    const d = new Date(anno, mese - 1, giorno, 12);
    return d.getMonth() === mese - 1 && d.getDate() === giorno ? d : null;
  }

  function ultimoGiorno(anno, mese) {
    return new Date(anno, mese, 0, 12).getDate();
  }

  function oggi(adesso = new Date()) {
    return inTesto(adesso);
  }

  /** Aggiunge giorni o mesi a oggi. Con i mesi, il 31 gennaio + 1 mese = 28/29 febbraio. */
  function aggiungi({ giorni = 0, mesi = 0 }, adesso = new Date()) {
    const base = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate(), 12);
    if (mesi) {
      const giorno = base.getDate();
      base.setDate(1);
      base.setMonth(base.getMonth() + mesi);
      base.setDate(Math.min(giorno, ultimoGiorno(base.getFullYear(), base.getMonth() + 1)));
    }
    base.setDate(base.getDate() + giorni);
    return inTesto(base);
  }

  /** Giorni da oggi alla data (negativo se già passata) */
  function giorniMancanti(testo, adesso = new Date()) {
    const d = daTesto(testo);
    if (!d) return null;
    const o = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate(), 12);
    return Math.round((d - o) / 86400000);
  }

  /** "2026-12-04" → "mer 4 dicembre 2026" */
  function leggibile(testo) {
    const d = daTesto(testo);
    if (!d) return '';
    return NOMI_GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + NOMI_MESI[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** "2026-12-04" → "04/12/2026" */
  function breve(testo) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(testo || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  /** "tra 7 giorni", "domani", "scade oggi", "scaduto da 2 giorni" */
  function distanza(testo, adesso = new Date()) {
    const g = giorniMancanti(testo, adesso);
    if (g === null) return '';
    if (g === 0) return 'scade oggi';
    if (g === 1) return 'domani';
    if (g === -1) return 'scaduto ieri';
    if (g < 0) return 'scaduto da ' + -g + ' giorni';
    return 'tra ' + g + ' giorni';
  }

  function annoCompleto(a) {
    a = +a;
    return a < 100 ? 2000 + a : a;
  }

  /**
   * Cerca una data dentro un testo scritto o "scansionato" dalla confezione.
   * Esempi accettati: "12/03/2027", "12.03.27", "12-3-27", "120327", "12 MAR 2027",
   * "da consumarsi entro il 12/03/27", "03/2027" o "MAR 2027" (→ ultimo giorno del mese),
   * "12/12" (giorno/mese: il prossimo 12 dicembre).
   * Restituisce "AAAA-MM-GG" oppure '' se non trova una data valida.
   */
  function interpreta(testoOriginale, adesso = new Date()) {
    const t = String(testoOriginale || '').toUpperCase();
    let m;

    // giorno mese(lettere) anno: 12 MAR 2027, 12MAR27
    m = /(\d{1,2})\s*[./-]?\s*([A-Z]{3})[A-Z]*\.?\s*[./-]?\s*(\d{4}|\d{2})(?!\d)/.exec(t);
    if (m && MESI[m[2]]) {
      const d = creaValida(annoCompleto(m[3]), MESI[m[2]], +m[1]);
      if (d) return inTesto(d);
    }
    // mese(lettere) anno: MAR 2027
    m = /\b([A-Z]{3})[A-Z]*\.?\s*[./-]?\s*(\d{4}|\d{2})(?!\d)/.exec(t);
    if (m && MESI[m[1]]) {
      const anno = annoCompleto(m[2]);
      const mese = MESI[m[1]];
      return inTesto(creaValida(anno, mese, ultimoGiorno(anno, mese)));
    }
    // giorno mese anno con separatori: 12/03/2027, 12.03.27, 12 03 27
    m = /(?:^|\D)(\d{1,2})\s*[./\- ]\s*(\d{1,2})\s*[./\- ]\s*(\d{4}|\d{2})(?!\d)/.exec(t);
    if (m) {
      const d = creaValida(annoCompleto(m[3]), +m[2], +m[1]);
      if (d) return inTesto(d);
    }
    // tutto attaccato: 12032027 o 120327
    m = /(?:^|\D)(\d{2})(\d{2})(\d{4}|\d{2})(?!\d)/.exec(t);
    if (m) {
      const d = creaValida(annoCompleto(m[3]), +m[2], +m[1]);
      if (d) return inTesto(d);
    }
    // due numeri: mese/anno (03/2027, 03/27) oppure giorno/mese (12/12)
    m = /(?:^|\D)(\d{1,2})\s*[./\- ]\s*(\d{4}|\d{1,2})(?!\d)/.exec(t);
    if (m) {
      const a = +m[1], b = m[2];
      if (b.length === 4 && a >= 1 && a <= 12) {
        return inTesto(creaValida(+b, a, ultimoGiorno(+b, a)));
      }
      const o = oggi(adesso);
      // mese/anno, se non è già passato (es. 03/27 = marzo 2027)
      if (a >= 1 && a <= 12) {
        const anno = annoCompleto(b);
        const fineMese = inTesto(creaValida(anno, a, ultimoGiorno(anno, a)));
        if (fineMese >= o) return fineMese;
      }
      // giorno/mese: il prossimo che arriva (es. 12/12)
      const mese = +b;
      for (const anno of [adesso.getFullYear(), adesso.getFullYear() + 1]) {
        const d = creaValida(anno, mese, a);
        if (d && inTesto(d) >= o) return inTesto(d);
      }
    }
    return '';
  }

  return { oggi, aggiungi, giorniMancanti, leggibile, breve, distanza, interpreta, daTesto };
})();
