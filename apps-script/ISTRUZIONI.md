# Collegare l'app al Google Sheet

Istruzioni passo passo. Servono circa 15–20 minuti, **meglio dal computer**.
Il codice da incollare è nel file [`Codice.gs`](Codice.gs) di questa cartella.

## A. Crea il foglio
1. Vai su **https://sheets.google.com** con il tuo account Google personale.
2. Crea un **foglio vuoto** (il riquadro con il "+").
3. In alto a sinistra clicca su **"Foglio di lavoro senza titolo"** e chiamalo `Dispensa`.

## B. Incolla lo script
1. Nel foglio, menu **Estensioni → Apps Script**. Si apre una nuova scheda: l'editor degli script.
2. In alto a sinistra clicca su **"Progetto senza titolo"** e chiamalo `Dispensa`.
3. Al centro c'è il file `Codice.gs` con poche righe (`function myFunction() {…}`). **Seleziona tutto e cancellalo** (Ctrl+A poi Canc, su Mac Cmd+A).
4. Apri il codice in versione "grezza", cioè come testo semplice senza la grafica di GitHub: **https://raw.githubusercontent.com/federicoamt/dispensa/main/apps-script/Codice.gs**. Seleziona tutto (Ctrl+A), copia (Ctrl+C) e incollalo nell'editor (Ctrl+V).
5. Salva con l'icona del **dischetto** (o Ctrl+S).

## C. Esegui la configurazione (crea i fogli e la chiave segreta)
1. Nella barra sopra il codice c'è un menu con il nome di una funzione: sceglici **`configura`**.
2. Clicca **▷ Esegui**.
3. La prima volta Google chiede l'autorizzazione:
   1. **"Autorizzazione necessaria"** → clicca **Esamina autorizzazioni**.
   2. Scegli il tuo account Google.
   3. Compare **"Google non ha verificato questa app"**. È normale: l'app è il *tuo* script, non un'app pubblicata da un'azienda, quindi Google non l'ha controllata. Clicca **Avanzate** (in basso a sinistra), poi **Vai a Dispensa (non sicura)**.
   4. Google mostra cosa può fare lo script: *vedere e modificare il foglio di lavoro in cui è installato* (solo questo foglio). Se ci sono caselle da spuntare, spuntale tutte. Clicca **Consenti** (o **Continua**).
4. In basso si apre il **Registro di esecuzione**. Dopo qualche secondo compare la riga:
   `LA TUA CHIAVE SEGRETA (copiala nell'app): …`
   **Copia la chiave** (la lunga sequenza di lettere e numeri) e tienila da parte.
5. Torna alla scheda del foglio: ora in basso ci sono le schede **Dispensa**, **Storico** e **Prodotti**, con le intestazioni.

> La chiave è come una password: chi la conosce può leggere e modificare la dispensa tramite l'app. Non pubblicarla e non scriverla nel foglio.
> Non l'hai copiata? Riesegui `configura`: la chiave resta la stessa e ricompare nel registro.

## D. Pubblica lo script come "App web"
1. In alto a destra nell'editor: **Esegui il deployment → Nuovo deployment**.
2. Accanto a "Seleziona tipo" clicca l'**ingranaggio ⚙️** e scegli **App web**.
3. Compila:
   - **Descrizione**: `Dispensa`
   - **Esegui come**: **Me** (il tuo indirizzo email)
   - **Chi ha accesso**: **Chiunque** ⚠️ importante: *non* "Chiunque abbia un account Google". "Chiunque" serve perché l'app possa raggiungere lo script; i dati restano protetti dalla chiave segreta.
4. Clicca **Esegui il deployment** (se chiede di nuovo l'autorizzazione, ripeti i passi del punto C.3).
5. Compare l'**URL dell'app web**: inizia con `https://script.google.com/macros/s/` e finisce con `/exec`. **Copialo** con il pulsante **Copia**.
6. Verifica: apri questo URL in una nuova scheda. Deve comparire una scritta tipo `{"ok":true,"messaggio":"Script Dispensa attivo…"}`.

## E. Porta URL e chiave sul telefono
Sono due testi lunghi: non provare a ricopiarli a mano.
1. Mandali a te stesso, per esempio in una **nota di Apple Note** (se è sincronizzata con iCloud) o in un'**email a te stesso**.
2. Sull'iPhone apri l'app Dispensa → **⚙️** in alto a destra.
3. Incolla l'URL in **Indirizzo dello script** e la chiave in **Chiave segreta**.
4. Tocca **Salva e prova collegamento**: deve comparire **"✅ Collegamento OK!"**.
5. Fatto questo puoi cancellare la nota o l'email.

## F. Condividi con la tua ragazza
1. Nel foglio: **Condividi** (in alto a destra) → inserisci la sua email → ruolo **Editor** → **Invia**. Così può aprire il foglio anche a mano.
2. Mandale URL e chiave in un messaggio privato. Sul suo telefono ripete il punto E.
   Non deve fare nient'altro: lo script lavora sempre "a nome tuo".

---

## In futuro: aggiornare lo script
Quando cambia `Codice.gs` (te lo dirò io):
1. Incolla il nuovo codice nell'editor al posto del vecchio (come al punto B) e salva.
2. **Esegui il deployment → Gestisci deployment**.
3. Clicca la **matita ✏️** (Modifica) sul deployment esistente.
4. In **Versione** scegli **Nuova versione** → **Esegui il deployment**.

Così l'URL **resta lo stesso** e non devi cambiare niente sui telefoni.
(Non usare "Nuovo deployment": creerebbe un URL diverso.)

## Se la chiave finisce in mani sbagliate
Nell'editor scegli la funzione **`cambiaChiave`** → **Esegui**: ne crea una nuova (la vedi nel registro). Poi inseriscila su entrambi i telefoni.
