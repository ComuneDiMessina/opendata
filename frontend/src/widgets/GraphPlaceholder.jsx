import React from 'react';

export default function GraphPlaceholder({ title = 'Grafico' }) {
  return (
    <article className="card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <div className="border rounded d-flex align-items-center justify-content-center" style={{ minHeight: 220, background: '#fafafa' }}>
          <span className="text-muted">Placeholder grafico — qui verrà montato il componente grafico</span>
        </div>
      </div>
    </article>
  );
}
