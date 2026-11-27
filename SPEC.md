# SPEC.md — Specifica dell'app "Dispensa"

Ultimo aggiornamento: 2026-11-27

## Scopo
Tenere traccia di cosa c'è in dispensa e quando scade. Due utenti (coppia) vedono e modificano la stessa lista da iPhone.
Deve essere **veloce e semplice**: poche informazioni, pochi tocchi.

## Funzioni

### IN — aggiungere un prodotto
1. Tocco "➕ Aggiungi prodotto" → si apre la fotocamera → inquadro il codice a barre.
2. L'app cerca il nome: prima nella memoria dei nomi (foglio `Prodotti`), poi (tappa 6) su Open Food Facts. Richiesta dell'utente: il nome va chiesto **solo** se il prodotto non si trova in nessuna delle due liste. Se non lo trova, chiede di scriverlo e lo salva in `Prodotti` per le volte successive. Il nome proposto si può sempre modificare (il nuovo nome viene ricordato).
3. Scelgo la data di scadenza con il pulsante **"📅 Scegli la data"** (unico modo, scelta dell'utente per semplicità): si apre una finestra dal basso con tre passaggi da un tocco ciascuno — **giorno** (1–31) → **mese** (gen–dic) → **anno** (anno corrente + 10). Le combinazioni impossibili (31 aprile, 29 febbraio negli anni non bisestili) e le date già passate sono disattivate. Freccia ← per tornare al passo precedente, ✕ o tocco sullo sfondo per chiudere.
   Sotto il pulsante compare la data in chiaro (es. "ven 4 dicembre 2026 · tra 7 giorni").
4. Scelgo quanti pezzi con − / + (da 1 a 20, predefinito 1).
5. Salvo → viene creata **una riga per ogni pezzo**, con la data di entrata (oggi). L'app torna alla schermata iniziale con la conferma e un elenco "Aggiunti adesso".

### OUT — togliere un prodotto
1. Tocco "OUT" → inquadro il codice a barre.
2. Se ci sono più pezzi con quel codice, viene tolto quello con la **scadenza più vicina**.
3. La riga viene **spostata nel foglio `Storico`** con la data di uscita.
4. Se il codice non è in dispensa: messaggio "Non trovato in dispensa", nessuna modifica.

### LISTA
- Sta nella schermata principale, sotto "➕ Aggiungi prodotto". Titolo con il totale dei pezzi ("In dispensa · 10 pezzi").
- Prodotti presenti ordinati per scadenza (prima quelli che scadono prima; quelli senza data in fondo).
- Pezzi uguali (stesso codice, nome e scadenza) raggruppati in una riga con "×N".
- Ogni riga: nome e data (gg/mm/aaaa). Solo le righe colorate (scadute o in scadenza entro 7 giorni) mostrano anche la distanza ("tra 5 giorni", "domani", "scade oggi", "scaduto da 2 giorni"): richiesta dell'utente, per non affollare la lista.
- Colori (sfondo e bordo):
  - **Rosso**: scaduto
  - **Arancione**: scade oggi o entro 3 giorni
  - **Giallo**: scade tra 4 e 7 giorni
  - Normale: oltre 7 giorni
- Riepilogo sopra la lista: "🔴 1 scaduto  🟠 4 entro 3 giorni  🟡 1 entro 7 giorni" (solo le voci presenti).
- Aggiornamento: all'apertura dell'app, quando si torna sull'app dopo averla lasciata in background (per vedere le modifiche dell'altro telefono), dopo ogni salvataggio, e con il pulsante "↻ Aggiorna".
- L'ultima lista ricevuta resta in memoria nel telefono e compare subito all'apertura, mentre arriva quella aggiornata. Senza connessione resta visibile con un messaggio d'errore.

