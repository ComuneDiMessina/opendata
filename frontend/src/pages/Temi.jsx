import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Icon, Row, Col } from 'design-react-kit';
import { fetchGroupList, fetchGroupShow } from '../api/ckan';

const themeIcons = {
  trasporti: 'it-exchange-circle',
  ambiente: 'it-plant',
  economia: 'it-chart-line',
  governo: 'it-pa',
  salute: 'it-plus-circle',
  cultura: 'it-star-outline',
  energia: 'it-horn',
  agricoltura: 'it-plant',
  default: 'it-folder'
};

export default function Temi() {
  const [temi, setTemi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTemi() {
      try {
        const listRes = await fetchGroupList();
        if (listRes.success) {
          const details = await Promise.all(
            listRes.result.map(id => fetchGroupShow(id))
          );
          setTemi(details.filter(d => d.success).map(d => d.result));
        }
      } catch (err) {
        setError('Errore nel caricamento dei temi');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTemi();
  }, []);

  return (
    <div className="container">
      {/* Page Header - Sempre visibile */}
      <section className="py-4 border-bottom">
        <h1 className="mb-2" style={{ fontSize: '2rem' }}>
          <Icon icon="it-folder" className="me-2" />
          Temi e Categorie
        </h1>
        <p className="text-muted">
          {loading ? (
            'Caricamento temi in corso...'
          ) : (
            `Esplora i ${temi.length} temi disponibili per navigare i dataset per categoria`
          )}
        </p>
      </section>

      {/* Themes Grid */}
      <section className="py-4">
        {loading ? (
          <div className="text-center my-5 py-5">
            <div className="d-flex flex-column align-items-center justify-content-center">
              <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <p className="text-muted fw-semibold">Caricamento temi in corso...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <Row className="g-3">
            {temi.map(t => (
              <Col sm={6} md={4} lg={3} xl={2} key={t.id}>
              <Link 
                to={`/catalogo?tema=${t.name}`}
                className="text-decoration-none"
              >
                <Card className="shadow-sm border-0 h-100 hover-card overflow-hidden">
                  <div className="position-relative d-flex align-items-center justify-content-center" style={{ 
                    height: '140px', 
                    background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.85) 0%, rgba(0, 61, 122, 0.85) 100%)'
                  }}>
                    {t.image_display_url && (
                      <img 
                        src={t.image_display_url} 
                        alt={t.title}
                        className="position-absolute w-100 h-100" 
                        style={{ 
                          objectFit: 'cover',
                          zIndex: 0
                        }} 
                      />
                    )}
                    <div className="position-absolute w-100 h-100" style={{ 
                      background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.75) 0%, rgba(0, 61, 122, 0.75) 100%)',
                      zIndex: 1
                    }}></div>
                    <h5 className="mb-0 text-white fw-bold text-center px-3 position-relative" style={{ zIndex: 2 }}>
                      {t.title}
                    </h5>
                  </div>
                  
                  <CardBody className="d-flex flex-column p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-primary" style={{ fontSize: '1.25rem' }}>{t.package_count}</span>
                        <div className="small text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                          Dataset
                        </div>
                      </div>
                      <Icon icon="it-arrow-right" color="primary" size="sm" />
                    </div>
                    
                    {t.description && (
                      <p className="text-muted small mb-0" style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 3, 
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        fontSize: '0.85rem'
                      }}>
                        {t.description}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
        )}
      </section>
    </div>
  );
}
