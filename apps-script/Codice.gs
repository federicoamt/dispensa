/**
 * Dispensa — script da incollare nel Google Sheet (Estensioni → Apps Script).
 *
 * Fa da "ponte" tra l'app sul telefono e il foglio:
 * l'app manda una richiesta, lo script controlla la chiave segreta
 * e poi legge o modifica il foglio.
 *
 * La chiave segreta NON è scritta qui: viene creata dalla funzione "configura"
 * e conservata nelle proprietà dello script (visibili solo al proprietario).
 *
 * Versione script: 2
 *
 * @OnlyCurrentDoc  (chiede a Google il permesso di usare SOLO questo foglio)
 */

var VERSIONE_SCRIPT = 2;

var FOGLI = {
  Dispensa: ['ID', 'CodiceBarre', 'Nome', 'Scadenza', 'DataEntrata'],
  Storico: ['ID', 'CodiceBarre', 'Nome', 'Scadenza', 'DataEntrata', 'DataUscita'],
  Prodotti: ['CodiceBarre', 'Nome'],
};

// ============================================================
// 1) CONFIGURAZIONE — da eseguire UNA volta a mano dall'editor
// ============================================================

/**
 * Crea i fogli con le intestazioni (se mancano) e genera la chiave segreta.
 * La chiave compare nel "Registro di esecuzione" in basso.
 * Si può rieseguire senza problemi: non cancella nulla e non cambia la chiave.
 */
