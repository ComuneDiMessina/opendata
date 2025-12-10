import React from 'react';

export default function Informazioni() {
  return (
    <div>
      {/* H1 principale per accessibilità */}
      <h1>Informazioni</h1>
      <p className="text-muted">Portale Open Data del Comune di Messina: consulta, ricerca e scarica i dati pubblici messinesi in modo semplice e trasparente.</p>
      <ul>
        <li>Frontend sviluppato con React + Vite, design system .italia</li>
        <li>Integrazione API CKAN v3, sola lettura</li>
        <li>Layout responsivo e accessibile</li>
        <li>Filtri per temi, enti, formati, ricerca testuale</li>
        <li>Anteprima tabellare e data dictionary per risorse tabellari</li>
        <li>Deploy statico, link condivisibili, nessuna autenticazione richiesta</li>
      </ul>
      <div className="alert alert-info mt-4">
        In caso di errore API, viene mostrato un messaggio chiaro all’utente.
      </div>
    </div>
  );
}
