# SPEC.md — Specifica dell'app "Dispensa"

Ultimo aggiornamento: 2026-11-23

## Scopo
Tenere traccia di cosa c'è in dispensa e quando scade. Due utenti (coppia) vedono e modificano la stessa lista da iPhone.
Deve essere **veloce e semplice**: poche informazioni, pochi tocchi.

## Funzioni

### IN — aggiungere un prodotto
1. Tocco "IN" → si apre la fotocamera → inquadro il codice a barre.
2. L'app cerca il nome: prima nella memoria dei nomi (foglio `Prodotti`), poi su Open Food Facts. Se non lo trova, chiede di scriverlo e lo salva in `Prodotti` per le volte successive.
3. Scelgo la data di scadenza: scorciatoie (+3 giorni, +1 settimana, +1 mese, +3 mesi, +1 anno) oppure calendario. Su iPhone si può usare anche "Scansiona testo" di iOS.
4. Scelgo quanti pezzi (1 / 2 / 3 / …, predefinito 1).
5. Salvo → viene creata **una riga per ogni pezzo**, con la data di entrata (oggi).

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
- Campi: indirizzo (URL) dello script Google e chiave segreta.
- Salvati solo nel browser del telefono (non nel codice). Vanno inseriti una volta per ogni telefono/browser.
- Pulsante "Prova collegamento".

## Dati (Google Sheet)
| Foglio | Colonne |
|---|---|
| `Dispensa` | ID, CodiceBarre, Nome, Scadenza, DataEntrata |
| `Storico` | ID, CodiceBarre, Nome, Scadenza, DataEntrata, DataUscita |
| `Prodotti` | CodiceBarre, Nome |

Il foglio si può aprire e modificare anche a mano.

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
| 0 | Preparazione: repository, CLAUDE.md, SPEC.md, GitHub Pages | in corso |
| 1 | Pagina con fotocamera che legge il codice a barre | da fare |
| 2 | Google Sheet + Apps Script + schermata Impostazioni | da fare |
| 3 | IN | da fare |
| 4 | LISTA | da fare |
| 5 | OUT | da fare |
| 6 | Nome da Open Food Facts + memoria nomi | da fare |
| 7 | Rifiniture: icona, schermata Home | da fare |
| 8 | Avvisi email di scadenza | più avanti |