### Impostazioni
- Si aprono con ⚙️ in alto a destra (o toccando l'avviso giallo "Google Sheet non collegato").
- Campi: indirizzo (URL) dello script Google e chiave segreta.
- Salvati solo nel browser del telefono (non nel codice). Vanno inseriti una volta per ogni telefono/browser.
- Pulsante "Salva e prova collegamento": risponde "✅ Collegamento OK" con il numero di pezzi in dispensa, oppure spiega l'errore.

## Dati (Google Sheet)
| Foglio | Colonne |
|---|---|
| `Dispensa` | ID, CodiceBarre, Nome, Scadenza, DataEntrata |
| `Storico` | ID, CodiceBarre, Nome, Scadenza, DataEntrata, DataUscita |
| `Prodotti` | CodiceBarre, Nome |

Il foglio si può aprire e modificare anche a mano.

## Script Google (`apps-script/Codice.gs`)
- Istruzioni per installarlo e aggiornarlo: `apps-script/ISTRUZIONI.md`.
- La funzione `configura` (eseguita a mano una volta) crea i fogli e genera la chiave segreta, salvata nelle proprietà dello script (non nel codice). `cambiaChiave` ne crea una nuova.
- Pubblicato come App web: "Esegui come: Me", "Chi ha accesso: Chiunque". Permessi limitati al solo foglio (`@OnlyCurrentDoc`).
- L'app manda richieste POST (corpo JSON in `text/plain`) con `chiave` e `azione`:
  - `ping` → versione dello script e numero di pezzi
  - `lista` → prodotti in dispensa ordinati per scadenza
  - `aggiungi` (codice, nome, scadenza `AAAA-MM-GG`, pezzi) → una riga per pezzo; ricorda il nome in `Prodotti`
  - `rimuovi` (codice, oppure id) → sposta in `Storico` il pezzo con la scadenza più vicina
  - `nome` (codice) → nome ricordato in `Prodotti`
- Lo script è già completo per le tappe 3–6, così l'utente lo incolla una volta sola.
- Date salvate come date vere (formato gg/mm/aaaa nel foglio); accetta anche date scritte a mano come testo "31/12/2026".

## Sicurezza
- Lo script Google (Web App) accetta richieste solo con la chiave segreta corretta, sia per leggere sia per scrivere.
- Nessun dato personale nel repository pubblico.

## Fuori dallo scopo (per ora)
- Luogo (dispensa/frigo/freezer): deciso di **no**.
- Prodotti senza codice a barre: **non gestiti** per ora.
- Avvisi email di scadenza: **più avanti** (ultima tappa).
- Lettura automatica della data di scadenza dalla foto: possibile miglioramento futuro.
- Altri modi di inserire la scadenza, provati nella versione 6–7 e tolti nella versione 8 per semplicità (si possono riattivare):
  - scorciatoie (+3 giorni, +1 sett., +2 sett., +1 mese, +3 mesi, +6 mesi, +1 anno, +2 anni);
  - campo di testo per scrivere o "scansionare" (Scansiona testo di iOS) la data stampata. Il riconoscimento è già pronto e collaudato in `date.js` (funzione `Data.interpreta`).

## Tappe
| # | Tappa | Stato |
|---|---|---|
| 0 | Preparazione: repository, CLAUDE.md, SPEC.md, GitHub Pages | fatto |
| 1 | Pagina con fotocamera che legge il codice a barre | fatto |
| 2 | Google Sheet + Apps Script + schermata Impostazioni | fatto |
| 3 | IN | fatto |
| 4 | LISTA | da provare su iPhone |
| 5 | OUT | da fare |
| 6 | Nome da Open Food Facts + memoria nomi | da fare |
| 7 | Rifiniture: icona, schermata Home | da fare |
| 8 | Avvisi email di scadenza | più avanti |

## Note tecniche
- Lettura codici a barre: libreria **zxing-wasm** 3.1.6 (licenza MIT), salvata in `lib/` (file `.js` + motore `.wasm`). Formati letti: EAN-13, EAN-8, UPC-A, UPC-E (i codici dei prodotti al supermercato).
  - Prima prova con html5-qrcode: scartata perché rimpicciolisce l'immagine e non legge i codici piccoli (sull'iPhone bisogna tenere il prodotto lontano per metterlo a fuoco).
  - La fotocamera è richiesta ad alta risoluzione (1920×1080) e si legge solo la parte dentro il mirino, a piena risoluzione.
  - Zoom 1× / 1,5× / 2× / 3× se il telefono lo permette (predefinito 1,5×, provato sull'iPhone: il migliore): si tiene il prodotto lontano (a fuoco) e lo zoom lo ingrandisce.
  - In "Opzioni fotocamera" si può scegliere quale fotocamera usare; zoom e fotocamera scelti restano memorizzati nel telefono.
- File dell'app: `index.html` (pagina), `style.css` (grafica), `scanner.js` (fotocamera), `date.js` (calcoli e riconoscimento delle date), `selettore-data.js` (finestra giorno → mese → anno), `impostazioni.js` (collegamento al foglio e Impostazioni), `lista.js` (lista dei prodotti), `app.js` (schermate e operazioni).
- Niente espressioni regolari con "lookbehind" `(?<…)`: non funzionano su iOS più vecchi di 16.4.
- Sito: https://federicoamt.github.io/dispensa/
- Da ricordare per la tappa 7: su iPhone l'app aggiunta alla schermata Home ha una memoria separata dal browser, quindi URL e chiave andranno reinseriti lì.
