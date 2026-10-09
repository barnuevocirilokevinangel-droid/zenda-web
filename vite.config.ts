import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // El SDK de Firestore (~600 kB) se carga bajo demanda al enviar el formulario,
    // por lo que no afecta al bundle inicial.
    chunkSizeWarningLimit: 700,
  },
})