function configura() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(FOGLI).forEach(function (nome) {
    var foglio = ss.getSheetByName(nome) || ss.insertSheet(nome);
    var intestazioni = FOGLI[nome];
    foglio.getRange(1, 1, 1, intestazioni.length).setValues([intestazioni]).setFontWeight('bold');
    foglio.setFrozenRows(1);
    // Codice a barre come testo (altrimenti diventa 8,00E+12 o perde gli zeri iniziali)
    var colCodice = intestazioni.indexOf('CodiceBarre') + 1;
    foglio.getRange(2, colCodice, foglio.getMaxRows() - 1, 1).setNumberFormat('@');
    // Date in formato italiano
    intestazioni.forEach(function (titolo, i) {
      if (titolo.indexOf('Data') === 0 || titolo === 'Scadenza') {
        foglio.getRange(2, i + 1, foglio.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy');
      }
    });
  });
  // Elimina il "Foglio1" vuoto creato da Google, se c'è
  ['Foglio1', 'Sheet1'].forEach(function (nome) {
    var f = ss.getSheetByName(nome);
    if (f && f.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(f);
  });

  var proprieta = PropertiesService.getScriptProperties();
  var chiave = proprieta.getProperty('CHIAVE');
  if (!chiave) {
    chiave = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    proprieta.setProperty('CHIAVE', chiave);
  }
  Logger.log('Configurazione completata.');
  Logger.log('LA TUA CHIAVE SEGRETA (copiala nell\'app): ' + chiave);
}

/**
 * Da usare solo se la chiave è finita in mani sbagliate:
 * ne crea una nuova (poi va reinserita nell'app su ogni telefono).
 */
function cambiaChiave() {
  PropertiesService.getScriptProperties().deleteProperty('CHIAVE');
  configura();
}

// ============================================================
// 2) RICHIESTE DALL'APP
// ============================================================

/** Aprendo l'indirizzo dello script nel browser si vede solo questo messaggio. */
function doGet() {
  return rispondi({ ok: true, messaggio: 'Script Dispensa attivo. I dati sono accessibili solo dall\'app con la chiave.' });
}

/** Tutte le richieste dell'app arrivano qui. */
function doPost(e) {
  var richiesta;
  try {
    richiesta = JSON.parse(e.postData.contents);
  } catch (err) {
    return rispondi({ ok: false, errore: 'richiesta_non_valida' });
  }

  var chiaveGiusta = PropertiesService.getScriptProperties().getProperty('CHIAVE');
  if (!chiaveGiusta) return rispondi({ ok: false, errore: 'non_configurato' });
  if (!richiesta || richiesta.chiave !== chiaveGiusta) {
    Utilities.sleep(1000); // rallenta chi prova a indovinare la chiave
    return rispondi({ ok: false, errore: 'chiave_sbagliata' });
  }

  // Un'operazione alla volta, così due telefoni insieme non si pestano i piedi
  var lucchetto = LockService.getScriptLock();
  try {
    lucchetto.waitLock(15000);
  } catch (err) {
    return rispondi({ ok: false, errore: 'occupato' });
  }
  try {
    var azioni = {
      ping: azionePing,
      lista: azioneLista,
      aggiungi: azioneAggiungi,
      rimuovi: azioneRimuovi,
      ripristina: azioneRipristina,
      nome: azioneNome,
    };
    var azione = azioni[richiesta.azione];
    if (!azione) return rispondi({ ok: false, errore: 'azione_sconosciuta' });
    return rispondi(azione(richiesta));
  } catch (err) {
    return rispondi({ ok: false, errore: 'errore_script', dettaglio: String(err && err.message || err) });
  } finally {
    lucchetto.releaseLock();
  }
}

// ---------- Azioni ----------

function azionePing() {
  return { ok: true, versioneScript: VERSIONE_SCRIPT, pezzi: leggiDispensa().length };
}

function azioneLista() {
  return { ok: true, prodotti: leggiDispensa() };
}

/** Aggiunge "pezzi" righe uguali e ricorda il nome per quel codice a barre. */
function azioneAggiungi(r) {
  var codice = pulisciCodice(r.codice);
  var nome = String(r.nome || '').trim();
  var scadenza = daTestoAData(r.scadenza);
  var pezzi = Math.max(1, Math.min(50, parseInt(r.pezzi, 10) || 1));
  if (!codice) return { ok: false, errore: 'codice_mancante' };
  if (!nome) return { ok: false, errore: 'nome_mancante' };
  if (!scadenza) return { ok: false, errore: 'scadenza_non_valida' };

  var oggi = oggiSenzaOra();
  var righe = [];
  for (var i = 0; i < pezzi; i++) {
    righe.push([nuovoId(), codice, nome, scadenza, oggi]);
  }
  var foglio = foglioDa('Dispensa');
  foglio.getRange(foglio.getLastRow() + 1, 1, righe.length, righe[0].length).setValues(righe);
  ricordaNome(codice, nome);
  return { ok: true, aggiunti: pezzi, prodotti: leggiDispensa() };
}

/**
 * Toglie UN pezzo con quel codice: quello con la scadenza più vicina
 * (a parità di scadenza, quello entrato prima). Lo sposta nello Storico.
 * In alternativa si può indicare direttamente l'ID della riga.
 */
function azioneRimuovi(r) {
  var codice = pulisciCodice(r.codice);
  var id = String(r.id || '');
  var foglio = foglioDa('Dispensa');
  var dati = valoriDati(foglio);

  var scelta = -1;
  for (var i = 0; i < dati.length; i++) {
    var riga = dati[i];
    if (id ? String(riga[0]) !== id : pulisciCodice(riga[1]) !== codice) continue;
    if (scelta === -1 || confrontaPezzi(riga, dati[scelta]) < 0) scelta = i;
  }
  if (scelta === -1) return { ok: false, errore: 'non_trovato' };

  var rimossa = dati[scelta];
  foglioDa('Storico').appendRow(rimossa.slice(0, 5).concat([oggiSenzaOra()]));
  foglio.deleteRow(scelta + 2); // +2: intestazione e conteggio da 1
  return { ok: true, rimosso: rigaInOggetto(rimossa), prodotti: leggiDispensa() };
}

/**
 * "Annulla" dopo un OUT: riporta in Dispensa il pezzo con quell'ID tolto per ultimo
 * (lo cerca nello Storico, partendo dal fondo) e lo cancella dallo Storico.
 */
function azioneRipristina(r) {
  var id = String(r.id || '');
  if (!id) return { ok: false, errore: 'non_trovato' };
  var storico = foglioDa('Storico');
  var dati = valoriDati(storico);
  for (var i = dati.length - 1; i >= 0; i--) {
    if (String(dati[i][0]) !== id) continue;
    var riga = dati[i].slice(0, 5);
    var dispensa = foglioDa('Dispensa');
    dispensa.getRange(dispensa.getLastRow() + 1, 1, 1, 5).setValues([riga]);
    storico.deleteRow(i + 2);
    return { ok: true, ripristinato: rigaInOggetto(riga), prodotti: leggiDispensa() };
  }
  return { ok: false, errore: 'non_trovato' };
}

/** Restituisce il nome ricordato per un codice a barre (o vuoto). */
function azioneNome(r) {
  var codice = pulisciCodice(r.codice);
  var dati = valoriDati(foglioDa('Prodotti'));
  for (var i = 0; i < dati.length; i++) {
    if (pulisciCodice(dati[i][0]) === codice) return { ok: true, nome: String(dati[i][1] || '') };
  }
  return { ok: true, nome: '' };
}

// ---------- Funzioni di aiuto ----------

function rispondi(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(ContentService.MimeType.JSON);
}

function foglioDa(nome) {
  var foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
  if (!foglio) throw new Error('Manca il foglio "' + nome + '": esegui la funzione configura');
  return foglio;
}

/** Tutte le righe sotto l'intestazione, saltando quelle vuote. */
function valoriDati(foglio) {
  var ultima = foglio.getLastRow();
  if (ultima < 2) return [];
  return foglio.getRange(2, 1, ultima - 1, foglio.getLastColumn()).getValues();
}

function leggiDispensa() {
  return valoriDati(foglioDa('Dispensa'))
    .filter(function (riga) { return riga[1] !== '' || riga[2] !== ''; })
    .map(rigaInOggetto)
    .sort(function (a, b) { return (a.scadenza || '9999').localeCompare(b.scadenza || '9999'); });
}

function rigaInOggetto(riga) {
  return {
    id: String(riga[0]),
    codice: pulisciCodice(riga[1]),
    nome: String(riga[2]),
    scadenza: daDataATesto(riga[3]),
    entrata: daDataATesto(riga[4]),
  };
}

/** Negativo se il pezzo "a" va tolto prima di "b". */
function confrontaPezzi(a, b) {
  var sa = daDataATesto(a[3]) || '9999', sb = daDataATesto(b[3]) || '9999';
  if (sa !== sb) return sa < sb ? -1 : 1;
  var ea = daDataATesto(a[4]) || '9999', eb = daDataATesto(b[4]) || '9999';
  return ea < eb ? -1 : ea > eb ? 1 : 0;
}

function ricordaNome(codice, nome) {
  var foglio = foglioDa('Prodotti');
  var dati = valoriDati(foglio);
  for (var i = 0; i < dati.length; i++) {
    if (pulisciCodice(dati[i][0]) === codice) {
      if (String(dati[i][1]) !== nome) foglio.getRange(i + 2, 2).setValue(nome);
      return;
    }
  }
  foglio.appendRow([codice, nome]);
}

function pulisciCodice(valore) {
  return String(valore === undefined || valore === null ? '' : valore).replace(/[^0-9]/g, '');
}

function nuovoId() {
  return Utilities.getUuid().slice(0, 8);
}

function fusoOrario() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

function oggiSenzaOra() {
  return daTestoAData(Utilities.formatDate(new Date(), fusoOrario(), 'yyyy-MM-dd'));
}

/** "2026-12-31" → data. Restituisce null se il testo non è una data valida. */
function daTestoAData(testo) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(testo || ''));
  if (!m) return null;
  // Mezzogiorno: così la data resta la stessa anche se i fusi orari di script e foglio differiscono
  var data = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return isNaN(data.getTime()) ? null : data;
}

/**
 * Valore di una cella → "2026-12-31".
 * Accetta date vere e anche testo scritto a mano tipo "31/12/2026".
 */
function daDataATesto(valore) {
  if (Object.prototype.toString.call(valore) === '[object Date]' && !isNaN(valore.getTime())) {
    return Utilities.formatDate(valore, fusoOrario(), 'yyyy-MM-dd');
  }
  var testo = String(valore || '').trim();
  var it = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(testo);
  if (it) return it[3] + '-' + ('0' + it[2]).slice(-2) + '-' + ('0' + it[1]).slice(-2);
  if (/^\d{4}-\d{2}-\d{2}$/.test(testo)) return testo;
  return '';
}
