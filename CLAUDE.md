# CLAUDE.md — Regole permanenti del progetto "Dispensa"

Questo file viene letto da Claude Code all'inizio di ogni sessione. Contiene le regole che valgono sempre.
La specifica dell'app (cosa fa) è in `SPEC.md`.

## Chi è l'utente
- Ha studiato economia, è pratico di computer ma **non ha mai programmato**.
- Rispondi **in italiano**, in modo semplice, spiegando il gergo tecnico quando lo usi.
- Quando l'utente deve fare qualcosa (account, configurazioni, test sul telefono), dai **istruzioni passo passo** numerate.
- Alla fine di ogni passo spiega in breve **cosa hai fatto e perché**.

## Vincoli (non negoziabili)
- **Costo zero** per costruire e mantenere: niente servizi a pagamento, niente account sviluppatore Apple.
- **Web app** (HTML/CSS/JavaScript semplici, niente strumenti di build), usata da iPhone in Safari o Chrome e aggiunta alla schermata Home.
- Pubblicata con **GitHub Pages** da questo repository (ramo `main`, cartella principale).
- Dati in un **Google Sheet** sull'account Google personale dell'utente, condiviso con la compagna. Collegamento tramite **Google Apps Script** (Web App). Il codice dello script sta nel repository (`apps-script/`), l'utente lo incolla a mano nel foglio: ogni modifica allo script va accompagnata dalle istruzioni per ripubblicarlo.
- **Repository pubblico**: nessun dato personale nel codice (niente URL dello script, chiavi, email, nomi). URL dello script e chiave segreta vengono inseriti nella schermata Impostazioni dell'app e salvati solo nel browser del telefono.
- Lo script rifiuta **ogni** richiesta (lettura e scrittura) senza la chiave segreta corretta.
- Nomi dei prodotti da **Open Food Facts** (gratuito); se non trovato, l'utente lo scrive e l'app lo ricorda per quel codice a barre.
- Librerie esterne: solo gratuite e open source, salvate nel repository (non caricate da servizi esterni a runtime).

## Come lavoriamo
- **Una tappa alla volta**: si costruisce, l'utente prova sull'iPhone, poi si passa alla successiva. Ogni tappa deve essere piccola e verificabile sul telefono.
- Prima di decisioni nuove o ambigue, **chiedi** all'utente.
- Quando si decide qualcosa di nuovo, **aggiorna `SPEC.md`** (e questo file se è una regola permanente).
- Pubblicazione: **commit e push direttamente su `main`** (GitHub Pages si aggiorna da solo in 1–2 minuti). Messaggi di commit in italiano, chiari.
- **A ogni pubblicazione aumenta il numero di versione** in `index.html`: sia la scritta "Versione N" in fondo alla pagina, sia il `?v=N` dopo i file `.css` e `.js`. Così il telefono non usa file vecchi rimasti in memoria (cache) e l'utente può controllare quale versione sta vedendo.
- La sessione Claude Code gira nel cloud e viene cancellata: a fine tappa tutto va salvato su GitHub.
- Interfaccia dell'app in italiano, pensata per il pollice: pulsanti grandi, pochi passaggi.
