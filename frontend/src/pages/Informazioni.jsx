import React from 'react';
import { Icon } from 'design-react-kit';

export default function Informazioni() {
  return (
    <div className="container my-5">
      {/* H1 principale per accessibilità */}
      <h1>Informazioni</h1>
      <p className="lead">
        Uno spazio digitale pensato per rendere accessibili a tutte le persone i dati pubblici della città di Messina.
      </p>
      <p>
        Questo portale nasce con l'obiettivo di promuovere la trasparenza amministrativa e favorire la partecipazione delle cittadine e dei cittadini alla vita pubblica. Attraverso questa piattaforma puoi consultare, ricercare e scaricare liberamente i dati pubblicati dal Comune e dagli enti associati, utilizzandoli per progetti personali, ricerche, sviluppo di applicazioni o semplicemente per conoscere meglio la tua città.
      </p>
      <p>
        Il portale offre strumenti di ricerca avanzata per filtrare i dati per temi, enti, formati e parole chiave. Molti dataset sono visualizzabili direttamente online in formato tabellare, rendendo più immediata la consultazione delle informazioni. Tutti i dati sono condivisibili tramite link diretti e liberamente utilizzabili secondo le licenze indicate.
      </p>

      <h2 className="h4 mb-3 mt-5">Segnalazioni</h2>
      <p>
        Per segnalare problemi, suggerire miglioramenti o richiedere nuovi dataset, è possibile utilizzare:
      </p>
      <div className="d-flex flex-column flex-md-row gap-3 my-4">
        <a 
          href="https://github.com/ComuneDiMessina/opendata/issues/new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          <Icon icon="it-github" size="sm" color="white" className="me-2" aria-hidden="true" />
          Apri una Issue su GitHub
        </a>
        <a 
          href="mailto:opendata@comune.messina.it"
          className="btn btn-outline-primary"
        >
          <Icon icon="it-mail" size="sm" color="primary" className="me-2" aria-hidden="true" />
          Invia una Email
        </a>
      </div>

      <h2 className="h4 mb-3 mt-5">Tecnologia</h2>
      <p>
        Il portale è costruito su tecnologie open source: il frontend è sviluppato in <strong>React</strong>, mentre la gestione dei dati è affidata a <strong>CKAN</strong>, il sistema di gestione dati più utilizzato a livello mondiale per i portali Open Data.
      </p>
      <p>
        Il codice sorgente è completamente aperto e disponibile nel repository GitHub del Comune di Messina: <a href="https://github.com/comuneDiMessina/opendata" target="_blank" rel="noopener noreferrer" className="text-decoration-none">github.com/comuneDiMessina/opendata</a>
      </p>

      <h2 className="h4 mb-3 mt-5">API</h2>
      <p>
        Tutti i dataset pubblicati sul portale sono accessibili anche tramite <strong>API REST</strong>, consentendo di integrare i dati nelle proprie applicazioni in modo automatico e programmatico.
      </p>
      <p>
        Le API seguono lo standard <strong>CKAN API v3</strong> e permettono di:
      </p>
      <ul>
        <li>Interrogare e filtrare i dataset in modo dinamico</li>
        <li>Accedere ai dati senza dover scaricare file completi</li>
        <li>Implementare paginazione e ricerca testuale</li>
        <li>Recuperare metadati strutturati in formato JSON</li>
      </ul>
      <p>
        Per ogni risorsa tabellare è disponibile la documentazione API specifica nella pagina di dettaglio della risorsa, con esempi pratici di utilizzo e parametri disponibili.
      </p>
      <p>
        <strong>Endpoint base:</strong> <code className="bg-light px-2 py-1 rounded">https://dati.comune.messina.it/api/3/action/</code>
      </p>
      <p>
        Per la documentazione completa delle API CKAN, consulta: <a href="https://docs.ckan.org/en/2.10/api/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">docs.ckan.org/en/2.10/api/</a>
      </p>

      <hr className="my-5" />

      <h2 className="h4 mb-3">Dal messaggio rivolto alla comunità Open Data Sicilia, durante il raduno 2016 che Messina ha avuto l'onore di ospitare:</h2>
      
      <blockquote className="blockquote ps-4 border-start border-primary border-4">
        <p className="mb-4">
          "È una grande gioia che sia Messina ad ospitare questo evento, che apre a processi di democrazia, trasparenza e partecipazione. È anche molto importante che questo raduno sia stato organizzato dai cittadini, dal basso, e che questi stessi cittadini cerchino quotidianamente un dialogo con le loro istituzioni di riferimento per coinvolgerle in questi processi con l'obiettivo di migliorare il funzionamento delle stesse istituzioni e della pubblica amministrazione."
        </p>
        <p className="mb-0">
          "Il Comune di Messina è certamente indietro su questi temi ma abbiamo cominciato ad impegnarci per recuperare terreno, con la consapevolezza che per riuscire c'è bisogno di collaborazione tra l'ente locale e i cittadini."
        </p>
      </blockquote>

      <hr className="my-5" />

      <h2 className="h4 mb-3">Ringraziamenti</h2>
      <p>
        Un vivo e particolare ringraziamento a <strong>Francesco Piero Paolicelli</strong> che ha reso migliore questo portale grazie alla sua professionalità, all'amichevole e continuo supporto tecnico e alla sua profonda conoscenza del mondo Open Government. Sue le personalizzazioni CKAN adottate dal portale https://github.com/piersoft/ckan-docker.
      </p>
    </div>
  );
}
