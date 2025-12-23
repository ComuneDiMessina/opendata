import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import { Icon } from 'design-react-kit';

export default function MapPreview({ resourceUrl, resourceId, packageId, onLoadError }) {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = React.useRef(null);
  const containerRef = React.useRef(null);

  // Observer per rilevare quando il componente diventa visibile
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && mapRef.current) {
            // Quando diventa visibile, forza il resize della mappa
            setTimeout(() => {
              mapRef.current.invalidateSize();
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [geoData]);

  // Gestione del resize della mappa quando entra/esce dal fullscreen
  useEffect(() => {
    if (mapRef.current) {
      // Forza il ridimensionamento della mappa dopo un breve delay
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
      
      // Aggiunge un secondo tentativo per risolvere problemi di rendering
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [isFullscreen, geoData]);

  // Gestione tasto ESC per uscire dal fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    // Previeni lo scroll della pagina quando in fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    async function loadGeoJSON() {
      try {
        let data = null;
        let dataLoaded = false;
        
        // Prova prima con il proxy CKAN se disponibile
        if (resourceId && packageId) {
          try {
            const proxyUrl = `${window.location.origin}/dataset/${packageId}/resource/${resourceId}/download`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              // Verifica che sia JSON e non HTML
              if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                dataLoaded = true;
                console.log('Dati caricati tramite proxy CKAN');
              } else {
                console.log('Proxy CKAN ha restituito contenuto non-JSON, provo URL diretto');
              }
            }
          } catch (proxyError) {
            console.log('Proxy CKAN non disponibile, provo con URL diretto:', proxyError.message);
          }
        }
        
        // Se il proxy non ha funzionato, prova con l'URL diretto
        if (!dataLoaded && resourceUrl) {
          console.log('Caricamento da URL diretto:', resourceUrl);
          const response = await fetch(resourceUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json') && !contentType.includes('application/geo+json')) {
            console.warn('Content-Type potrebbe non essere JSON/GeoJSON:', contentType);
          }
          
          data = await response.json();
          console.log('Dati caricati da URL diretto, tipo:', data?.type || 'sconosciuto', 'features:', data?.features?.length || data?.length || 0);
        }
        
        if (!data) {
          throw new Error('Nessun dato caricato');
        }
        
        // Debug: mostra la struttura completa dei dati
        console.log('Struttura dati ricevuti:', {
          keys: Object.keys(data),
          hasResults: !!data.results,
          resultsIsArray: Array.isArray(data.results),
          resultsLength: data.results?.length,
          resultsType: typeof data.results,
          resultsKeys: data.results ? Object.keys(data.results).slice(0, 10) : null,
          firstResultKeys: data.results?.[0] ? Object.keys(data.results[0]) : null,
          firstResultSample: data.results?.[0]
        });
        
        // Controlla se è una risposta paginata CKAN (con results)
        if (data.results) {
          console.log('Trovato data.results, tipo:', typeof data.results);
          
          // Se results è un oggetto (non array), potrebbe essere direttamente il GeoJSON
          if (!Array.isArray(data.results) && typeof data.results === 'object') {
            console.log('data.results è un oggetto, lo uso direttamente');
            data = data.results;
          } else if (Array.isArray(data.results) && data.results.length > 0) {
            console.log('Risposta CKAN paginata con', data.results.length, 'risultati');
            const firstResult = data.results[0];
            console.log('Primo risultato:', firstResult);
            
            // Se results contiene un singolo elemento che è un GeoJSON completo
            if (data.results.length === 1 && (firstResult.type === 'FeatureCollection' || firstResult.features)) {
              console.log('Results[0] è un GeoJSON, lo uso direttamente');
              data = firstResult;
            } else if (firstResult.features) {
              // Se ogni elemento ha features, combinali
              console.log('Combino features da tutti i risultati');
              const allFeatures = data.results.flatMap(r => r.features || []);
              data = { type: 'FeatureCollection', features: allFeatures };
            } else {
              // Altrimenti, tratta results come l'array di dati da convertire
              console.log('Tratto results come array di dati geografici');
              data = data.results;
            }
          }
          console.log('Dati dopo elaborazione results:', { type: data?.type, featuresCount: data?.features?.length || data?.length });
        }
        
        // Verifica se è un GeoJSON valido
        if (data.type === 'FeatureCollection' || data.type === 'Feature') {
          console.log('GeoJSON valido con type:', data.type);
          setGeoData(data);
        } else if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          // Se ha un array "features" ma manca il "type", aggiungilo
          console.log('GeoJSON senza type, aggiungo FeatureCollection con', data.features.length, 'features');
          const geoJsonData = {
            type: 'FeatureCollection',
            features: data.features
          };
          setGeoData(geoJsonData);
        } else if (Array.isArray(data) && data.length > 0) {
          // Se è un array, potrebbe essere un formato CKAN datastore
          // Prova a convertirlo in GeoJSON se ha campi geometry/geometria o lat/lon
          const features = data
            .filter(item => item.geometry || item.geometria || (item.lat && item.lon))
            .map((item, idx) => {
              let geometry;
              if (item.geometry) {
                geometry = typeof item.geometry === 'string' ? JSON.parse(item.geometry) : item.geometry;
              } else if (item.geometria) {
                geometry = typeof item.geometria === 'string' ? JSON.parse(item.geometria) : item.geometria;
              } else if (item.lat && item.lon) {
                geometry = {
                  type: 'Point',
                  coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
                };
              }
              
              return {
                type: 'Feature',
                id: idx,
                geometry,
                properties: { ...item }
              };
            });
          
          if (features.length > 0) {
            setGeoData({
              type: 'FeatureCollection',
              features
            });
          } else {
            console.warn('Nessun dato geografico trovato nell\'array di', features.length, 'elementi');
            throw new Error('Nessun dato geografico trovato nella risorsa');
          }
        } else {
          console.error('Formato dati non riconosciuto:', {
            hasType: !!data?.type,
            type: data?.type,
            hasFeatures: !!data?.features,
            isArray: Array.isArray(data),
            keys: data ? Object.keys(data).slice(0, 10) : []
          });
          throw new Error('Formato non supportato per la visualizzazione su mappa');
        }
      } catch (err) {
        const errorMsg = err.message || 'Errore sconosciuto';
        console.error('Impossibile caricare il file GeoJSON:', errorMsg);
        console.error('Errore dettagliato:', err);
        // Non mostrare l'errore a schermo, solo in console
        setError(errorMsg);
        // Notifica il parent dell'errore se la callback è definita
        if (onLoadError) {
          onLoadError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (resourceUrl) {
      loadGeoJSON();
    }
  }, [resourceUrl, resourceId, packageId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento mappa...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // Non mostrare nulla se c'è un errore, solo log in console
    return null;
  }

  if (!geoData) {
    return null;
  }

  // Calcola il centro della mappa dai dati GeoJSON
  const getMapCenter = () => {
    if (!geoData || !geoData.features || geoData.features.length === 0) {
      return [38.1937, 15.5542]; // Messina default
    }
    
    const firstFeature = geoData.features[0];
    if (!firstFeature.geometry) return [38.1937, 15.5542];
    
    const geomType = firstFeature.geometry.type;
    const coords = firstFeature.geometry.coordinates;
    
    if (geomType === 'Point') {
      return [coords[1], coords[0]]; // [lat, lng]
    } else if (geomType === 'LineString' || geomType === 'MultiPoint') {
      const firstPoint = coords[0];
      return [firstPoint[1], firstPoint[0]];
    } else if (geomType === 'Polygon' || geomType === 'MultiLineString') {
      const firstPoint = coords[0][0];
      return [firstPoint[1], firstPoint[0]];
    } else if (geomType === 'MultiPolygon') {
      const firstPoint = coords[0][0][0];
      return [firstPoint[1], firstPoint[0]];
    }
    
    return [38.1937, 15.5542]; // Fallback
  };

  return (
    <>
      <div ref={containerRef} className={`map-preview-container ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Bottone fullscreen */}
        <button
          className="btn-fullscreen"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Esci da schermo intero" : "Visualizza a schermo intero"}
          aria-label={isFullscreen ? "Esci da schermo intero" : "Visualizza a schermo intero"}
        >
          <Icon 
            icon={isFullscreen ? "it-close-big" : "it-fullscreen"} 
            size="sm"
          />
        </button>

        <div className={isFullscreen ? '' : 'border rounded-3 overflow-hidden shadow-sm'}>
          <MapContainer
            ref={mapRef}
            center={getMapCenter()}
            zoom={13}
            style={{ 
              height: isFullscreen ? '100vh' : '500px', 
              width: '100%'
            }}
            scrollWheelZoom={true}
            whenReady={(mapInstance) => {
              mapRef.current = mapInstance.target;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <GeoJSON
              data={geoData}
              style={{
                color: '#0066cc',
            weight: 3,
            opacity: 0.7,
            fillColor: '#0066cc',
            fillOpacity: 0.3
          }}
          pointToLayer={(feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 8,
              fillColor: '#0066cc',
              color: '#004080',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.6
            });
          }}
          onEachFeature={(feature, layer) => {
            if (feature.properties) {
              // Crea popup con stile Bootstrap Italia
              const rows = Object.entries(feature.properties)
                .filter(([key]) => key !== 'geometry' && key !== 'geometria')
                .map(([key, value]) => {
                  // Formatta la chiave in modo leggibile (capitalizza e rimuovi underscore)
                  const formattedKey = key
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  return `
                    <div style="margin-bottom: 8px; line-height: 1.3;">
                      <div style="font-family: 'Titillium Web', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.2px; color: #435666; margin-bottom: 2px;">
                        ${formattedKey}
                      </div>
                      <div style="font-family: 'Titillium Web', sans-serif; font-size: 0.875rem; font-weight: 600; color: #17324d; word-break: break-word;">
                        ${value}
                      </div>
                    </div>
                  `;
                });
              
              if (rows.length > 0) {
                const popupContent = `
                  <div style="font-family: 'Titillium Web', sans-serif;">
                    ${rows.join('')}
                  </div>
                `;
                layer.bindPopup(popupContent, {
                  maxWidth: 280,
                  minWidth: 180,
                  maxHeight: 300,
                  className: 'italia-map-popup',
                  closeButton: true,
                  autoPan: true,
                  autoPanPadding: [40, 40],
                  keepInView: true
                });
              }
            }
          }}
        />
      </MapContainer>
        </div>
      </div>
    </>
  );
}
