import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        {items.map((item, idx) => (
          <li key={idx} className={`breadcrumb-item${idx === items.length - 1 ? ' active' : ''}`} aria-current={idx === items.length - 1 ? 'page' : undefined}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
