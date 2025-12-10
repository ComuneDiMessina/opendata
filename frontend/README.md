# Open Data Catalog Frontend

## Descrizione del Progetto
Questo repository contiene il codice sorgente del frontend per il portale Open Data del Comune di Messina. Il progetto è una piattaforma di consultazione dei dati aperti basata su CKAN, sviluppata utilizzando React e Vite, e progettata per essere conforme al design system di Bootstrap Italia.

Il codice è destinato a passare sotto l'ownership del Comune di Messina e farà parte del "Catalogo del Riuso" per la pubblica amministrazione.

## Funzionalità Principali
- **Navigazione Intuitiva**: Interfaccia utente moderna e responsiva con routing dinamico.
- **Integrazione con CKAN**: Recupero e visualizzazione dei dati tramite le API di CKAN v3.
- **Design System**: Utilizzo di componenti di Bootstrap Italia per garantire coerenza visiva e accessibilità.
- **Visualizzazione Dati**: Anteprime tabellari, mappe interattive e grafici per la rappresentazione dei dati.
- **Ricerca Avanzata**: Filtri e ordinamenti per esplorare dataset e risorse.

## Struttura del Progetto
- **Frontend**: React + Vite
- **Design System**: Bootstrap Italia tramite il pacchetto `design-react-kit`
- **Routing**: Gestito tramite React Router
- **API**: Integrazione centralizzata in `src/api/ckan.js`

### Architettura delle Pagine
- `/` → Home: Statistiche e dataset recenti
- `/catalogo` → Catalogo: Ricerca e filtri
- `/dataset/:id` → Dettaglio Dataset: Metadati e risorse
- `/risorsa/:id` → Dettaglio Risorsa: Dettagli e anteprime
- `/temi` → Temi: Elenco dei gruppi
- `/enti` → Enti: Elenco delle organizzazioni
- `/informazioni` → Informazioni: Pagina statica

## Requisiti di Sviluppo
- **Node.js**: Versione >= 16
- **NPM**: Versione >= 7

### Comandi Utili
- `npm install`: Installa le dipendenze
- `npm run dev`: Avvia il server di sviluppo
- `npm run build`: Esegue il build di produzione
- `npm run preview`: Anteprima del build di produzione

## Configurazione della Sorgente Dati
Per cambiare la sorgente dei dati, è sufficiente modificare la costante `VITE_CKAN_BASE_URL` nei file `.env`. Assicurarsi che il valore punti all'endpoint corretto delle API di CKAN.

## Contributi
Il progetto è stato sviluppato da [Dennis Angemi](https://github.com/dennisangemi) - con il fondamentale supporto di Claude AI - e sarà trasferito al Comune di Messina per la gestione e il mantenimento futuro.

## Licenza
WIP