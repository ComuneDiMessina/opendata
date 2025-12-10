import { CKAN_BASE_URL } from '../config';

// Funzioni base per chiamate API CKAN
export async function fetchPackageList() {
  const res = await fetch(`${CKAN_BASE_URL}/package_list`);
  return res.json();
}

export async function fetchPackageShow(id) {
  const res = await fetch(`${CKAN_BASE_URL}/package_show?id=${encodeURIComponent(id)}`);
  return res.json();
}

export async function fetchCurrentPackageListWithResources(limit = 20, offset = 0) {
  const res = await fetch(`${CKAN_BASE_URL}/current_package_list_with_resources?limit=${limit}&offset=${offset}`);
  return res.json();
}

export async function fetchPackageSearch({ q = '', rows = 20, start = 0, sort = '', fq = '' }) {
  const params = new URLSearchParams({ q, rows, start, sort });
  if (fq) {
    params.append('fq', fq);
  }
  const res = await fetch(`${CKAN_BASE_URL}/package_search?${params}`);
  return res.json();
}

export async function fetchGroupList() {
  const res = await fetch(`${CKAN_BASE_URL}/group_list`);
  return res.json();
}

export async function fetchGroupShow(id) {
  const res = await fetch(`${CKAN_BASE_URL}/group_show?id=${encodeURIComponent(id)}`);
  return res.json();
}

export async function fetchOrganizationList() {
  const res = await fetch(`${CKAN_BASE_URL}/organization_list`);
  return res.json();
}

export async function fetchOrganizationShow(id) {
  const res = await fetch(`${CKAN_BASE_URL}/organization_show?id=${encodeURIComponent(id)}`);
  return res.json();
}

export async function fetchTagList() {
  const res = await fetch(`${CKAN_BASE_URL}/tag_list`);
  return res.json();
}

export async function fetchLicenseList() {
  const res = await fetch(`${CKAN_BASE_URL}/license_list`);
  return res.json();
}

// DataStore API
export async function fetchDatastoreSearch({ resource_id, limit = 5, offset = 0, q = '', filters = {}, fields = [], sort = '' }) {
  const params = new URLSearchParams({ resource_id, limit, offset, q, sort });
  if (fields.length) params.append('fields', fields.join(','));
  if (filters && Object.keys(filters).length) params.append('filters', JSON.stringify(filters));
  const res = await fetch(`${CKAN_BASE_URL}/datastore_search?${params}`);
  return res.json();
}

export async function fetchDatastoreSearchSQL(sql) {
  const res = await fetch(`${CKAN_BASE_URL}/datastore_search_sql?sql=${encodeURIComponent(sql)}`);
  return res.json();
}

export async function fetchResourceShow(id) {
  const res = await fetch(`${CKAN_BASE_URL}/resource_show?id=${encodeURIComponent(id)}`);
  return res.json();
}

// Cache per le organizzazioni (in memoria durante la sessione)
const orgCache = new Map();

// Helper function per arricchire i dataset con i dettagli completi delle organizzazioni
export async function enrichDatasetsWithOrgDetails(datasets) {
  if (!datasets || datasets.length === 0) return datasets;
  
  // Ottieni lista organizzazioni uniche che non sono già in cache
  const orgIds = [...new Set(datasets
    .filter(ds => ds.organization)
    .map(ds => ds.organization.name || ds.organization.id)
  )].filter(id => !orgCache.has(id));
  
  // Carica solo le organizzazioni non in cache
  if (orgIds.length > 0) {
    const orgDetailsPromises = orgIds.map(id => 
      fetchOrganizationShow(id).catch(err => {
        console.warn(`Errore caricamento org ${id}:`, err);
        return { success: false };
      })
    );
    const orgDetailsResults = await Promise.all(orgDetailsPromises);
    
    // Aggiungi alla cache
    orgDetailsResults.forEach(result => {
      if (result.success) {
        const org = result.result;
        orgCache.set(org.id, org);
        orgCache.set(org.name, org);
      }
    });
  }
  
  // Arricchisci i dataset usando la cache
  return datasets.map(ds => {
    if (ds.organization) {
      const orgKey = ds.organization.name || ds.organization.id;
      const orgDetails = orgCache.get(orgKey);
      if (orgDetails) {
        return {
          ...ds,
          organization: orgDetails
        };
      }
    }
    return ds;
  });
}

// Funzione per pulire la cache (opzionale)
export function clearOrgCache() {
  orgCache.clear();
}
