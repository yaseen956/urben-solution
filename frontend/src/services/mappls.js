import { mappls, mappls_plugin } from 'mappls-web-maps';

const mapplsClassObject = new mappls();
const mapplsPluginObject = new mappls_plugin();

let scriptPromise = null;

export const getMapplsApiKey = () => import.meta.env.VITE_MAPPLS_API_KEY;
export const getMapplsScriptUrl = () => {
  const key = getMapplsApiKey();
  if (!key || !String(key).trim()) return '';
  return `https://apis.mappls.com/advancedmaps/api/${String(key).trim()}/map_sdk?layer=vector&v=3.0`;
};

export const loadMapplsScript = () => {
  const key = getMapplsApiKey();
  if (!key || !String(key).trim()) {
    console.error('Mappls API key missing');
    return Promise.resolve(null);
  }

  if (window.mappls) return Promise.resolve(window.mappls);
  if (scriptPromise) return scriptPromise;

  const scriptUrl = getMapplsScriptUrl();

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-mappls-sdk="true"]');
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.dataset.mapplsSdk = 'true';

    script.onload = () => {
      console.log('Mappls SDK loaded');
      resolve();
    };

    script.onerror = () => {
      console.error('Mappls SDK failed to load');
      scriptPromise = null;
      reject(new Error('Mappls SDK failed to load'));
    };

    document.body.appendChild(script);

    window.setTimeout(() => {
      if (!window.mappls) {
        console.error('Mappls SDK failed to load');
      }
    }, 5000);
  });

  return scriptPromise;
};

export const initializeMappls = async () => {
  const key = getMapplsApiKey();
  if (!key || !String(key).trim()) {
    console.error('Mappls API key missing');
    return null;
  }

  await loadMapplsScript();

  if (!window.mappls) {
    console.error('Mappls not loaded');
    return null;
  }

  return {
    mapplsClassObject,
    mapplsPluginObject,
    key: String(key).trim()
  };
};

export const markerIcon = (color, label) => {
  const safeLabel = (label || '').slice(0, 1).toUpperCase() || 'M';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <path fill="${color}" d="M17 0c9.389 0 17 7.611 17 17 0 12.402-17 29-17 29S0 29.402 0 17C0 7.611 7.611 0 17 0z"/>
      <circle cx="17" cy="17" r="11" fill="white"/>
      <text x="17" y="21" font-size="12" text-anchor="middle" font-family="Arial, sans-serif" fill="${color}" font-weight="700">${safeLabel}</text>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    width: 34,
    height: 46
  };
};

