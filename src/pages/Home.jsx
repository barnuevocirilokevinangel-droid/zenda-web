import Hero from '../components/Hero.jsx';
import Marquee from '../components/Marquee.jsx';
import Metrics from '../components/Metrics.jsx';
import Verticals from '../components/Verticals.jsx';
import CaseStudies from '../components/CaseStudies.jsx';
import Process from '../components/Process.jsx';
import LeadFunnel from '../components/LeadFunnel.jsx';

/** Landing principal ("/"). Navbar y Footer los aporta SiteLayout. */
export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Metrics />
      <Verticals />
      <CaseStudies />
      <Process />
      <LeadFunnel />
    </>
  );
}
