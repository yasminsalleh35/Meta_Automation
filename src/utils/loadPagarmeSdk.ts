type SDKSource = {
  src: string;
  label: 'cdn-4x' | 'cdn-410' | 'local';
};

const SDK_SOURCES: SDKSource[] = [
  { src: 'https://assets.pagar.me/pagarme-js/4.x/pagarme.min.js', label: 'cdn-4x' },
  { src: 'https://assets.pagar.me/pagarme-js/4.10/pagarme.min.js', label: 'cdn-410' },
  { src: '/vendor/pagarme-js/4.10/pagarme.min.js', label: 'local' },
];

const LOAD_TIMEOUT = 8000; // 8 segundos por tentativa

let sdkPromise: Promise<SDKSource['label']> | null = null;

declare global {
  interface Window {
    pagarme?: any;
  }
}

function injectScript(src: string, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verifica se já existe script desta fonte
    if (document.querySelector(`script[data-sdk="pagarme"][data-src="${label}"]`)) {
      return resolve();
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.type = 'text/javascript'; // garantir script "clássico" (NÃO module)
    script.dataset.sdk = 'pagarme';
    script.dataset.src = label;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script onerror (${label})`));
    
    document.head.appendChild(script);
  });
}

async function tryLoadFromSource(source: SDKSource): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(`Timeout (${source.label})`)), LOAD_TIMEOUT)
  );

  await Promise.race([
    injectScript(source.src, source.label),
    timeoutPromise
  ]);

  // Verifica se o global pagarme foi definido (minúsculo no browser SDK)
  if (!window.pagarme?.client) {
    throw new Error(`Pagarme global missing after load (${source.label})`);
  }

  // Pequeno yield para garantir disponibilidade
  await Promise.resolve();
}

async function reportFailure(sources: string[]): Promise<void> {
  try {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const payload = {
      area: 'checkout-pagarme',
      kind: 'sdk_load_failed',
      ua: navigator.userAgent,
      csp: cspMeta ? (cspMeta as HTMLMetaElement).content : null,
      tried: sources,
      timestamp: new Date().toISOString()
    };
    
    console.error('[PagarmeSDK] All sources failed. Telemetry:', payload);
    
    // Tentativa não bloqueante de enviar telemetria
    fetch('/api/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // Silenciosamente falha se endpoint não existe
  } catch (e) {
    // Ignora erros de telemetria
  }
}

export async function loadPagarmeSdk(): Promise<SDKSource['label']> {
  // Se já existe no window, retorna imediatamente
  if (window.pagarme?.client) {
    console.info('[PagarmeSDK] Already loaded');
    return 'cdn-4x'; // Label genérico
  }

  // Se já tem promise em andamento, retorna ela
  if (sdkPromise) return sdkPromise;

  sdkPromise = (async () => {
    const triedSources: string[] = [];

    for (const source of SDK_SOURCES) {
      try {
        console.log(`[PagarmeSDK] Trying ${source.label}...`);
        await tryLoadFromSource(source);
        console.info(`✅ [PagarmeSDK] Loaded from ${source.label}`);
        
        if (source.label === 'local') {
          console.warn('[PagarmeSDK] Using local fallback - CDNs may be blocked');
        }
        
        return source.label;
      } catch (error) {
        triedSources.push(source.label);
        console.warn(`[PagarmeSDK] Failed to load from ${source.label}:`, error);
        // Continua para próxima fonte
      }
    }

    // Todas as fontes falharam
    await reportFailure(triedSources);
    sdkPromise = null; // Reset para permitir retry
    throw new Error('All Pagar.me SDK sources failed');
  })();

  return sdkPromise;
}
