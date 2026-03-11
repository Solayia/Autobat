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
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--mute-audio',
];

/**
 * Retourne la config Puppeteer optimisée pour la prod (VPS Linux)
 * Utilise le Chrome bundlé de Puppeteer (stable, version garantie compatible).
 * Peut être surchargé via PUPPETEER_EXECUTABLE_PATH si nécessaire.
 */
export function getPuppeteerConfig() {
  return {
    headless: true,
    args: CHROME_ARGS,
    // Laisser Puppeteer utiliser son propre Chrome bundlé (plus stable que le Chrome système)
    // Surcharge possible via variable d'env PUPPETEER_EXECUTABLE_PATH
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
  };
}
