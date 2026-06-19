// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Carga variables de entorno (.env, .env.local, etc.)
  const env = loadEnv(mode, process.cwd(), '')

  // Si usas un túnel (ngrok, Cloudflared, etc.), pon el host en TUNNEL_HOST
  // Ej: TUNNEL_HOST=a9a161057a4a.ngrok-free.app
  const TUNNEL_HOST = env.TUNNEL_HOST?.trim()
  const TUNNEL_HTTPS = `${env.TUNNEL_HTTPS ?? 'true'}` === 'true'

  // allowedHosts debe ser un array de strings en Vite.
  // Incluimos localhost/127.0.0.1 y añadimos el túnel si existe.
  const allowedHosts = ['localhost', '127.0.0.1']
  if (TUNNEL_HOST) allowedHosts.push(TUNNEL_HOST)

  // Para que HMR funcione bien detrás de túneles HTTPS:
  // - host: true expone en 0.0.0.0
  // - hmr.host apunta al dominio público del túnel
  // - hmr.protocol 'wss' (si el túnel es https)
  // - hmr.clientPort 443 (si el túnel es https)
  const hmr = TUNNEL_HOST
    ? {
        host: TUNNEL_HOST,
        protocol: TUNNEL_HTTPS ? 'wss' : 'ws',
        clientPort: TUNNEL_HTTPS ? 443 : undefined,
      }
    : undefined

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'sTEAtus',
          short_name: 'sTEAtus',
          description: 'Share your mood with your support network',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ],
    resolve: {
      alias: { '@': '/src' }
    },
    server: {
      host: true,                 // escucha en 0.0.0.0
      port: Number(env.PORT) || 5173,
      allowedHosts,               // ← aquí va el dominio del túnel
      hmr,                        // ← HMR estable por túnel
      cors: true
    },
    preview: {
      host: true,
      port: Number(env.PREVIEW_PORT) || 4173,
      allowedHosts,
      cors: true
    }
  }
})

