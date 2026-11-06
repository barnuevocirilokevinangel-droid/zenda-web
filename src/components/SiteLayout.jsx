import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

/** Estructura común del sitio público: Navbar + contenido de la ruta + Footer. */
export default function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zenda-dark">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
