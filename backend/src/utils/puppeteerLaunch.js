import { existsSync } from 'fs';

/**
 * Args Chrome robustes pour environnements Linux/VPS/Docker
 */
const CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',        // Évite les crashs quand /dev/shm est limité (64MB par défaut)
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--no-first-run',
  '--no-zygote',
  // NOTE: --single-process retiré car documenté instable et cause des crashs sur VPS
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--mute-audio',
];

/**
 * Détecte le chemin exécutable Chrome disponible sur le système
 * Ordre : variable d'env → chemins Linux courants → Puppeteer bundled
 */
function getExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Chemins courants sur Ubuntu/Debian
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  return undefined; // Utilise le Chrome bundlé de Puppeteer
}

/**
 * Retourne la config Puppeteer optimisée pour la prod (VPS Linux)
 * Usage: const browser = await puppeteer.launch(getPuppeteerConfig());
 */
export function getPuppeteerConfig() {
  const executablePath = getExecutablePath();
  return {
    headless: true,
    args: CHROME_ARGS,
    ...(executablePath ? { executablePath } : {}),
  };
}
