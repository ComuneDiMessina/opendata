import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'design-react-kit';

export default function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    console.log('Toggle menu - before:', isNavOpen);
    setIsNavOpen(!isNavOpen);
    console.log('Toggle menu - after:', !isNavOpen);
  };

  return (
    <header className="it-header-wrapper">
        {/* Skip Link per accessibilità */}
        <a href="#main-content" className="skip-link">
          Salta al contenuto principale
        </a>
        
        {/* Header Slim */}
        <div className="it-header-slim-wrapper">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="it-header-slim-wrapper-content">
                  <Link 
                    className="d-none d-lg-block navbar-brand" 
                    to="/"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.outline = '3px solid #004D99';
                      e.target.style.outlineOffset = '2px';
                      e.target.style.background = '#e9ecef';
                      e.target.style.boxShadow = '0 0 0 4px rgba(0, 77, 153, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.outline = '';
                      e.target.style.outlineOffset = '';
                      e.target.style.background = '';
                      e.target.style.boxShadow = '';
                    }}
                    onMouseEnter={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.background = '#e9ecef';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.background = '';
                      }
                    }}
                  >
                    Comune di Messina
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* Header Center */}
      <div className="it-header-center-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="it-header-center-content-wrapper">
                <button
                  className="custom-navbar-toggler d-lg-none"
                  type="button"
                  onClick={toggleNav}
                  aria-controls="nav-menu"
                  aria-expanded={isNavOpen}
                  aria-label="Apri/chiudi menu di navigazione"
                >
                  <Icon icon={isNavOpen ? "it-close" : "it-burger"} color="primary" size="sm" />
                </button>
                <div className="it-brand-wrapper">
                  <Link to="/">
                    <img src="/logo.png" alt="Logo Comune di Messina" style={{ height: '60px', marginRight: '15px' }} />
                    <div className="it-brand-text">
                      <div className="it-brand-title">Portale Open Data</div>
                      <div className="it-brand-tagline d-none d-md-block">
                        Dati aperti del Comune di Messina
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Navbar */}
      <div className="it-header-navbar-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              {/* Menu Desktop - sempre visibile su lg+ */}
              <nav className="navbar navbar-expand-lg has-megamenu d-none d-lg-block">
                <ul className="navbar-nav">
                  <li className="nav-item">
                    <Link className="nav-link" to="/">
                      <span>Home</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/catalogo">
                      <span>Catalogo</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/temi">
                      <span>Temi</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/enti">
                      <span>Enti</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/informazioni">
                      <span>Informazioni</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Mobile Drawer - solo su mobile */}
      <div className={`mobile-menu-drawer ${isNavOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button
            className="mobile-menu-close"
            onClick={toggleNav}
            aria-label="Chiudi menu"
          >
            <Icon icon="it-close" size="lg" />
          </button>
        </div>
        <nav className="mobile-menu-nav">
          <Link className="mobile-menu-link" to="/" onClick={() => setIsNavOpen(false)}>
            <Icon icon="it-arrow-right" size="sm" />
            <span>Home</span>
          </Link>
          <Link className="mobile-menu-link" to="/catalogo" onClick={() => setIsNavOpen(false)}>
            <Icon icon="it-arrow-right" size="sm" />
            <span>Catalogo</span>
          </Link>
          <Link className="mobile-menu-link" to="/temi" onClick={() => setIsNavOpen(false)}>
            <Icon icon="it-arrow-right" size="sm" />
            <span>Temi</span>
          </Link>
          <Link className="mobile-menu-link" to="/enti" onClick={() => setIsNavOpen(false)}>
            <Icon icon="it-arrow-right" size="sm" />
            <span>Enti</span>
          </Link>
          <Link className="mobile-menu-link" to="/informazioni" onClick={() => setIsNavOpen(false)}>
            <Icon icon="it-arrow-right" size="sm" />
            <span>Informazioni</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
