import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Icon, Input } from 'design-react-kit';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchPackageSearch, fetchGroupList, fetchGroupShow, fetchOrganizationList, fetchOrganizationShow, enrichDatasetsWithOrgDetails } from '../api/ckan';
import DatasetCard from '../components/DatasetCard';

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [activeSearch, setActiveSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('metadata_modified desc');
  const [theme, setTheme] = useState(searchParams.get('tema') || '');
  const [ente, setEnte] = useState(searchParams.get('ente') || '');
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [themes, setThemes] = useState([]);
  const [enti, setEnti] = useState([]);
  const [totalDatasets, setTotalDatasets] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 30;

  useEffect(() => {
    const temaParam = searchParams.get('tema');
    const enteParam = searchParams.get('ente');
    const qParam = searchParams.get('q');
    if (temaParam) {
      setTheme(temaParam);
    }
    if (enteParam) {
      setEnte(enteParam);
    }
    if (qParam) {
      setSearchInput(qParam);
      setActiveSearch(qParam);
    }
  }, [searchParams]);

  // Carica temi ed enti solo una volta
  useEffect(() => {
    async function loadThemesAndOrgs() {
      try {
        // Carica temi
        const themesListRes = await fetchGroupList();
        if (themesListRes.success) {
          const themesDetails = await Promise.all(
            themesListRes.result.map(id => fetchGroupShow(id))
          );
          const themesWithTitles = themesDetails
            .filter(d => d.success)
            .map(d => d.result);
          setThemes(themesWithTitles);
        }
        
        // Carica enti
        const entiListRes = await fetchOrganizationList();
        if (entiListRes.success) {
          const entiDetails = await Promise.all(
            entiListRes.result.map(id => fetchOrganizationShow(id))
          );
          const entiWithTitles = entiDetails
            .filter(d => d.success)
            .map(d => d.result);
          setEnti(entiWithTitles);
        }
      } catch (err) {
        console.error('Errore caricamento filtri:', err);
      }
    }
    loadThemesAndOrgs();
  }, []);

  // Carica dataset con paginazione
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setCurrentPage(0);
      
      // Aggiorna URL con i parametri di ricerca
      const params = {};
      if (activeSearch) params.q = activeSearch;
      if (theme) params.tema = theme;
      if (ente) params.ente = ente;
      setSearchParams(params, { replace: true });
      
      try {
        let apiParams = { 
          q: activeSearch || '', 
          rows: ROWS_PER_PAGE,
          start: 0,
          sort 
        };
        
        // Costruisci filtri CKAN
        const filters = [];
        if (theme) {
          filters.push(`groups:${theme}`);
        }
        if (ente) {
          filters.push(`organization:${ente}`);
        }
        if (filters.length > 0) {
          apiParams.fq = filters.join(' AND ');
        }
        
        const datasetsRes = await fetchPackageSearch(apiParams);
        
        if (datasetsRes.success) {
          setTotalDatasets(datasetsRes.result.count);
          
          // Arricchisci i dataset con i dettagli completi delle organizzazioni
          const enrichedDatasets = await enrichDatasetsWithOrgDetails(datasetsRes.result.results);
          
          setDatasets(enrichedDatasets);
        } else {
          setError('Errore nel caricamento dei dati');
        }
      } catch (err) {
        setError('Errore nel caricamento dei dati');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSearch, sort, theme, ente]);

  // Funzione per caricare più dataset
  const loadMore = async () => {
    if (loadingMore || datasets.length >= totalDatasets) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      let apiParams = { 
        q: activeSearch || '', 
        rows: ROWS_PER_PAGE,
        start: nextPage * ROWS_PER_PAGE,
        sort 
      };
      
      const filters = [];
      if (theme) {
        filters.push(`groups:${theme}`);
      }
      if (ente) {
        filters.push(`organization:${ente}`);
      }
      if (filters.length > 0) {
        apiParams.fq = filters.join(' AND ');
      }
      
      const datasetsRes = await fetchPackageSearch(apiParams);
      
      if (datasetsRes.success) {
        const enrichedDatasets = await enrichDatasetsWithOrgDetails(datasetsRes.result.results);
        setDatasets(prev => [...prev, ...enrichedDatasets]);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('Errore caricamento altri dataset:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Funzione per gestire la ricerca
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  // Funzione per ripristinare i filtri
  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setTheme('');
    setEnte('');
    setSort('metadata_modified desc');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="container">
      {/* Page Header */}
      <section className="py-4">
        <h1 className="mb-2" style={{ fontSize: '2rem' }}>
          <Icon icon="it-file" className="me-2" />
          Catalogo Dataset
        </h1>
        <p className="text-muted">
          Elenco e ricerca dei dataset pubblici del Comune di Messina
        </p>
      </section>

      {/* Search and Filters */}
      <section className="py-4 bg-light rounded-3 my-4 border">
        <Form role="search" className="px-4 py-3" onSubmit={handleSearch}>
          {/* Search Bar */}
          <Row className="g-3 pb-4 mb-4">
            <Col xs={12}>
              <div className="form-group mb-0">
                <label htmlFor="search" className="form-label active fw-semibold">
                  Ricerca dataset
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Icon icon="it-search" color="primary" size="sm" aria-hidden="true" />
                  </span>
                  <input
                    type="search"
                    id="search"
                    className="form-control"
                    placeholder="Cerca per nome o descrizione..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    aria-label="Avvia ricerca"
                  >
                    Cerca
                  </button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Filters Row */}
          <Row className="g-3">
            <Col md={6} lg={3}>
              <div className="form-group mb-0">
                <label htmlFor="theme" className="form-label active fw-semibold">
                  Tema
                </label>
                <select 
                  id="theme" 
                  className="form-select"
                  value={theme} 
                  onChange={e => setTheme(e.target.value)}
                >
                  <option value="">Tutti i temi</option>
                  {themes.map(t => (
                    <option key={t.name} value={t.name}>{t.title}</option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={6} lg={3}>
              <div className="form-group mb-0">
                <label htmlFor="ente" className="form-label active fw-semibold">
                  Ente
                </label>
                <select 
                  id="ente" 
                  className="form-select"
                  value={ente} 
                  onChange={e => setEnte(e.target.value)}
                >
                  <option value="">Tutti gli enti</option>
                  {enti.map(e => (
                    <option key={e.name} value={e.name}>{e.title}</option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={6} lg={3}>
              <div className="form-group mb-0">
                <label htmlFor="sort" className="form-label active fw-semibold">
                  Ordina per
                </label>
                <select 
                  id="sort" 
                  className="form-select"
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="metadata_modified desc">Più recenti</option>
                  <option value="title asc">Titolo (A-Z)</option>
                  <option value="title desc">Titolo (Z-A)</option>
                </select>
              </div>
            </Col>
            <Col md={6} lg={3}>
              <div className="form-group mb-0">
                <label className="form-label active fw-semibold d-block" style={{ visibility: 'hidden' }}>
                  Azioni
                </label>
                <button 
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={handleResetFilters}
                >
                  <Icon icon="it-refresh" size="sm" className="me-2" aria-hidden="true" />
                  Ripristina filtri
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </section>

      {/* Results Section */}
      <section className="py-3">
        {loading ? (
          <div className="text-center my-5 py-5">
            <div className="d-flex flex-column align-items-center justify-content-center">
              <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <p className="text-muted fw-semibold">Caricamento dataset in corso...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <>
            {/* Regione aria-live per accessibilità - annuncia risultati */}
            <div aria-live="polite" aria-atomic="true" className="visually-hidden">
              {totalDatasets === 0 ? 'Nessun dataset trovato' : `${totalDatasets} dataset ${totalDatasets === 1 ? 'trovato' : 'trovati'}`}
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="text-muted mb-0">
                <strong>{datasets.length}</strong> di <strong>{totalDatasets}</strong> dataset
              </p>
            </div>
            
            <Row className="g-4">
              {datasets.map(ds => (
                <Col md={6} lg={4} key={ds.id}>
                  <DatasetCard dataset={ds} />
                </Col>
              ))}
              
              {datasets.length === 0 && (
                <Col xs={12}>
                  <div className="alert alert-warning" role="alert">
                    Nessun dataset trovato. Prova a modificare i criteri di ricerca.
                  </div>
                </Col>
              )}
            </Row>
            
            {/* Bottone Carica Altri */}
            {datasets.length < totalDatasets && (
              <div className="text-center mt-5">
                <Button
                  color="primary"
                  size="lg"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5"
                >
                  {loadingMore ? (
                    <>
                      <div className="progress-spinner progress-spinner-active size-sm d-inline-block me-2" style={{ verticalAlign: 'middle' }}>
                        <span className="visually-hidden">Caricamento...</span>
                      </div>
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <Icon icon="it-plus" color="white" className="me-2" />
                      Carica altri dataset ({totalDatasets - datasets.length} rimanenti)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
