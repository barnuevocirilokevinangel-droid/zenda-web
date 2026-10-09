import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Verticals from './components/Verticals.jsx';
import CaseStudies from './components/CaseStudies.jsx';
import Process from './components/Process.jsx';
import LeadFunnel from './components/LeadFunnel.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zenda-dark">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Verticals />
        <CaseStudies />
        <Process />
        <LeadFunnel />
      </main>
      <Footer />
    </div>
  );
}
