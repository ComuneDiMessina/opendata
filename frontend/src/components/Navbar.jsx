import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom mb-3">
      <div className="container">
        <Link className="navbar-brand" to="/">Open Data Messina</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/catalogo">Catalogo</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/enti">Enti</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/temi">Temi</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/informazioni">Informazioni</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
