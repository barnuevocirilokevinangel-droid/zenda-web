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

// Panel de Control Interno (Zenda OS) con carga diferida
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'));
const AdminLogin = lazy(() => import('./pages/Admin/Login.jsx'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard.jsx'));

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
        <Suspense fallback={<div className="min-h-screen bg-[#080B11]" />}>
          <Routes>
            {/* Rutas públicas con Navbar y Footer comercial */}
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/terminos" element={<Terms />} />
              <Route path="/privacidad" element={<Privacy />} />
              <Route path="/reclamaciones" element={<Reclamaciones />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Portal interactivo de auditoría y bienvenida para nuevos clientes */}
            <Route path="/onboarding" element={<ClientOnboarding />} />

            {/* Rutas del Panel de Control Interno (Zenda OS) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </motion.div>
    </BrowserRouter>
  );
}
