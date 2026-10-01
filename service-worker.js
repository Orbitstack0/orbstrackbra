const CACHE_PREFIX = 'bradescon-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;

const CORE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.webmanifest',
    '/quem-somos/',
    '/servicos/',
    '/simulacao/',
    '/privacidade/',
    '/termos/'
];

const IMAGE_URLS = [
    '/images/sigla-bradescon-512.png',
    '/images/logo-bradescon-sem-brilho-512.png',
    '/images/imagem%20do%20fundo%20novo.png',
    '/images/quem-somos-nos.webp',
    '/images/solucao-imoveis.webp',
    '/images/solucao-veiculos-leves.webp',
    '/images/solucao-veiculos-pesados.webp',
    '/images/solucao-agricolas.webp',
    '/images/historia-imoveis.webp',
    '/images/historia-veiculo.webp',
    '/images/historia-pesado.webp',
    '/images/historia-agro.webp',
    '/images/ADEMICON-CRÉDITO.png',
    '/images/ÂNCORA-CONSÓRCIOS.png',
    '/images/BB-CONSÓRCIO.png',
    '/images/BRADESCO-CONSÓRCIOS.png',
    '/images/CAIXA-CONSÓRCIOS.png',
    '/images/CONSÓRCIO-CANOPUS.png',
    '/images/CONSÓRCIO-EMBRACON.png',
    '/images/CONSÓRCIO-KAWASAKI.png',
    '/images/ZEMA-CONSÓRCIO.png'
];

const CACHED_PAGE_PATHS = new Set([
    '/',
    '/index.html',
    '/quem-somos/',
    '/servicos/',
    '/simulacao/',
    '/privacidade/',
    '/termos/'
]);

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CORE_URLS);
        await Promise.allSettled(IMAGE_URLS.map(async url => {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Unable to cache ${url}`);
            await cache.put(url, response);
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames
            .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

async function networkFirst(request, url) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request);
        if (response.ok && CACHED_PAGE_PATHS.has(url.pathname)) {
            await cache.put(url.pathname, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        throw error;
    }
}

async function cacheFirstWithRefresh(request, event) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const refresh = fetch(request)
        .then(async response => {
            if (response.ok) await cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);

    if (cached) {
        event.waitUntil(refresh);
        return cached;
    }

    const response = await refresh;
    return response || Response.error();
}

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, url));
        return;
    }

    if (['style', 'script', 'image', 'manifest'].includes(request.destination)) {
        event.respondWith(cacheFirstWithRefresh(request, event));
    }
});
