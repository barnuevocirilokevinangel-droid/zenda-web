import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import PageLoader from './components/PageLoader.jsx';
import ScrollManager from './components/ScrollManager.jsx';
import SiteLayout from './components/SiteLayout.jsx';
import Home from './pages/Home.jsx';

// Páginas secundarias con carga diferida (lazy) para maximizar la velocidad de la landing
const ClientOnboarding = lazy(() => import('./pages/ClientOnboarding.jsx'));
const Terms = lazy(() => import('./pages/Legal/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Legal/Privacy.jsx'));
const Reclamaciones = lazy(() => import('./pages/Legal/Reclamaciones.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const reduceMotion = useReducedMotion();

  return (
    <BrowserRouter>
      <PageLoader />
      <ScrollManager />
      {/* Contenedor con animación de entrada sin 'transform' para no romper sticky */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Suspense fallback={<div className="min-h-screen bg-[#0B0F19]" />}>
          <Routes>
            <Route element={<SiteLayout />}>
              {/* Ruta principal: Landing page (Hero, Servicios, Casos, Diagnóstico 60s, Footer) */}
              <Route path="/" element={<Home />} />
              {/* Rutas normativas legales de wearezenda.com */}
              <Route path="/terminos" element={<Terms />} />
              <Route path="/privacidad" element={<Privacy />} />
              <Route path="/reclamaciones" element={<Reclamaciones />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Portal interactivo de auditoría y bienvenida para nuevos clientes */}
            <Route path="/onboarding" element={<ClientOnboarding />} />
          </Routes>
        </Suspense>
      </motion.div>
    </BrowserRouter>
  );
}
