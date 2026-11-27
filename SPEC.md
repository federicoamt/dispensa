# SPEC.md — Specifica dell'app "Dispensa"

Ultimo aggiornamento: 2026-11-27

## Scopo
Tenere traccia di cosa c'è in dispensa e quando scade. Due utenti (coppia) vedono e modificano la stessa lista da iPhone.
Deve essere **veloce e semplice**: poche informazioni, pochi tocchi.

## Funzioni

### IN — aggiungere un prodotto
1. Tocco "➕ Aggiungi prodotto" → si apre la fotocamera → inquadro il codice a barre.
2. L'app cerca il nome: prima nella memoria dei nomi (foglio `Prodotti`), poi (tappa 6) su Open Food Facts. Se non lo trova, chiede di scriverlo e lo salva in `Prodotti` per le volte successive. Il nome proposto si può sempre modificare (il nuovo nome viene ricordato).
3. Scelgo la data di scadenza in uno di tre modi:
   - scorciatoie: +3 giorni, +1 sett., +2 sett., +1 mese, +3 mesi, +6 mesi, +1 anno, +2 anni;
   - calendario (selettore di data dell'iPhone);
   - campo di testo dove scrivere o "scansionare" (funzione Scansiona testo di iOS) la data stampata. Riconosce ad esempio `12/03/2027`, `12.03.27`, `120327`, `12 MAR 2027`, frasi intere tipo "da consumarsi entro il 12/03/27", `03/2027` o `MAR 2027` (= ultimo giorno del mese), `12/12` (= il prossimo 12 dicembre).
   Sotto compare la data in chiaro (es. "ven 4 dicembre 2026 · tra 7 giorni"); se è già passata è in rosso (si può comunque salvare).
4. Scelgo quanti pezzi con − / + (da 1 a 20, predefinito 1).
5. Salvo → viene creata **una riga per ogni pezzo**, con la data di entrata (oggi). L'app torna alla schermata iniziale con la conferma e un elenco "Aggiunti adesso".

### OUT — togliere un prodotto
1. Tocco "OUT" → inquadro il codice a barre.
2. Se ci sono più pezzi con quel codice, viene tolto quello con la **scadenza più vicina**.
3. La riga viene **spostata nel foglio `Storico`** con la data di uscita.
4. Se il codice non è in dispensa: messaggio "Non trovato in dispensa", nessuna modifica.

### LISTA
- Mostra i prodotti presenti, ordinati per scadenza (prima quelli che scadono prima).
- Colori:
  - **Rosso**: scaduto
  - **Arancione**: scade entro 3 giorni
  - **Giallo**: scade entro 7 giorni
  - Normale: oltre 7 giorni
- Pezzi uguali con la stessa scadenza possono essere mostrati raggruppati (es. "Yogurt ×3").

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

## Tappe
| # | Tappa | Stato |
|---|---|---|
| 0 | Preparazione: repository, CLAUDE.md, SPEC.md, GitHub Pages | fatto |
| 1 | Pagina con fotocamera che legge il codice a barre | fatto |
| 2 | Google Sheet + Apps Script + schermata Impostazioni | fatto |
| 3 | IN | da provare su iPhone |
| 4 | LISTA | da fare |
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
- File dell'app: `index.html` (pagina), `style.css` (grafica), `scanner.js` (fotocamera), `date.js` (calcoli e riconoscimento delle date), `impostazioni.js` (collegamento al foglio e Impostazioni), `app.js` (schermate e operazioni).
- Niente espressioni regolari con "lookbehind" `(?<…)`: non funzionano su iOS più vecchi di 16.4.
- Sito: https://federicoamt.github.io/dispensa/
- Da ricordare per la tappa 7: su iPhone l'app aggiunta alla schermata Home ha una memoria separata dal browser, quindi URL e chiave andranno reinseriti lì.
