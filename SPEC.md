# SPEC.md — Specifica dell'app "Dispensa"

Ultimo aggiornamento: 2026-11-27

## Scopo
Tenere traccia di cosa c'è in dispensa e quando scade. Due utenti (coppia) vedono e modificano la stessa lista da iPhone.
Deve essere **veloce e semplice**: poche informazioni, pochi tocchi.

## Funzioni

### IN — aggiungere un prodotto
1. Tocco "+ Aggiungi" → si apre la fotocamera → inquadro il codice a barre.
2. L'app cerca il nome, e lo chiede **solo** se non lo trova (richiesta dell'utente):
   - prima nella memoria dei nomi (foglio `Prodotti`: i prodotti già inseriti, con eventuali correzioni fatte a mano nel foglio) — ha la precedenza;
   - poi su **Open Food Facts** (le due ricerche partono insieme). Nome composto da: nome italiano del prodotto (o quello generico) + marca, se non già contenuta nel nome; massimo 60 caratteri. Esempio: "Spaghetti n°5 Barilla".
   - se trovato, il nome compare già scritto con la fonte ("✓ Nome ricordato…" / "✓ Nome trovato su Open Food Facts…") e si può modificare; il nome salvato (eventualmente corretto) finisce in `Prodotti` e la volta dopo viene da lì.
   - se non trovato: "Prodotto nuovo: scrivi il nome…". Se Open Food Facts non risponde entro 6 secondi o non è raggiungibile, lo dice e si scrive il nome a mano.
