import { motion, useReducedMotion } from 'framer-motion';
import PageLoader from './components/PageLoader.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Verticals from './components/Verticals.jsx';
import CaseStudies from './components/CaseStudies.jsx';
import Process from './components/Process.jsx';
import LeadFunnel from './components/LeadFunnel.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <PageLoader />
      {/* Solo opacidad (sin transform) para no romper el `sticky` del Navbar. */}
      <motion.div
        className="flex min-h-screen flex-col bg-white font-sans text-zenda-dark"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Verticals />
          <CaseStudies />
          <Process />
          <LeadFunnel />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
