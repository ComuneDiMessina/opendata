import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, Badge, Table, Icon, Row, Col, Accordion, AccordionHeader, AccordionBody, notify } from 'design-react-kit';
import { fetchPackageShow, fetchDatastoreSearch, fetchPackageSearch, enrichDatasetsWithOrgDetails } from '../api/ckan';
import Breadcrumbs from '../components/Breadcrumbs';
import DatasetCard from '../components/DatasetCard';
import ReactMarkdown from 'react-markdown';

export default function DettaglioDataset() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState({});
  const [collapseOpen, setCollapseOpen] = useState('');
  const [relatedDatasets, setRelatedDatasets] = useState([]);

  useEffect(() => {
    async function loadDataset() {
      try {
        const res = await fetchPackageShow(id);
        if (res.success) {
          setDataset(res.result);
          const tabularResources = res.result.resources.filter(r => r.datastore_active);
          const previewPromises = tabularResources.map(async r => {
            try {
              const preview = await fetchDatastoreSearch({ resource_id: r.id, limit: 5 });
              return [r.id, preview.success ? preview.result : null];
            } catch {
              return [r.id, null];
            }
          });
          const previewResults = await Promise.all(previewPromises);
          const previewsData = Object.fromEntries(previewResults);
          setPreviews(previewsData);
          
          // Logica di espansione automatica
          const resources = res.result.resources;
          if (resources.length === 1) {
            // Se c'è una sola risorsa, espandila
            setCollapseOpen(resources[0].id);
          } else if (resources.length === 2) {
            // Se ci sono due risorse, espandi quella con anteprima dati attiva
            const resourceWithPreview = resources.find(r => r.datastore_active && previewsData[r.id]);
            if (resourceWithPreview) {
              setCollapseOpen(resourceWithPreview.id);
            }
          }
          
          // Carica dataset correlati se il dataset ha gruppi
          if (res.result.groups && res.result.groups.length > 0) {
            const firstGroup = res.result.groups[0].name;
            const relatedRes = await fetchPackageSearch({ 
              fq: `groups:${firstGroup}`, 
              rows: 100 
            });
            
            if (relatedRes.success && relatedRes.result.results.length > 1) {
              // Filtra il dataset corrente e seleziona 3 casuali
              const others = relatedRes.result.results.filter(ds => ds.name !== res.result.name);
              const shuffled = others.sort(() => 0.5 - Math.random());
              const selectedDatasets = shuffled.slice(0, 3);
              // Arricchisci i dataset con i dettagli completi delle organizzazioni
              const enrichedDatasets = await enrichDatasetsWithOrgDetails(selectedDatasets);
              setRelatedDatasets(enrichedDatasets);
            }
          }
        }
      } catch (err) {
        setError('Errore nel caricamento del dataset');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, [id]);

  if (loading) return (
    <div className="container">
      <div className="text-center my-5 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="text-muted fw-semibold">Caricamento dataset in corso...</p>
        </div>
      </div>
    </div>
  );
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!dataset) return <div className="alert alert-warning">Dataset non trovato.</div>;

  // Determina se la descrizione è lunga (più di 300 caratteri o contiene caratteri markdown)
  const description = dataset.notes || '';
  const isLongDescription = description.length > 300 || /[#*\[\]`]/.test(description);

  return (
    <div className="container">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' }, 
        { label: 'Catalogo', to: '/catalogo' }, 
        { label: dataset.title }
      ]} />
      
      {/* Header Section */}
      <section className="py-4 border-bottom">
        <h1 className="mb-3" style={{ fontSize: '2rem' }}>
          <Icon icon="it-file" className="me-2" />
          {dataset.title}
        </h1>
        
        {!isLongDescription && description && (
          <p className="lead text-muted">{description}</p>
        )}
        
        <div className="mt-3">
          {dataset.groups?.map(g => (
            <Link 
              key={g.name} 
              to={`/catalogo?tema=${g.name}`}
              className="badge bg-primary text-white text-decoration-none me-2 mb-2"
            >
              <Icon icon="it-folder" size="sm" color="white" className="me-1" />
              {g.display_name}
            </Link>
          ))}
        </div>
      </section>

      {/* Descrizione completa se troppo lunga */}
      {isLongDescription && description && (
        <section className="py-4 border-bottom">
          <div className="markdown-content">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </section>
      )}

      <Row className="mt-4">
        {/* Metadata Section */}
        <Col lg={4}>
          <Card className="shadow-sm mb-4 sticky-top dataset-metadata-card" style={{ top: '2rem', marginTop: '1.1rem' }}>
            <div className="card-header bg-light border-bottom py-3 px-4">
              <h5 className="mb-0 fw-semibold">Informazioni Dataset</h5>
            </div>
            <CardBody className="p-0">
              <div className="dataset-info-item px-3 py-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-calendar" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Ultima modifica</div>
                    <div className="fw-normal">{new Date(dataset.metadata_modified).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              <div className="dataset-info-item px-3 py-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-calendar" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Creato il</div>
                    <div className="fw-normal">{new Date(dataset.metadata_created).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              {dataset.frequency && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-refresh" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Frequenza aggiornamento</div>
                      <div className="fw-normal">{dataset.frequency}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="dataset-info-item px-3 py-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-lock" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Licenza</div>
                    <div className="fw-normal">{dataset.license_title || 'Non disponibile'}</div>
                  </div>
                </div>
              </div>

              {dataset.organization && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-pa" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Ente titolare</div>
                      <div className="fw-normal">{dataset.organization.title}</div>
                    </div>
                  </div>
                </div>
              )}

              {dataset.author && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-user" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Autore</div>
                      <div className="fw-normal">{dataset.author}</div>
                    </div>
                  </div>
                </div>
              )}

              {dataset.maintainer && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-settings" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Referente tecnico</div>
                      <div className="fw-normal">{dataset.maintainer}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="dataset-info-item px-3 py-3">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-file" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Risorse disponibili</div>
                    <div className="fw-normal">{dataset.resources?.length || 0} file</div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Resources Section */}
        <Col lg={8}>
          <div className="mb-3">
            <h5 className="mb-0">
              <Icon icon="it-download" className="me-2" />
              Risorse ({dataset.resources?.length || 0})
            </h5>
          </div>
          
          <Accordion>
            {dataset.resources?.map((res, index) => (
              <Card key={res.id} className="mb-3 shadow-sm border-0">
                <AccordionHeader 
                  active={collapseOpen === res.id}
                  onToggle={() => setCollapseOpen(collapseOpen === res.id ? '' : res.id)}
                >
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center">
                        <Icon icon="it-file" className="me-2" />
                        <strong>{res.name || `Risorsa ${index + 1}`}</strong>
                      </div>
                      {/* Mostra il badge del formato originale solo se non è duplicato nei formati API */}
                      {(!res.datastore_active || !['CSV', 'TSV', 'JSON', 'XML'].includes(res.format?.toUpperCase())) && (
                        <Badge color="secondary" className="text-uppercase">{res.format}</Badge>
                      )}
                      {res.datastore_active && (
                        <>
                          <Badge color="primary" className="d-flex align-items-center gap-1">
                            <Icon icon="it-code-circle" size="xs" color="white" />
                            API
                          </Badge>
                          {res.format?.toUpperCase() !== 'CSV' && (
                            <Badge color="success" className="text-uppercase">CSV</Badge>
                          )}
                          <Badge color="success" className="text-uppercase">TSV</Badge>
                          <Badge color="success" className="text-uppercase">JSON</Badge>
                          <Badge color="success" className="text-uppercase">XML</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </AccordionHeader>
                
                <AccordionBody active={collapseOpen === res.id}>
                  {res.description && (
                    <p className="text-muted small mb-3">{res.description}</p>
                  )}
                  
                  {res.datastore_active && previews[res.id] && (
                    <div className="mb-3">
                      <h6 className="mb-3">
                        <Icon icon="it-search" size="sm" className="me-2" />
                        Anteprima dati
                      </h6>
                      <div className="border rounded p-3 bg-light">
                        <div className="table-responsive" style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
                          <Table bordered size="sm" hover className="mb-0 bg-white">
                            <thead className="table-primary" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                              <tr>
                                {previews[res.id].fields?.slice(1).map(f => (
                                  <th key={f.id} className="text-nowrap px-3 py-2" style={{ minWidth: '150px' }}>
                                    {f.id}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previews[res.id].records?.slice(0, 5).map((row, idx) => (
                                <tr key={idx}>
                                  {previews[res.id].fields?.slice(1).map(f => (
                                    <td key={f.id} className="text-nowrap px-3 py-2" style={{ minWidth: '150px' }}>
                                      {row[f.id]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                        <div className="mt-3 pt-3 border-top">
                          <small className="text-muted d-block mb-3">
                            <Icon icon="it-info-circle" size="xs" className="me-1" />
                            Visualizzati i primi 5 record su {previews[res.id].total?.toLocaleString() || 0} totali
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-grid gap-2 d-md-flex mt-3">
                    <a 
                      href={res.url} 
                      className="btn btn-primary btn-sm" 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Icon icon="it-download" size="sm" color="white" className="me-2" />
                      Scarica risorsa
                    </a>
                    
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(res.url);
                        notify('URL copiato!', 'L\'URL della risorsa è stato copiato negli appunti.', { state: 'success', duration: 3000 });
                      }}
                    >
                      <Icon icon="it-copy" size="sm" color="primary" className="me-2" />
                      Copia URL
                    </button>
                    
                    {res.datastore_active && (
                      <Link 
                        to={`/risorsa/${res.id}`} 
                        className="btn btn-outline-primary btn-sm"
                      >
                        <Icon icon="it-chart-line" size="sm" color="primary" className="me-2" />
                        Visualizza e analizza
                      </Link>
                    )}
                  </div>
                </AccordionBody>
              </Card>
            ))}
          </Accordion>
        </Col>
      </Row>

      {/* Sezione Dataset Correlati */}
      {relatedDatasets.length > 0 && (
        <section className="mt-5 pt-4 border-top d-none d-md-block">
          <h4 className="mb-4">
            <Icon icon="it-folder" className="me-2" />
            Ti potrebbe interessare anche
          </h4>
          <Row>
            {relatedDatasets.map(ds => (
              <Col key={ds.id} md={6} lg={4} className="mb-4">
                <DatasetCard dataset={ds} />
              </Col>
            ))}
          </Row>
        </section>
      )}
      
      {/* Sezione Dataset Correlati Mobile */}
      {relatedDatasets.length > 0 && (
        <section className="mt-5 pt-4 d-md-none">
          <h4 className="mb-4">
            <Icon icon="it-folder" className="me-2" />
            Ti potrebbe interessare anche
          </h4>
          <Row>
            {relatedDatasets.map(ds => (
              <Col key={ds.id} md={6} lg={4} className="mb-4">
                <DatasetCard dataset={ds} />
              </Col>
            ))}
          </Row>
        </section>
      )}
    </div>
  );
}
