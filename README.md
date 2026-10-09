# Zenda — Web Corporativa

Sitio corporativo oficial para **Zenda**, agencia especializada en adquisición digital de alto rendimiento, desarrollo de software e infraestructura de automatizaciones operativas.

Inspirado en la estética minimalista, sobria y limpia de referentes como *lathos.es*.

---

## 🎨 Sistema de Diseño y Marca

- **Fondo primario:** Blanco puro (`#FFFFFF`)
- **Texto principal:** Negro/Carbón (`#0B0F19` / `zenda-dark`)
- **Acentos de marca:**
  - `zenda-cyan`: `#00E5FF` (micro-indicadores, interacción sutil)
  - `zenda-blue`: `#1E3A8A` (contrastes secundarios y badges)
- **Tipografía:** Inter (sans-serif sobria, corporativa)
- **Bordes y acabados:** `rounded-2xl` y `rounded-full` para CTAs estilo píldora.

---

## 🚀 Inicio Rápido

Para iniciar el servidor de desarrollo local:

```bash
npm run dev
```

La aplicación estará disponible típicamente en [http://localhost:5173](http://localhost:5173).

### Otros scripts disponibles:

```bash
# Compilar para producción (TypeScript + Vite)
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## 📁 Estructura del Proyecto

```text
src/
├── components/
│   ├── Navbar.jsx       # Navbar sticky con isotipo, links y CTA píldora
│   ├── Hero.jsx         # Eyebrow, titular, subtítulo y CTAs
│   └── Verticals.jsx    # Sección "Nuestras verticales" (3 tarjetas)
├── App.jsx              # Composición de la página
├── index.css            # Directivas Tailwind e import de tipografía
└── main.jsx             # Punto de entrada de React
tailwind.config.js       # Configuración de colores de marca y extensiones
postcss.config.js        # Integración PostCSS con Tailwind y Autoprefixer
```
