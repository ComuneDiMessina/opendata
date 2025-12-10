import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, CardBody, CardTitle, CardText, 
  Table, Button, Badge, Icon, 
  Container, Row, Col, Input, FormGroup, Label, notify
} from 'design-react-kit';
import ReactMarkdown from 'react-markdown';
import { fetchDatastoreSearch, fetchResourceShow, fetchPackageShow } from '../api/ckan';
import { CKAN_BASE_URL } from '../config';
import Breadcrumbs from '../components/Breadcrumbs';

export default function DettaglioRisorsa() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const limit = 500;

  useEffect(() => {
    async function loadResource() {
      try {
        // Carica i metadati della risorsa
        const resourceRes = await fetchResourceShow(id);
        if (resourceRes.success) {
          setResource(resourceRes.result);
          
          // Carica il dataset a cui appartiene la risorsa
          if (resourceRes.result.package_id) {
            const datasetRes = await fetchPackageShow(resourceRes.result.package_id);
            if (datasetRes.success) {
              setDataset(datasetRes.result);
            }
          }
          
          // Se non è un file GeoJSON, prova a caricare i dati dalla datastore
          const format = resourceRes.result.format?.toLowerCase() || '';
          if (format !== 'geojson' && format !== 'json') {
            const datastoreRes = await fetchDatastoreSearch({ resource_id: id, limit, offset: page * limit });
            if (datastoreRes.success) {
              setData(datastoreRes.result);
            }
          }
        }
      } catch (err) {
        setError('Errore nel caricamento della risorsa');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResource();
  }, [id, page]);

  const handleCopy = () => {
    const baseUrl = CKAN_BASE_URL.replace('/api/3/action', '');
    const url = `${baseUrl}/api/3/action/datastore_search?resource_id=${id}`;
    navigator.clipboard.writeText(url);
    notify('URL copiato!', 'L\'URL API della risorsa è stato copiato negli appunti.', { state: 'success', duration: 3000 });
  };

  // Filtra i dati in base ai filtri impostati
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];
    
    let filtered = data.records;
    
    // Filtra per ricerca testuale globale
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(row => {
        return data.fields?.slice(1).some(field => {
          const value = row[field.id];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      });
    }
    
    // Filtra per colonna specifica
    Object.entries(filters).forEach(([fieldId, filterValue]) => {
      if (filterValue.trim()) {
        const filterLower = filterValue.toLowerCase();
        filtered = filtered.filter(row => {
          const value = row[fieldId];
          return value && String(value).toLowerCase().includes(filterLower);
        });
      }
    });
    
    return filtered;
  }, [data, filters, searchText]);

  const handleFilterChange = (fieldId, value) => {
    setFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
    setPage(0);
  };

  const hasActiveFilters = searchText.trim() || Object.values(filters).some(v => v.trim());

  // Calcola l'URL endpoint API
  const apiEndpoint = useMemo(() => {
    const baseUrl = CKAN_BASE_URL.replace('/api/3/action', '');
    return `${baseUrl}/api/3/action/datastore_search?resource_id=${id}`;
  }, [id]);

  if (loading) return (
    <Container>
      <div className="text-center my-5 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="text-muted fw-semibold">Caricamento risorsa in corso...</p>
        </div>
      </div>
    </Container>
  );
  if (error) return <Container><div className="alert alert-danger mt-4">{error}</div></Container>;
  
  const isGeoJSON = resource?.format?.toLowerCase() === 'geojson' || 
                    (resource?.format?.toLowerCase() === 'json' && resource?.url?.includes('geojson'));
  
  if (!data && !isGeoJSON) return <Container><div className="alert alert-warning mt-4">Risorsa non trovata o non tabellare.</div></Container>;

  return (
    <Container className="my-4">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' }, 
        { label: 'Catalogo', to: '/catalogo' }, 
        ...(dataset ? [{ label: dataset.title, to: `/dataset/${dataset.id}` }] : []),
        { label: resource?.name || 'Risorsa' }
      ]} />
      
      {/* Header Risorsa */}
      <Row className="mb-4">
        <Col lg={12}>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="mb-2" style={{ fontSize: '2rem' }}>{resource?.name || 'Risorsa'}</h1>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <Badge 
                  color="secondary" 
                  className="text-uppercase"
                  style={{ cursor: data ? 'pointer' : 'default' }}
                  onClick={() => data && document.getElementById('export-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {resource?.format || 'N/D'}
                </Badge>
                {data && (
                  <>
                    <Badge 
                      color="primary" 
                      className="d-flex align-items-center gap-1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('api-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                      <Icon icon="it-code-circle" size="xs" color="white" />
                      API
                    </Badge>
                    {resource?.format?.toUpperCase() !== 'CSV' && (
                      <Badge 
                        color="success" 
                        className="text-uppercase"
                        style={{ cursor: 'pointer' }}
                        onClick={() => document.getElementById('export-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      >
                        CSV
                      </Badge>
                    )}
                    <Badge 
                      color="success" 
                      className="text-uppercase"
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('export-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                      TSV
                    </Badge>
                    <Badge 
                      color="success" 
                      className="text-uppercase"
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('export-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                      JSON
                    </Badge>
                    <Badge 
                      color="success" 
                      className="text-uppercase"
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('export-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                      XML
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Descrizione */}
      {resource?.description && (
        <section className="py-4">
          <div className="markdown-content">
            <ReactMarkdown>{resource.description}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Sezioni */}
      <Row>
        <Col lg={12}>
          {data && (
            <>
              {/* Tabella Dati */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-search" size="sm" className="me-2" />
                  Esploratore
                </h5>

                {/* Barra di ricerca globale e filtri */}
                <Card className="shadow-sm border-primary mb-4" style={{ borderWidth: '2px' }}>
                  <CardBody className="p-4">
                    <Row className="align-items-end">
                      <Col md={hasActiveFilters ? 9 : 12}>
                        <FormGroup className="mb-0">
                          <Label htmlFor="global-search" className="fw-semibold">
                            Ricerca nei dati
                          </Label>
                          <Input
                            id="global-search"
                            type="text"
                            placeholder="Cerca in tutti i campi della tabella..."
                            value={searchText}
                            onChange={(e) => {
                              setSearchText(e.target.value);
                              setPage(0);
                            }}
                          />
                        </FormGroup>
                      </Col>
                      {hasActiveFilters && (
                        <Col md={3}>
                          <Button 
                            color="danger" 
                            outline 
                            block
                            onClick={clearAllFilters}
                            className="mb-0"
                          >
                            <Icon icon="it-close" size="sm" color="danger" className="me-2" />
                            Cancella filtri
                          </Button>
                        </Col>
                      )}
                    </Row>
                    
                    {hasActiveFilters && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted d-flex align-items-center">
                          <Icon icon="it-funnel" size="xs" className="me-2" />
                          <strong>Filtri attivi:</strong>
                          <span className="ms-2">
                            {searchText && `Ricerca globale: "${searchText}"`}
                            {searchText && Object.values(filters).some(v => v.trim()) && ', '}
                            {Object.entries(filters).filter(([_, v]) => v.trim()).length > 0 && 
                              `${Object.entries(filters).filter(([_, v]) => v.trim()).length} filtro/i per colonna`}
                          </span>
                        </small>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <div className="table-responsive" style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
                  <Table bordered size="sm" hover className="mb-0 bg-white">
                    <thead className="table-primary" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        {data.fields?.slice(1).map(f => (
                          <th key={f.id} className="px-3 py-2" style={{ minWidth: '150px' }}>
                            <div className="text-nowrap mb-2 fw-bold">{f.id}</div>
                            <Input
                              type="text"
                              size="sm"
                              placeholder={`Filtra ${f.id}...`}
                              value={filters[f.id] || ''}
                              onChange={(e) => handleFilterChange(f.id, e.target.value)}
                              className="form-control-sm"
                              style={{ fontSize: '0.75rem' }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((row, idx) => (
                          <tr key={idx}>
                            {data.fields?.slice(1).map(f => (
                              <td key={f.id} className="text-nowrap px-3 py-2" style={{ minWidth: '150px' }}>
                                {row[f.id]}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={data.fields?.length - 1 || 1} className="text-center py-4 text-muted">
                            <Icon icon="it-info-circle" className="me-2" />
                            Nessun record trovato con i filtri applicati
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                
                {/* Info risultati filtrati */}
                {hasActiveFilters && filteredRecords.length > 0 && (
                  <div className="mt-3">
                    <div className="alert alert-info mb-0" role="alert">
                      <strong>Risultati filtrati:</strong> visualizzati {filteredRecords.length} record su {data.total} totali
                    </div>
                  </div>
                )}
                
                {/* Paginazione - mostra solo se ci sono più di 500 record */}
                {data.total > 500 && (
                  <Card className="shadow-sm border-0 mt-4">
                    <CardBody className="p-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <Button 
                          color="primary" 
                          outline
                          size="sm"
                          disabled={page === 0} 
                          onClick={() => setPage(p => p - 1)}
                        >
                          <Icon icon="it-arrow-left" size="sm" className="me-1" />
                          Precedente
                        </Button>
                        
                        <div className="text-muted small">
                          Record <strong className="text-dark">{page * limit + 1} - {Math.min((page + 1) * limit, data.total)}</strong> di <strong className="text-dark">{data.total.toLocaleString()}</strong>
                        </div>
                        
                        <Button 
                          color="primary" 
                          outline
                          size="sm"
                          disabled={(page + 1) * limit >= data.total} 
                          onClick={() => setPage(p => p + 1)}
                        >
                          Successivo
                          <Icon icon="it-arrow-right" size="sm" className="ms-1" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                )}

              </section>

              {/* Info Risorsa */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-info-circle" size="sm" className="me-2" />
                  Informazioni
                </h5>
                
                <Card className="shadow-sm border-0">
                  <CardBody className="p-4">
                    <Row className="g-4">
                      <Col md={6}>
                        <div className="d-flex align-items-start">
                          <Icon icon="it-password-visible" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                              ID Risorsa
                            </div>
                            <code className="d-block bg-light p-2 rounded text-break small">{id}</code>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex align-items-start">
                          <Icon icon="it-chart-line" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                              Totale Record
                            </div>
                            <div className="h4 mb-0 text-primary fw-bold">{data.total.toLocaleString()}</div>
                          </div>
                        </div>
                      </Col>
                      {resource?.created && (
                        <Col md={6}>
                          <div className="d-flex align-items-start">
                            <Icon icon="it-calendar" size="sm" color="primary" className="me-3 mt-1" />
                            <div className="flex-grow-1">
                              <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                Data Creazione
                              </div>
                              <div className="small">{new Date(resource.created).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                          </div>
                        </Col>
                      )}
                      {resource?.last_modified && (
                        <Col md={6}>
                          <div className="d-flex align-items-start">
                            <Icon icon="it-refresh" size="sm" color="primary" className="me-3 mt-1" />
                            <div className="flex-grow-1">
                              <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                Ultima Modifica
                              </div>
                              <div className="small">{new Date(resource.last_modified).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </CardBody>
                </Card>
              </section>

              {/* Data Dictionary */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-bookmark" size="sm" className="me-2" />
                  Dizionario dei dati
                </h5>
                <Card className="shadow-sm border-0">
                  <CardBody className="p-0">
                    <div className="table-responsive">
                      <Table className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="px-4 py-3" style={{ width: '30%' }}>
                              <Icon icon="it-folder" size="xs" className="me-2" />
                              Nome Colonna
                            </th>
                            <th className="px-4 py-3" style={{ width: '15%', whiteSpace: 'nowrap' }}>
                              <Icon icon="it-code-circle" size="xs" className="me-2" />
                              Tipo Dato
                            </th>
                            <th className="px-4 py-3" style={{ width: '55%' }}>
                              <Icon icon="it-info-circle" size="xs" className="me-2" />
                              Descrizione
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.fields?.slice(1).map(f => (
                            <tr key={f.id}>
                              <td className="px-4 py-3" style={{ wordBreak: 'break-word' }}><strong>{f.id}</strong></td>
                              <td className="px-4 py-3" style={{ whiteSpace: 'nowrap' }}>
                                <Badge color="secondary" className="font-monospace">
                                  {f.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-muted">{f.info?.notes || '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </section>

              {/* Esporta */}
              <section className="mb-5" id="export-section">
                <h5 className="mb-3">
                  <Icon icon="it-download" size="sm" className="me-2" />
                  Esporta i dati
                </h5>
                
                <Row className="g-3">
                  <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="p-4">
                        <div className="d-flex align-items-start mb-3">
                          <Icon icon="it-file" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <CardTitle tag="h6" className="fw-bold mb-2">CSV</CardTitle>
                            <CardText className="small text-muted mb-3">
                              Comma-Separated Values con BOM, compatibile con Excel
                            </CardText>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <a 
                            href={`/datastore/dump/${id}?bom=true`}
                            className="btn btn-primary w-100"
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <Icon icon="it-download" size="sm" color="white" className="me-2" aria-hidden="true" />
                            Scarica CSV
                          </a>
                          <Button 
                            color="primary" 
                            outline 
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              const url = `${window.location.origin}/datastore/dump/${id}?bom=true`;
                              navigator.clipboard.writeText(url);
                              notify('URL copiato!', 'L\'URL del file CSV è stato copiato negli appunti.', { state: 'success', duration: 3000 });
                            }}
                          >
                            <Icon icon="it-copy" size="sm" className="me-2" />
                            Copia URL
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="p-4">
                        <div className="d-flex align-items-start mb-3">
                          <Icon icon="it-file" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <CardTitle tag="h6" className="fw-bold mb-2">TSV</CardTitle>
                            <CardText className="small text-muted mb-3">
                              Tab-Separated Values con BOM, alternativa a CSV
                            </CardText>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <a 
                            href={`/datastore/dump/${id}?format=tsv&bom=true`}
                            className="btn btn-primary w-100"
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <Icon icon="it-download" size="sm" color="white" className="me-2" aria-hidden="true" />
                            Scarica TSV
                          </a>
                          <Button 
                            color="primary" 
                            outline 
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              const url = `${window.location.origin}/datastore/dump/${id}?format=tsv&bom=true`;
                              navigator.clipboard.writeText(url);
                              notify('URL copiato!', 'L\'URL del file TSV è stato copiato negli appunti.', { state: 'success', duration: 3000 });
                            }}
                          >
                            <Icon icon="it-copy" size="sm" className="me-2" />
                            Copia URL
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="p-4">
                        <div className="d-flex align-items-start mb-3">
                          <Icon icon="it-code-circle" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <CardTitle tag="h6" className="fw-bold mb-2">JSON</CardTitle>
                            <CardText className="small text-muted mb-3">
                              JavaScript Object Notation, ideale per applicazioni e API
                            </CardText>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <a 
                            href={`/datastore/dump/${id}?format=json`}
                            className="btn btn-primary w-100"
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <Icon icon="it-download" size="sm" color="white" className="me-2" aria-hidden="true" />
                            Scarica JSON
                          </a>
                          <Button 
                            color="primary" 
                            outline 
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              const url = `${window.location.origin}/datastore/dump/${id}?format=json`;
                              navigator.clipboard.writeText(url);
                              notify('URL copiato!', 'L\'URL del file JSON è stato copiato negli appunti.', { state: 'success', duration: 3000 });
                            }}
                          >
                            <Icon icon="it-copy" size="sm" className="me-2" />
                            Copia URL
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="p-4">
                        <div className="d-flex align-items-start mb-3">
                          <Icon icon="it-code-circle" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <CardTitle tag="h6" className="fw-bold mb-2">XML</CardTitle>
                            <CardText className="small text-muted mb-3">
                              Extensible Markup Language, standard per lo scambio dati
                            </CardText>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <a 
                            href={`/datastore/dump/${id}?format=xml`}
                            className="btn btn-primary w-100"
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <Icon icon="it-download" size="sm" color="white" className="me-2" aria-hidden="true" />
                            Scarica XML
                          </a>
                          <Button 
                            color="primary" 
                            outline 
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              const url = `${window.location.origin}/datastore/dump/${id}?format=xml`;
                              navigator.clipboard.writeText(url);
                              notify('URL copiato!', 'L\'URL del file XML è stato copiato negli appunti.', { state: 'success', duration: 3000 });
                            }}
                          >
                            <Icon icon="it-copy" size="sm" className="me-2" />
                            Copia URL
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* API */}
              <section className="mb-5" id="api-section">
                <h5 className="mb-3">
                  <Icon icon="it-code-circle" size="sm" className="me-2" />
                  API
                </h5>
                
                <Card className="shadow-sm border-0 mb-3">
                  <CardBody className="p-4">
                    <p className="mb-4">
                      Accedi ai dati di questa risorsa tramite API. Puoi cercare, filtrare e interrogare i dati senza scaricare l'intero file.
                    </p>

                    {/* Endpoint base */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <Icon icon="it-link" size="xs" className="me-2" />
                        Endpoint base
                      </h6>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <code className="flex-grow-1 bg-light p-3 rounded text-break small mb-0">
                          GET {apiEndpoint}
                        </code>
                        <Button color="primary" outline size="sm" onClick={handleCopy}>
                          <Icon icon="it-copy" size="sm" className="me-1" />
                          Copia
                        </Button>
                      </div>
                      <small className="text-muted">Recupera i primi 100 record della risorsa</small>
                    </div>

                    {/* Esempi di query */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <Icon icon="it-settings" size="xs" className="me-2" />
                        Parametri disponibili
                      </h6>
                      <div className="table-responsive">
                        <Table size="sm" className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '20%' }}>Parametro</th>
                              <th style={{ width: '15%' }}>Tipo</th>
                              <th style={{ width: '65%' }}>Descrizione</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><code className="small">resource_id</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string</Badge></td>
                              <td>ID o alias della risorsa da interrogare (obbligatorio)</td>
                            </tr>
                            <tr>
                              <td><code className="small">limit</code></td>
                              <td><Badge color="secondary" className="font-monospace small">int</Badge></td>
                              <td>Numero massimo di record da restituire (default: 100, max: 32000)</td>
                            </tr>
                            <tr>
                              <td><code className="small">offset</code></td>
                              <td><Badge color="secondary" className="font-monospace small">int</Badge></td>
                              <td>Numero di record da saltare per la paginazione</td>
                            </tr>
                            <tr>
                              <td><code className="small">fields</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string</Badge></td>
                              <td>Campi da restituire, separati da virgola (es: campo1,campo2)</td>
                            </tr>
                            <tr>
                              <td><code className="small">filters</code></td>
                              <td><Badge color="secondary" className="font-monospace small">json</Badge></td>
                              <td>Filtri di uguaglianza (es: {`{"campo": "valore", "campo2": "valore2"}`})</td>
                            </tr>
                            <tr>
                              <td><code className="small">q</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string/json</Badge></td>
                              <td>Ricerca full-text: stringa per cercare in tutti i campi o JSON per cercare in campi specifici</td>
                            </tr>
                            <tr>
                              <td><code className="small">full_text</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string</Badge></td>
                              <td>Ricerca full-text su tutti i campi (alternativa a q come stringa)</td>
                            </tr>
                            <tr>
                              <td><code className="small">plain</code></td>
                              <td><Badge color="secondary" className="font-monospace small">bool</Badge></td>
                              <td>Tratta la query come testo semplice (default: true)</td>
                            </tr>
                            <tr>
                              <td><code className="small">language</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string</Badge></td>
                              <td>Lingua della ricerca full-text (default: english)</td>
                            </tr>
                            <tr>
                              <td><code className="small">sort</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string</Badge></td>
                              <td>Ordinamento per campo (es: "campo asc, campo2 desc")</td>
                            </tr>
                            <tr>
                              <td><code className="small">distinct</code></td>
                              <td><Badge color="secondary" className="font-monospace small">bool</Badge></td>
                              <td>Restituisce solo righe distinte (default: false)</td>
                            </tr>
                            <tr>
                              <td><code className="small">include_total</code></td>
                              <td><Badge color="secondary" className="font-monospace small">bool</Badge></td>
                              <td>Includi il conteggio totale dei record (default: true)</td>
                            </tr>
                            <tr>
                              <td><code className="small">total_estimation_threshold</code></td>
                              <td><Badge color="secondary" className="font-monospace small">int</Badge></td>
                              <td>Soglia sopra la quale viene restituita una stima del totale invece del conteggio preciso</td>
                            </tr>
                            <tr>
                              <td><code className="small">records_format</code></td>
                              <td><Badge color="secondary" className="font-monospace small">string</Badge></td>
                              <td>Formato dei record: objects (default), lists, csv, tsv</td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </div>

                    {/* Esempi pratici */}
                    <div>
                      <h6 className="fw-bold mb-3">
                        <Icon icon="it-bookmark" size="xs" className="me-2" />
                        Esempi di utilizzo
                      </h6>
                      
                      {/* Esempio 1: Limit */}
                      <Card className="bg-light border-0 mb-3">
                        <CardBody className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong className="small">Limitare i risultati a 10 record</strong>
                            <Button 
                              color="primary" 
                              size="sm" 
                              outline
                              onClick={() => {
                                const url = `${apiEndpoint}&limit=10`;
                                window.open(url, '_blank');
                              }}
                            >
                              <Icon icon="it-external-link" size="xs" className="me-1" />
                              Prova
                            </Button>
                          </div>
                          <code className="d-block small text-break">
                            {apiEndpoint}&limit=10
                          </code>
                        </CardBody>
                      </Card>

                      {/* Esempio 2: Offset e paginazione */}
                      <Card className="bg-light border-0 mb-3">
                        <CardBody className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong className="small">Paginazione: seconda pagina (record 11-20)</strong>
                            <Button 
                              color="primary" 
                              size="sm" 
                              outline
                              onClick={() => {
                                const url = `${apiEndpoint}&limit=10&offset=10`;
                                window.open(url, '_blank');
                              }}
                            >
                              <Icon icon="it-external-link" size="xs" className="me-1" />
                              Prova
                            </Button>
                          </div>
                          <code className="d-block small text-break">
                            {apiEndpoint}&limit=10&offset=10
                          </code>
                        </CardBody>
                      </Card>

                      {/* Esempio 3: Campi specifici */}
                      {data.fields && data.fields.length > 2 && (
                        <Card className="bg-light border-0 mb-3">
                          <CardBody className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <strong className="small">Selezionare solo i primi 2 campi</strong>
                              <Button 
                                color="primary" 
                                size="sm" 
                                outline
                                onClick={() => {
                                  const fields = data.fields.slice(1, 3).map(f => f.id).join(',');
                                  const url = `${apiEndpoint}&fields=${fields}&limit=5`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <Icon icon="it-external-link" size="xs" className="me-1" />
                                Prova
                              </Button>
                            </div>
                            <code className="d-block small text-break">
                              {apiEndpoint}&fields={data.fields.slice(1, 3).map(f => f.id).join(',')}&limit=5
                            </code>
                          </CardBody>
                        </Card>
                      )}

                      {/* Esempio 4: Ordinamento */}
                      {data.fields && data.fields.length > 1 && (
                        <Card className="bg-light border-0 mb-3">
                          <CardBody className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <strong className="small">Ordinare per {data.fields[1].id} (decrescente)</strong>
                              <Button 
                                color="primary" 
                                size="sm" 
                                outline
                                onClick={() => {
                                  const url = `${apiEndpoint}&sort=${encodeURIComponent(data.fields[1].id + ' desc')}&limit=10`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <Icon icon="it-external-link" size="xs" className="me-1" />
                                Prova
                              </Button>
                            </div>
                            <code className="d-block small text-break">
                              {apiEndpoint}&sort={data.fields[1].id}%20desc&limit=10
                            </code>
                          </CardBody>
                        </Card>
                      )}

                      <div className="alert alert-info mb-0" role="alert">
                        <strong>Nota:</strong> Tutti gli esempi aprono la risposta JSON in una nuova scheda. Per maggiori dettagli consulta la{' '}
                        <a href="https://docs.ckan.org/en/2.10/maintaining/datastore.html#the-data-api" target="_blank" rel="noreferrer" className="alert-link">
                          documentazione ufficiale
                        </a>.
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </section>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
