// Dispensa — ricerca del nome di un prodotto su Open Food Facts
// (archivio gratuito e aperto di prodotti alimentari: https://world.openfoodfacts.org).
// Al sito viene inviato solo il codice a barre, nessun altro dato.
// Uso: const r = await OpenFoodFacts.cercaNome('8076800195057')
//      r = { nome: 'Spaghetti n.5 Barilla' }  oppure  { nome: '' }  oppure  { nome: '', errore: '…' }

const OpenFoodFacts = (() => {
  const INDIRIZZO = 'https://world.openfoodfacts.org/api/v2/product/';
  const CAMPI = 'product_name_it,product_name,generic_name_it,generic_name,brands';
  const ATTESA_MASSIMA_MS = 6000;
  const LUNGHEZZA_MASSIMA = 60;

  /** Compone un nome breve: nome del prodotto (in italiano se c'è) + marca, se non è già nel nome. */
  function componiNome(p) {
    const pulisci = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    let nome = pulisci(p.product_name_it) || pulisci(p.product_name) ||
      pulisci(p.generic_name_it) || pulisci(p.generic_name);
    if (!nome) return '';
    const marca = pulisci(String(p.brands || '').split(',')[0]);
    if (marca && !nome.toLowerCase().includes(marca.toLowerCase())) nome += ' ' + marca;
    if (nome.length > LUNGHEZZA_MASSIMA) nome = nome.slice(0, LUNGHEZZA_MASSIMA - 1).trim() + '…';
    return nome;
  }

  async function cercaNome(codice) {
    const controllo = new AbortController();
    const timer = setTimeout(() => controllo.abort(), ATTESA_MASSIMA_MS);
    try {
      const risposta = await fetch(INDIRIZZO + encodeURIComponent(codice) + '.json?fields=' + CAMPI, {
        signal: controllo.signal,
      });
      // 404 = prodotto non presente nell'archivio
      if (risposta.status === 404) return { nome: '' };
      if (!risposta.ok) return { nome: '', errore: 'risposta ' + risposta.status };
      const dati = await risposta.json();
      if (dati.status !== 1 || !dati.product) return { nome: '' };
      return { nome: componiNome(dati.product) };
    } catch (err) {
      return { nome: '', errore: err.name === 'AbortError' ? 'non risponde' : 'non raggiungibile' };
    } finally {
      clearTimeout(timer);
    }
  }

  return { cercaNome, componiNome };
})();
