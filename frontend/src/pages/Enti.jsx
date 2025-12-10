import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Icon, Row, Col } from 'design-react-kit';
import { fetchOrganizationList, fetchOrganizationShow } from '../api/ckan';

export default function Enti() {
  const [enti, setEnti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEnti() {
      try {
        const listRes = await fetchOrganizationList();
        if (listRes.success) {
          const details = await Promise.all(
            listRes.result.map(id => fetchOrganizationShow(id))
          );
          setEnti(details.filter(d => d.success).map(d => d.result));
        }
      } catch (err) {
        setError('Errore nel caricamento degli enti');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEnti();
  }, []);

  return (
    <div className="container">
      {/* Page Header - Sempre visibile */}
      <section className="py-4 border-bottom">
        <h1 className="mb-2" style={{ fontSize: '2rem' }}>
          <Icon icon="it-pa" className="me-2" />
          Enti e Organizzazioni
        </h1>
        <p className="text-muted">
          {loading ? (
            'Caricamento enti in corso...'
          ) : (
            `Esplora i ${enti.length} enti pubblici che pubblicano dati aperti`
          )}
        </p>
      </section>

      {/* Organizations Grid */}
      <section className="py-4">
        {loading ? (
          <div className="text-center my-5 py-5">
            <div className="d-flex flex-column align-items-center justify-content-center">
              <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <p className="text-muted fw-semibold">Caricamento enti in corso...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <Row className="g-4">
            {enti.map(e => (
              <Col md={6} lg={4} key={e.id}>
              <article className="it-card-profile rounded shadow-sm border h-100">
                <div className="it-card-profile-header p-3">
                  <div className="d-flex align-items-center">
                    <div className="it-profile-avatar-wrapper me-3">
                      {e.image_display_url ? (
                        <div className="it-avatar size-xl rounded-circle" style={{ 
                          width: '80px', 
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          background: '#f5f7fa'
                        }}>
                          <img 
                            src={e.image_display_url} 
                            alt={e.title}
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(ev) => { 
                              ev.target.style.display = 'none'; 
                              ev.target.parentElement.innerHTML = `
                                <div class="rounded-circle bg-light border d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                  <svg class="icon icon-primary icon-xl" role="img">
                                    <use href="#it-pa"></use>
                                  </svg>
                                </div>
                              `;
                            }} 
                          />
                        </div>
                      ) : (
                        <div className="it-avatar size-xl rounded-circle bg-light border" style={{ 
                          width: '80px', 
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon 
                            icon="it-pa" 
                            size="xl" 
                            color="primary"
                          />
                        </div>
                      )}
                    </div>
                    <div className="it-card-profile-title flex-grow-1">
                      <h5 className="it-card-profile-name mb-1">
                        <Link to={`/catalogo?ente=${e.name}`} className="text-decoration-none">
                          {e.title}
                        </Link>
                      </h5>
                      <p className="it-card-profile-role mb-0 small text-muted">
                        <Icon icon="it-file" size="sm" className="me-1" />
                        {e.package_count} dataset pubblicati
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="it-card-profile-body p-3">
                  {e.description && (
                    <p className="card-text small text-muted mb-3" style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical' 
                    }}>
                      {e.description}
                    </p>
                  )}
                  
                  <div className="it-card-description-list-wrapper">
                    <dl className="it-card-description-list mb-0">
                      {e.package_count > 0 && (
                        <div className="it-card-description-list-item">
                          <dt>Dataset:</dt>
                          <dd>
                            <Link to={`/catalogo?ente=${e.name}`}>
                              {e.package_count} disponibili
                            </Link>
                          </dd>
                        </div>
                      )}
                      
                      {e.site && (
                        <div className="it-card-description-list-item">
                          <dt>Sito web:</dt>
                          <dd>
                            <a 
                              href={e.site} 
                              target="_blank" 
                              rel="noreferrer"
                              className="d-inline-flex align-items-center"
                            >
                              <Icon icon="it-external-link" size="sm" className="me-1" />
                              Visita
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <div className="mt-3">
                    <Link 
                      to={`/catalogo?ente=${e.name}`} 
                      className="btn btn-primary btn-sm w-100"
                    >
                      <Icon icon="it-search" size="sm" color="white" className="me-2" />
                      Esplora dataset
                    </Link>
                  </div>
                </div>
              </article>
            </Col>
          ))}
        </Row>
        )}
      </section>
    </div>
  );
}
