import React, { useState, useEffect } from 'react';
import { Form, FormGroup, Label, Button, Row, Col, Icon, Input, Collapse } from 'design-react-kit';
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
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [allDatasets, setAllDatasets] = useState([]); // Dataset senza filtro formato (client-side)
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [themes, setThemes] = useState([]);
  const [enti, setEnti] = useState([]);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [formatCounts, setFormatCounts] = useState({});
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // Stato per collapse filtri mobile
  const [totalDatasets, setTotalDatasets] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 30;
  const FORMATS_TO_SHOW = 5; // Numero di formati da mostrare di default

  // Carica formati disponibili con i loro conteggi
  useEffect(() => {
    async function loadFormats() {
      try {
        // Carica i dataset per estrarre i formati disponibili
        const apiParams = {
          rows: 1000, // Carica molti dataset per avere buona copertura dei formati
          start: 0
        };
        
        // Aggiungi la query di ricerca se presente
        if (activeSearch) {
          apiParams.q = activeSearch;
        }
        
        const filters = [];
        if (theme) filters.push(`groups:${theme}`);
        if (ente) filters.push(`organization:${ente}`);
        if (filters.length > 0) apiParams.fq = filters.join(' AND ');
        
        const res = await fetchPackageSearch(apiParams);
        if (res.success) {
          const formats = new Set();
          const counts = {};
          
          res.result.results.forEach(ds => {
            ds.resources?.forEach(r => {
              if (r.format) {
                // Preserva il case originale del formato
                formats.add(r.format);
                counts[r.format] = (counts[r.format] || 0) + 1;
              }
            });
          });
          
          setAvailableFormats([...formats].sort());
          setFormatCounts(counts);
        }
      } catch (err) {
        console.error('Errore caricamento formati:', err);
      }
    }
    
    loadFormats();
  }, [activeSearch, theme, ente]);

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
        // Aggiungi filtro per formati selezionati
        if (selectedFormats.length > 0) {
          // CKAN usa OR per formati multipli, i formati sono case-sensitive
          const formatFilters = selectedFormats.map(f => `res_format:"${f}"`).join(' OR ');
          filters.push(`(${formatFilters})`);
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
  }, [activeSearch, sort, theme, ente, selectedFormats]);

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
      // Aggiungi filtro per formati selezionati
      if (selectedFormats.length > 0) {
        // I formati sono case-sensitive
        const formatFilters = selectedFormats.map(f => `res_format:"${f}"`).join(' OR ');
        filters.push(`(${formatFilters})`);
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
    setSelectedFormats([]);
    setSort('metadata_modified desc');
    setSearchParams({}, { replace: true });
  };

  // Gestisci la selezione/deselezione dei formati
  const toggleFormat = (format) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  return (
    <div className="container-fluid px-4 px-lg-5">
      {/* Results Section */}
      <Row className="mt-4">
        {/* Sidebar Filtri Desktop */}
        <Col xs={12} lg={2} xl={2} className="mb-4 order-2 order-lg-1 d-none d-lg-block">
          <div className="sticky-top" style={{ top: '1rem' }}>
            <div className="bg-light rounded-3 p-3 border">
              {/* Filtro Tema */}
              <div className="mb-4">
                <label htmlFor="theme-sidebar" className="form-label fw-semibold">
                  <Icon icon="it-folder" size="xs" className="me-1" />
                  Tema
                </label>
                <select 
                  id="theme-sidebar" 
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

              {/* Filtro Ente */}
              <div className="mb-4">
                <label htmlFor="ente-sidebar" className="form-label fw-semibold">
                  <Icon icon="it-pa" size="xs" className="me-1" />
                  Ente
                </label>
                <select 
                  id="ente-sidebar" 
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

              {/* Filtro Formati */}
              {availableFormats.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold mb-2">
                    <Icon icon="it-file" size="xs" className="me-1" />
                    Formato
                  </label>
                  <div>
                    {(showAllFormats ? availableFormats : availableFormats.slice(0, FORMATS_TO_SHOW)).map(format => (
                      <FormGroup check key={format} className="mb-2">
                        <Input
                          id={`format-${format}`}
                          type="checkbox"
                          checked={selectedFormats.includes(format)}
                          onChange={() => toggleFormat(format)}
                        />
                        <Label check htmlFor={`format-${format}`} className="d-flex justify-content-between align-items-center">
                          <span>{format}</span>
                          <span className="badge bg-secondary ms-2">{formatCounts[format] || 0}</span>
                        </Label>
                      </FormGroup>
                    ))}
                    {availableFormats.length > FORMATS_TO_SHOW && (
                      <Button
                        color="link"
                        size="sm"
                        className="p-0 text-decoration-none"
                        onClick={() => setShowAllFormats(!showAllFormats)}
                      >
                        {showAllFormats ? (
                          <>
                            <Icon icon="it-minus" size="xs" className="me-1" />
                            Mostra meno
                          </>
                        ) : (
                          <>
                            <Icon icon="it-plus" size="xs" className="me-1" />
                            Mostra tutti ({availableFormats.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Pulsante reset */}
              {(theme || ente || selectedFormats.length > 0) && (
                <Button
                  color="outline-primary"
                  size="sm"
                  className="w-100"
                  onClick={handleResetFilters}
                >
                  <Icon icon="it-refresh" size="xs" className="me-1" />
                  Cancella tutti i filtri
                </Button>
              )}
            </div>
          </div>
        </Col>

        {/* Main Content */}
        <Col xs={12} lg={10} xl={10} className="order-1 order-lg-2">
          {/* Filtri Collapsible Mobile */}
          <div className="d-lg-none mb-4">
            <Button
              color="light"
              className="w-100 d-flex justify-content-between align-items-center border"
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
            >
              <span>
                <Icon icon="it-funnel" size="sm" className="me-2" />
                Filtri
              </span>
              <Icon icon={filtersOpen ? "it-minus" : "it-plus"} size="sm" />
            </Button>
            <Collapse isOpen={filtersOpen}>
              <div className="bg-light rounded-3 p-3 border mt-2">
                {/* Filtro Tema */}
                <div className="mb-4">
                  <label htmlFor="theme-mobile" className="form-label fw-semibold">
                    <Icon icon="it-folder" size="xs" className="me-1" />
                    Tema
                  </label>
                  <select 
                    id="theme-mobile" 
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

                {/* Filtro Ente */}
                <div className="mb-4">
                  <label htmlFor="ente-mobile" className="form-label fw-semibold">
                    <Icon icon="it-pa" size="xs" className="me-1" />
                    Ente
                  </label>
                  <select 
                    id="ente-mobile" 
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

                {/* Filtro Formati */}
                {availableFormats.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-2">
                      <Icon icon="it-file" size="xs" className="me-1" />
                      Formato
                    </label>
                    <div>
                      {(showAllFormats ? availableFormats : availableFormats.slice(0, FORMATS_TO_SHOW)).map(format => (
                        <FormGroup check key={format} className="mb-2">
                          <Input
                            id={`format-mobile-${format}`}
                            type="checkbox"
                            checked={selectedFormats.includes(format)}
                            onChange={() => toggleFormat(format)}
                          />
                          <Label check htmlFor={`format-mobile-${format}`} className="d-flex justify-content-between align-items-center">
                            <span>{format}</span>
                            <span className="badge bg-secondary ms-2">{formatCounts[format] || 0}</span>
                          </Label>
                        </FormGroup>
                      ))}
                      {availableFormats.length > FORMATS_TO_SHOW && (
                        <Button
                          color="link"
                          size="sm"
                          className="p-0 text-decoration-none"
                          onClick={() => setShowAllFormats(!showAllFormats)}
                        >
                          {showAllFormats ? (
                            <>
                              <Icon icon="it-minus" size="xs" className="me-1" />
                              Mostra meno
                            </>
                          ) : (
                            <>
                              <Icon icon="it-plus" size="xs" className="me-1" />
                              Mostra tutti ({availableFormats.length})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Pulsante reset */}
                {(theme || ente || selectedFormats.length > 0) && (
                  <Button
                    color="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={handleResetFilters}
                  >
                    <Icon icon="it-refresh" size="xs" className="me-1" />
                    Cancella tutti i filtri
                  </Button>
                )}
              </div>
            </Collapse>
          </div>

          <div className="catalog-content-container">
          {/* Search Bar */}
          <div className="mb-4">
            <Form role="search" onSubmit={handleSearch}>
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Icon icon="it-search" color="primary" size="sm" aria-hidden="true" />
                </span>
                <input
                  type="search"
                  id="search"
                  className="form-control border-start-0 ps-0"
                  placeholder="Cerca dataset per nome o descrizione..."
                  value={searchInput}
                  onChange={e => {
                    setSearchInput(e.target.value);
                    // Se l'utente cancella tutto (incluso con la X), resetta la ricerca
                    if (e.target.value === '') {
                      setActiveSearch('');
                    }
                  }}
                  aria-label="Cerca dataset"
                />
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  aria-label="Avvia ricerca"
                >
                  <Icon icon="it-search" color="white" size="sm" aria-hidden="true" />
                  <span className="d-none d-sm-inline ms-2">Cerca</span>
                </button>
              </div>
            </Form>
          </div>

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
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="sort-results" className="text-muted small mb-0">
                  Ordina per:
                </label>
                <select 
                  id="sort-results" 
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="metadata_modified desc">Più recenti</option>
                  <option value="title asc">Titolo (A-Z)</option>
                  <option value="title desc">Titolo (Z-A)</option>
                </select>
              </div>
            </div>
            
            <Row className="g-4">
              {datasets.map(ds => (
                <Col md={6} lg={4} xl={4} className="catalog-card-col" key={ds.id}>
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
        </Col>
      </Row>
    </div>
  );
}