3. Scelgo la data di scadenza con il pulsante **"📅 Scegli la data"** (unico modo, scelta dell'utente per semplicità): si apre una finestra dal basso con tre passaggi da un tocco ciascuno — **giorno** (1–31) → **mese** (gen–dic) → **anno** (anno corrente + 10). Le combinazioni impossibili (31 aprile, 29 febbraio negli anni non bisestili) e le date già passate sono disattivate. Freccia ← per tornare al passo precedente, ✕ o tocco sullo sfondo per chiudere.
   Sotto il pulsante compare la data in chiaro (es. "ven 4 dicembre 2026 · tra 7 giorni").
4. Scelgo quanti pezzi con − / + (da 1 a 20, predefinito 1).
5. Salvo → viene creata **una riga per ogni pezzo**, con la data di entrata (oggi). L'app torna alla schermata iniziale con la conferma e un elenco "Aggiunti adesso".

### Codice scritto a mano (per codici a barre rovinati)
- Nella schermata della fotocamera (sia per Aggiungi sia per Togli) c'è il pulsante **"⌨️ Scrivi il codice a mano"**: spegne la fotocamera e mostra un campo con il tastierino numerico + "Conferma". Poi si prosegue come se il codice fosse stato inquadrato.
- Controlli: il codice deve avere 13 cifre (o 8 o 12); spazi e trattini vengono ignorati. Se la cifra di controllo (l'ultima) non torna, l'app avvisa di un probabile errore di battitura; toccando di nuovo "Conferma" con lo stesso codice lo accetta comunque.

### OUT — togliere un prodotto
Pensato per chi non consuma sempre per primo il pezzo che scade prima (richiesta dell'utente):
1. Tocco "− Togli" → si apre un riquadro dal basso con due scelte: **📷 Inquadra il codice** oppure **📋 Scegli dalla lista** (utile se il codice a barre è rovinato o perso).
   - Inquadra (o scrivi il codice a mano): se il codice non è in dispensa → messaggio "Non trovato in dispensa", nessuna modifica.
   - Scegli dalla lista: elenco dei prodotti in ordine alfabetico, con numero di pezzi e prima scadenza, colorati come nella lista.
2. Riquadro **"Quale scadenza togli?"**: una riga per ogni data di scadenza di quel prodotto, con il numero di pezzi (e "tra x giorni" se in scadenza), colorata come nella lista. Si tocca la data da togliere. Il riquadro compare sempre, anche se c'è una sola data.
3. Viene tolto **un pezzo** con quella scadenza (se ce ne sono più, quello entrato per primo) e **spostato nel foglio `Storico`** con la data di uscita.
4. Conferma "✅ Tolto: Nome (scadeva il …)" con il pulsante **↩︎ Annulla**, che rimette il pezzo in dispensa (e lo toglie dallo Storico). Il pulsante resta finché non si fa un'altra operazione.
5. Se nel frattempo il pezzo era già stato tolto dall'altro telefono: messaggio e lista aggiornata.
Nei riquadri: ← torna al passo precedente, ✕ o tocco sullo sfondo chiude.

### LISTA
- Sta nella schermata principale. I pulsanti "+ Aggiungi" e "− Togli" sono in una **barra fissa in basso** (a portata di pollice, richiesta dell'utente), sempre visibile anche scorrendo; sopra i pulsanti, nella barra, compaiono i messaggi di conferma e il pulsante "Annulla". Titolo con il totale dei pezzi ("In dispensa · 10 pezzi").
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
- Pulsante "Salva e prova collegamento": risponde "✅ Collegamento OK" con il numero di pezzi in dispensa e la versione dello script Google, oppure spiega l'errore.
- In fondo: **Opzioni fotocamera** (scelta della fotocamera, riga "Info" di diagnosi) e il numero di **Versione** dell'app. Spostati qui dalla schermata principale nella versione 15 (richiesta dell'utente di toglierli dalla vista di tutti i giorni).

### App sulla schermata Home
- Icona: barattolo bianco su sfondo verde (`icone/`), nome "Dispensa", apertura a tutto schermo (senza barra del browser), barra di stato trasparente sopra l'intestazione verde. Definiti in `manifest.json` e nei `<meta>` di `index.html`.
- L'app aperta dall'icona ha una memoria separata dal browser: indirizzo e chiave vanno reinseriti lì una volta.
- Istruzioni per l'utente: `ISTRUZIONI-IPHONE.md` (da girare anche alla compagna).

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
  - `rimuovi` (codice, oppure id) → sposta in `Storico` il pezzo con quell'id (con il codice: quello con la scadenza più vicina)
  - `ripristina` (id) → "Annulla": riporta il pezzo dallo `Storico` alla `Dispensa` (dalla versione 2 dello script)
  - `nome` (codice) → nome ricordato in `Prodotti`
- Versione attuale dello script: **2** (la 2 ha aggiunto `ripristina`). Lo script restituisce la sua versione con `ping`.
- Date salvate come date vere (formato gg/mm/aaaa nel foglio); accetta anche date scritte a mano come testo "31/12/2026".

## Open Food Facts
- Indirizzo: `https://world.openfoodfacts.org/api/v2/product/<codice>.json?fields=product_name_it,product_name,generic_name_it,generic_name,brands`. Gratuito, senza account né chiave.
- Risposta: `status: 1` e `product` se trovato; 404 / `status: 0` se non presente.
- La chiamata parte dal telefono (non dallo script Google). Si invia solo il codice a barre.
- L'ambiente cloud di Claude Code non raggiunge il sito: le prove sono fatte con risposte simulate, la verifica vera è sul telefono.

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

## Dove siamo (per riprendere)
- Ultima versione pubblicata: **15**. Script Google: **versione 2** (installata dall'utente).
- Tappe 0–6 completate e provate sull'iPhone; tappa 7 pubblicata, da provare.
- Prossimo passo: dopo la prova della tappa 7, **tappa 8 (email di avviso delle scadenze)**.

## Tappe
| # | Tappa | Stato |
|---|---|---|
| 0 | Preparazione: repository, CLAUDE.md, SPEC.md, GitHub Pages | fatto |
| 1 | Pagina con fotocamera che legge il codice a barre | fatto |
| 2 | Google Sheet + Apps Script + schermata Impostazioni | fatto |
| 3 | IN | fatto |
| 4 | LISTA | fatto |
| 5 | OUT | fatto |
| 6 | Nome da Open Food Facts + memoria nomi (+ codice scritto a mano) | fatto |
| 7 | Rifiniture: icona, schermata Home, "Versione N" e "Opzioni fotocamera" spostati in Impostazioni | da provare su iPhone |
| 8 | Avvisi email di scadenza | più avanti |

## Note tecniche
- Lettura codici a barre: libreria **zxing-wasm** 3.1.6 (licenza MIT), salvata in `lib/` (file `.js` + motore `.wasm`). Formati letti: EAN-13, EAN-8, UPC-A, UPC-E (i codici dei prodotti al supermercato).
  - Prima prova con html5-qrcode: scartata perché rimpicciolisce l'immagine e non legge i codici piccoli (sull'iPhone bisogna tenere il prodotto lontano per metterlo a fuoco).
  - La fotocamera è richiesta ad alta risoluzione (1920×1080) e si legge solo la parte dentro il mirino, a piena risoluzione.
  - Zoom 1× / 1,5× / 2× / 3× se il telefono lo permette (predefinito 1,5×, provato sull'iPhone: il migliore): si tiene il prodotto lontano (a fuoco) e lo zoom lo ingrandisce.
  - In "Opzioni fotocamera" si può scegliere quale fotocamera usare; zoom e fotocamera scelti restano memorizzati nel telefono.
- File dell'app: `index.html` (pagina), `style.css` (grafica), `scanner.js` (fotocamera), `date.js` (calcoli e riconoscimento delle date), `selettore-data.js` (finestra giorno → mese → anno), `impostazioni.js` (collegamento al foglio e Impostazioni), `lista.js` (lista dei prodotti), `finestra.js` (riquadro di scelta usato da OUT), `openfoodfacts.js` (nomi da Open Food Facts), `app.js` (schermate e operazioni).
- Niente espressioni regolari con "lookbehind" `(?<…)`: non funzionano su iOS più vecchi di 16.4.
- Sito: https://federicoamt.github.io/dispensa/
- Da ricordare per la tappa 7: su iPhone l'app aggiunta alla schermata Home ha una memoria separata dal browser, quindi URL e chiave andranno reinseriti lì.
