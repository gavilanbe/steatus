# sTEAtus 🍵

> App de seguimiento de estado de ánimo y red de apoyo, pensada para personas neurodivergentes: comparte cómo te sientes con personas de confianza y recibe apoyo cuando lo necesites.

## ✨ Características

- 🎭 **Selector de ánimo**: registra tu estado emocional con emojis y colores.
- 🤝 **Red de apoyo**: comparte tu estado con contactos de confianza y recibe reconocimiento.
- ⚡ **Tiempo real**: actualizaciones instantáneas vía Socket.IO (quién está en línea, quién vio tu estado).
- 📱 **PWA optimizada para móvil**: instalable en la pantalla de inicio, soporte de notch y áreas seguras de iPhone.
- 🔔 **Notificaciones push**: avisos en el navegador cuando cambia el estado de tus contactos.
- 🌙 **Tema claro/oscuro** y diseño accesible y responsive.

## 🚀 Uso

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd server && npm install && cd ..

# Variables de entorno (copia los ejemplos y rellena tus valores)
cp .env.example .env
cp server/.env.example server/.env
```

```bash
# Terminal 1: backend
cd server && npm run dev

# Terminal 2: frontend
npm run dev
```

Visita http://localhost:5174 para ver la app.

## 🛠️ Tecnología

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS, PWA (vite-plugin-pwa).
- **Backend**: Node.js + Express + Socket.IO.
- **Datos / Auth**: Supabase (PostgreSQL) y JWT.
- **Despliegue**: Docker / Google Cloud Run.

## 📦 Proyecto personal

Proyecto personal de [gavilanbe](https://github.com/gavilanbe), hecho con 💜 para la comunidad TEA / neurodivergente.
