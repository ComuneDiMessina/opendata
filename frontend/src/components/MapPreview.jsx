import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'design-react-kit';

export default function MapPreview({ resourceUrl }) {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [corsError, setCorsError] = useState(false);

  useEffect(() => {
    async function loadGeoJSON() {
      try {
        // Carica il GeoJSON dall'URL della risorsa
        const response = await fetch(resourceUrl);
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento del GeoJSON');
        }
        
        const data = await response.json();
        
        // Verifica se è un GeoJSON valido
        if (data && (data.type === 'FeatureCollection' || data.type === 'Feature')) {
          setGeoData(data);
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
            throw new Error('Nessun dato geografico trovato nella risorsa');
          }
        } else {
          throw new Error('Formato non supportato per la visualizzazione su mappa');
        }
      } catch (err) {
        // Verifica se è un errore CORS
        if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
          setCorsError(true);
          setError('Il file non può essere caricato direttamente a causa di restrizioni CORS. Scarica il file e caricalo manualmente.');
        } else {
          setError(err.message);
        }
        console.error('Errore caricamento GeoJSON:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadGeoJSON();
  }, [resourceUrl]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Verifica se è un GeoJSON valido
        if (data && (data.type === 'FeatureCollection' || data.type === 'Feature')) {
          setGeoData(data);
          setError(null);
          setCorsError(false);
        } else if (Array.isArray(data) && data.length > 0) {
          // Conversione da array a GeoJSON
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
            setError(null);
            setCorsError(false);
          } else {
            setError('Nessun dato geografico trovato nel file');
          }
        } else {
          setError('Formato file non valido');
        }
      } catch (err) {
        setError('Errore nella lettura del file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

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
    return (
      <div>
        <div className="alert alert-warning" role="alert">
          <Icon icon="it-info-circle" className="me-2" />
          {error}
        </div>
        {corsError && (
          <div className="p-4 border rounded-3 bg-light">
            <h6 className="mb-3">
              <Icon icon="it-upload" className="me-2" />
              Carica il file manualmente
            </h6>
            <div className="mb-3">
              <p className="small text-muted mb-2">
                1. Scarica prima il file GeoJSON dal link seguente:
              </p>
              <a 
                href={resourceUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-sm btn-primary mb-3"
              >
                <Icon icon="it-download" className="me-2" />
                Scarica file GeoJSON
              </a>
            </div>
            <div>
              <p className="small text-muted mb-2">
                2. Poi carica il file scaricato per visualizzarlo sulla mappa:
              </p>
              <input 
                type="file" 
                accept=".geojson,.json"
                onChange={handleFileUpload}
                className="form-control"
              />
            </div>
          </div>
        )}
      </div>
    );
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
    <div className="border rounded-3 overflow-hidden shadow-sm">
      <MapContainer
        center={getMapCenter()}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              // Crea popup con le proprietà
              const popupContent = Object.entries(feature.properties)
                .filter(([key]) => key !== 'geometry' && key !== 'geometria')
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br/>');
              if (popupContent) {
                layer.bindPopup(popupContent);
              }
            }
          }}
        />
      </MapContainer>
    </div>
  );
}
