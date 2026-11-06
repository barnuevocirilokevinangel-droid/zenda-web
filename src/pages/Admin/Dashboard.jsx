import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  ExternalLink,
  Eye,
  Film,
  Filter,
  FolderGit2,
  Globe,
  LogOut,
  Menu,
  MessageCircle,
  Percent,
  Plus,
  Search,
  Sliders,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../firebase.js';
import usePageMeta from '../../lib/usePageMeta.js';
import { buildWhatsAppLink } from '../../lib/whatsapp.js';

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Muestras iniciales con estados oficiales: Nuevo, En integración, Activo, Pausado
const INITIAL_MOCK_CLIENTS = [
  {
    id: 'mock-1',
    businessName: 'Dolciangel Pastelería',
    decisionMaker: 'Andrea Rosales (Gerente)',
    contact: '+51 987 654 321',
    starProduct: 'Tortas personalizadas y postres finos',
    avgTicket: 'S/ 50 – S/ 150 (Servicios estándar o retail)',
    weeklyVolume: '60 a 150 pedidos o consultas por semana',
    mainChannel: 'WhatsApp',
    currentTools: ['Excel / Google Sheets', 'WhatsApp Business'],
    bottleneckProcess: 'Colapso en WhatsApp en horas punta, pedidos anotados a mano y retrasos en confirmar pagos.',
    primaryGoal: 'Automatizar pedidos y atención',
    goalDetail: 'Atención 24/7 con menú digital y sincronización automática con cocina en menos de 2 minutos.',
    driveFolder: 'https://drive.google.com/drive/folders/ejemplo-dolciangel',
    socialLinks: 'https://instagram.com/dolciangel',
    status: 'En integración',
    progress: 45,
    timestamp: '2026-11-05T19:30:00.000Z',
    type: 'onboarding',
  },
  {
    id: 'mock-2',
    businessName: 'Valkiria Fitness Club',
    decisionMaker: 'Marcos Benítez (Fundador)',
    contact: '+51 912 345 678',
    starProduct: 'Membresías anuales de entrenamiento',
    avgTicket: 'S/ 150 – S/ 500 (Ticket medio / atención especializada)',
    weeklyVolume: '20 a 60 pedidos o consultas por semana',
    mainChannel: 'Instagram',
    currentTools: ['Meta Business Suite / Pauta publicitaria', 'WhatsApp Business'],
    bottleneckProcess: 'Muchos mensajes por DM de Instagram que no se convierten en visitas al local.',
    primaryGoal: 'Más leads calificados',
    goalDetail: 'Campañas de adquisición con chatbot de agendamiento para visitas guiadas al gimnasio.',
    driveFolder: '',
    socialLinks: 'https://instagram.com/valkiriafit',
    status: 'Nuevo',
    progress: 15,
    timestamp: '2026-11-05T17:15:00.000Z',
    type: 'onboarding',
  },
];

const INITIAL_MOCK_FINANCES = [
  {
    id: 'fin-1',
    concept: 'Retainer mensual Automatización - Dolciangel',
    amount: 1800,
    currency: 'PEN',
    type: 'ingreso',
    category: 'Retainer Cliente',
    date: '2026-11-03',
  },
  {
    id: 'fin-2',
    concept: 'Setup & Arquitectura Software - Valkiria',
    amount: 750,
    currency: 'USD',
    type: 'ingreso',
    category: 'Setup',
    date: '2026-11-04',
  },
  {
    id: 'fin-3',
    concept: 'Inversión en Campaña Meta Ads (Zenda Ads)',
    amount: 450,
    currency: 'PEN',
    type: 'egreso',
    category: 'Pauta Ads',
    date: '2026-11-05',
  },
  {
    id: 'fin-4',
    concept: 'Infraestructura Cloud Vercel Pro & APIs IA',
    amount: 60,
    currency: 'USD',
    type: 'egreso',
    category: 'Software/Herramientas',
    date: '2026-11-02',
  },
];

const INITIAL_MOCK_CONTENT = [
  {
    id: 'cnt-1',
    title: 'Reel 01: Antes vs Después de automatizar pedidos por WhatsApp',
    client: 'Dolciangel Pastelería',
    publishDate: '2026-11-08',
    status: 'En Edición',
    driveUrl: 'https://drive.google.com/drive/folders/dolciangel-reels',
  },
  {
    id: 'cnt-2',
    title: 'Reel 02: Rutina de alta intensidad + tour por las máquinas',
    client: 'Valkiria Fitness',
    publishDate: '2026-11-10',
    status: 'Grabado',
    driveUrl: '',
  },
  {
    id: 'cnt-3',
    title: 'Video Caso de Estudio: Cómo Zenda ahorra 25 horas semanales a negocios',
    client: 'Zenda OS',
    publishDate: '2026-11-12',
    status: 'Planificado',
    driveUrl: '',
  },
];

export default function AdminDashboard() {
  usePageMeta({
    title: 'Zenda OS · Panel de Control Interno',
    description: 'Gestión interna de clientes, finanzas y contenido de Zenda.',
    noindex: true,
  });

  const [currentUser, setCurrentUser] = useState(auth?.currentUser || null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Zenda signOut Error]:', err);
    }
  };

  const [activeTab, setActiveTab] = useState('clients'); // clients | finances | content | goals
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de datos
  const [clients, setClients] = useState(INITIAL_MOCK_CLIENTS);
  const [finances, setFinances] = useState(INITIAL_MOCK_FINANCES);
  const [contentList, setContentList] = useState(INITIAL_MOCK_CONTENT);
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  // Filtros de clientes
  const [clientSearch, setClientSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all'); // all | onboarding | leads

  // Estado de nuevo movimiento financiero
  const [financeFormOpen, setFinanceFormOpen] = useState(false);
  const [newFinance, setNewFinance] = useState(() => ({
    concept: '',
    amount: '',
    currency: 'PEN',
    type: 'ingreso',
    category: 'Retainer Cliente',
    date: getTodayDate(),
  }));

  // Estado de nuevo contenido / reel
  const [contentFormOpen, setContentFormOpen] = useState(false);
  const [newContent, setNewContent] = useState(() => ({
    title: '',
    client: '',
    publishDate: getTodayDate(),
    status: 'Planificado',
    driveUrl: '',
  }));

  // Sincronización en tiempo real con Firestore
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let unsubOnboarding;
    let unsubLeads;
    let unsubFinances;
    let unsubContent;

    import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
      // 1. Escuchar client_onboarding
      try {
        const qOnboarding = query(collection(db, 'client_onboarding'), orderBy('createdAt', 'desc'));
        unsubOnboarding = onSnapshot(
          qOnboarding,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveOnboardings = snapshot.docs.map((doc) => ({
                id: doc.id,
                progress: doc.data().progress || 20,
                status: doc.data().status || 'Nuevo',
                ...doc.data(),
                type: 'onboarding',
              }));
              setClients((prev) => {
                const leadsOnly = prev.filter((c) => c.type === 'leads');
                return [...liveOnboardings, ...leadsOnly];
              });
            }
          },
          (err) => console.warn('[Firestore] Onboarding listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query onboarding:', e);
      }

      // 2. Escuchar leads (Diagnóstico 60s)
      try {
        const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        unsubLeads = onSnapshot(
          qLeads,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveLeads = snapshot.docs.map((doc) => ({
                id: doc.id,
                businessName: doc.data().business || doc.data().name || 'Prospecto Web',
                decisionMaker: doc.data().name || 'Decisor',
                contact: doc.data().whatsapp || 'Sin teléfono',
                starProduct: doc.data().industry || 'Diagnóstico 60s',
                avgTicket: doc.data().budget || 'Sin definir',
                weeklyVolume: 'Evaluando',
                mainChannel: 'Web',
                bottleneckProcess: doc.data().bottleneck || 'Diagnóstico inicial 60s',
                primaryGoal: 'Diagnóstico 60s',
                goalDetail: `Interés: ${doc.data().caseInterest || 'General'}`,
                status: doc.data().status || 'Nuevo',
                progress: doc.data().progress || 10,
                type: 'leads',
                ...doc.data(),
              }));
              setClients((prev) => {
                const onboardingsOnly = prev.filter((c) => c.type !== 'leads');
                return [...onboardingsOnly, ...liveLeads];
              });
            }
          },
          (err) => console.warn('[Firestore] Leads listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query leads:', e);
      }

      // 3. Escuchar zenda_finances
      try {
        const qFinances = query(collection(db, 'zenda_finances'), orderBy('date', 'desc'));
        unsubFinances = onSnapshot(
          qFinances,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveFinances = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setFinances(liveFinances);
            }
          },
          (err) => console.warn('[Firestore] Finances listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query finances:', e);
      }

      // 4. Escuchar zenda_content
      try {
        const qContent = query(collection(db, 'zenda_content'), orderBy('publishDate', 'asc'));
        unsubContent = onSnapshot(
          qContent,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveContent = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setContentList(liveContent);
            }
          },
          (err) => console.warn('[Firestore] Content listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query content:', e);
      }
    });

    return () => {
      if (unsubOnboarding) unsubOnboarding();
      if (unsubLeads) unsubLeads();
      if (unsubFinances) unsubFinances();
      if (unsubContent) unsubContent();
    };
  }, []);

  // Actualizar estado de cliente: Nuevo | En integración | Activo | Pausado
  const updateClientStatus = async (clientId, newStatus, clientType) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c)),
    );
    if (isFirebaseConfigured && db && !clientId.startsWith('mock-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const col = clientType === 'leads' ? 'leads' : 'client_onboarding';
        await updateDoc(doc(db, col, clientId), { status: newStatus });
      } catch (err) {
        console.warn('[Firestore] Error al actualizar estado:', err);
      }
    }
  };

  // Actualizar progreso manual (0% a 100%)
  const updateClientProgress = async (clientId, newProgress, clientType) => {
    const val = Number(newProgress);
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, progress: val } : c)),
    );
    if (isFirebaseConfigured && db && !clientId.startsWith('mock-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const col = clientType === 'leads' ? 'leads' : 'client_onboarding';
        await updateDoc(doc(db, col, clientId), { progress: val });
      } catch (err) {
        console.warn('[Firestore] Error al actualizar progreso:', err);
      }
    }
  };

  // Guardar nuevo registro financiero en 'zenda_finances'
  const handleAddFinance = async (e) => {
    e.preventDefault();
    if (!newFinance.concept.trim() || !newFinance.amount) return;

    const record = {
      concept: newFinance.concept.trim(),
      amount: parseFloat(newFinance.amount),
      currency: newFinance.currency,
      type: newFinance.type,
      category: newFinance.category,
      date: newFinance.date,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'zenda_finances'), {
          ...record,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Firestore] Error al guardar finanza:', err);
      }
    }

    setFinances((prev) => [{ id: `local-${Date.now()}`, ...record }, ...prev]);
    setNewFinance({
      concept: '',
      amount: '',
      currency: 'PEN',
      type: 'ingreso',
      category: 'Retainer Cliente',
      date: getTodayDate(),
    });
    setFinanceFormOpen(false);
  };

  // Eliminar movimiento financiero
  const handleDeleteFinance = async (id) => {
    setFinances((prev) => prev.filter((f) => f.id !== id));
    if (isFirebaseConfigured && db && !id.startsWith('local-') && !id.startsWith('fin-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_finances', id));
      } catch (err) {
        console.warn('[Firestore] Error al eliminar finanza:', err);
      }
    }
  };

  // Guardar nuevo reel en 'zenda_content'
  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!newContent.title.trim() || !newContent.client.trim()) return;

    const record = {
      title: newContent.title.trim(),
      client: newContent.client.trim(),
      publishDate: newContent.publishDate,
      status: newContent.status,
      driveUrl: newContent.driveUrl.trim() || '',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'zenda_content'), {
          ...record,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Firestore] Error al guardar contenido:', err);
      }
    }

    setContentList((prev) => [...prev, { id: `local-c-${Date.now()}`, ...record }]);
    setNewContent({
      title: '',
      client: '',
      publishDate: getTodayDate(),
      status: 'Planificado',
      driveUrl: '',
    });
    setContentFormOpen(false);
  };

  // Cambiar estado de reel de contenido: Planificado | Grabado | En Edición | Publicado
  const updateContentStatus = async (id, newStatus) => {
    setContentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
    if (isFirebaseConfigured && db && !id.startsWith('local-') && !id.startsWith('cnt-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_content', id), { status: newStatus });
      } catch (err) {
        console.warn('[Firestore] Error al actualizar estado de contenido:', err);
      }
    }
  };

  // Cálculos de finanzas
  const totalIncomePEN = finances
    .filter((f) => f.type === 'ingreso' && f.currency === 'PEN')
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalExpensePEN = finances
    .filter((f) => f.type === 'egreso' && f.currency === 'PEN')
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const netPEN = totalIncomePEN - totalExpensePEN;
  const marginPEN = totalIncomePEN > 0 ? ((netPEN / totalIncomePEN) * 100).toFixed(1) : 0;

  const totalIncomeUSD = finances
    .filter((f) => f.type === 'ingreso' && f.currency === 'USD')
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalExpenseUSD = finances
    .filter((f) => f.type === 'egreso' && f.currency === 'USD')
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const netUSD = totalIncomeUSD - totalExpenseUSD;

  // Filtrado de clientes
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      (c.businessName || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.decisionMaker || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.contact || '').toLowerCase().includes(clientSearch.toLowerCase());
    if (clientFilter === 'onboarding') return matchesSearch && c.type === 'onboarding';
    if (clientFilter === 'leads') return matchesSearch && c.type === 'leads';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Nuevo':
        return 'border-zenda-cyan/40 bg-zenda-cyan/10 text-zenda-cyan shadow-[0_0_10px_rgba(0,229,255,0.15)]';
      case 'En integración':
        return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
      case 'Activo':
        return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300';
      case 'Pausado':
        return 'border-amber-400/40 bg-amber-400/10 text-amber-300';
      default:
        return 'border-white/20 bg-white/5 text-neutral-300';
    }
  };

  const getContentStatusBadge = (status) => {
    switch (status) {
      case 'Planificado':
        return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
      case 'Grabado':
        return 'border-blue-400/30 bg-blue-400/10 text-blue-300';
      case 'En Edición':
        return 'border-purple-400/30 bg-purple-400/10 text-purple-300';
      case 'Publicado':
        return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
      default:
        return 'border-white/10 bg-white/5 text-neutral-300';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080B11] font-sans text-neutral-100 antialiased selection:bg-zenda-cyan selection:text-black">
      {/* Luces sutiles */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 right-1/4 h-[350px] w-[500px] rounded-full bg-zenda-blue/15 blur-[160px]"
      />

      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-white/5 bg-white/[0.01] p-5 backdrop-blur-xl md:flex">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2">
          <img src="/isotipo-zenda.png" alt="Zenda" className="h-6 w-auto object-contain brightness-110" />
          <span className="text-lg font-bold tracking-tight text-white">zenda</span>
          <span className="rounded border border-zenda-cyan/30 bg-zenda-cyan/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zenda-cyan">
            OS
          </span>
        </div>

        {/* Navigation tabs */}
        <nav className="mt-8 flex-1 space-y-1.5" aria-label="Secciones del panel">
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'clients'
                ? 'border border-zenda-cyan/30 bg-zenda-cyan/10 text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-zenda-cyan" />
              <span>Clientes & Onboardings</span>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300">
              {clients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'finances'
                ? 'border border-zenda-cyan/30 bg-zenda-cyan/10 text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Finanzas (Ingresos/Egresos)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'content'
                ? 'border border-zenda-cyan/30 bg-zenda-cyan/10 text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Film className="h-4 w-4 text-purple-400" />
              <span>Grilla de Producción</span>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300">
              {contentList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'goals'
                ? 'border border-zenda-cyan/30 bg-zenda-cyan/10 text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-blue-400" />
              <span>Métricas & Metas</span>
            </div>
          </button>
        </nav>

        {/* Footer Sidebar */}
        <div className="space-y-3 border-t border-white/5 pt-4">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              wearezenda.com
            </span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 text-xs">
            <div className="truncate">
              <p className="font-semibold text-white">{currentUser?.displayName || 'Fundador'}</p>
              <p className="truncate text-[11px] text-neutral-400">{currentUser?.email || 'fundador@wearezenda.com'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión (signOut)"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header con botón Cerrar Sesión */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#080B11]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              {activeTab === 'clients' && 'Zenda OS · Clientes & Onboardings'}
              {activeTab === 'finances' && 'Zenda OS · Finanzas (Ingresos / Egresos)'}
              {activeTab === 'content' && 'Zenda OS · Grilla de Producción & Reels'}
              {activeTab === 'goals' && 'Zenda OS · Métricas & Metas Operativas'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 font-mono text-[11px] text-neutral-400 sm:flex">
              <span className={`h-2 w-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
              <span>{isFirebaseConfigured ? 'Firestore en Vivo' : 'Modo Dev'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-xs font-semibold text-neutral-300 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-[#080B11] p-4 md:hidden">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('clients');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'clients' ? 'bg-zenda-cyan/15 text-zenda-cyan' : 'text-neutral-300'
                }`}
              >
                Clientes & Onboardings ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('finances');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'finances' ? 'bg-zenda-cyan/15 text-zenda-cyan' : 'text-neutral-300'
                }`}
              >
                Finanzas & Flujo
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('content');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'content' ? 'bg-zenda-cyan/15 text-zenda-cyan' : 'text-neutral-300'
                }`}
              >
                Grilla de Producción ({contentList.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('goals');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'goals' ? 'bg-zenda-cyan/15 text-zenda-cyan' : 'text-neutral-300'
                }`}
              >
                Métricas & Metas
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <main className="flex-1 p-6 md:p-8">
          {/* ========================================================= */}
          {/* PESTAÑA 1: CLIENTES Y ONBOARDINGS */}
          {/* ========================================================= */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Barra de filtros y búsqueda */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar por negocio, decisor o teléfono..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 outline-none hover:border-white/20 focus:border-zenda-cyan"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" /> Filtrar:
                  </span>
                  <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setClientFilter('all')}
                      className={`rounded-lg px-3 py-1 font-mono transition-all ${
                        clientFilter === 'all'
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Todos ({clients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientFilter('onboarding')}
                      className={`rounded-lg px-3 py-1 font-mono transition-all ${
                        clientFilter === 'onboarding'
                          ? 'bg-zenda-cyan/20 text-zenda-cyan font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Onboardings ({clients.filter((c) => c.type === 'onboarding').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientFilter('leads')}
                      className={`rounded-lg px-3 py-1 font-mono transition-all ${
                        clientFilter === 'leads'
                          ? 'bg-blue-500/20 text-blue-300 font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Leads 60s ({clients.filter((c) => c.type === 'leads').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla interactiva con badges oficiales: Nuevo, En integración, Activo, Pausado */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/5 bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                      <tr>
                        <th className="px-5 py-4">Negocio / Marca</th>
                        <th className="px-5 py-4">Decisor & Contacto</th>
                        <th className="px-5 py-4">Oferta & Ticket</th>
                        <th className="px-5 py-4">Estado</th>
                        <th className="px-5 py-4 text-right">Acciones Directas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-neutral-400 font-mono">
                            No se encontraron registros con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((client) => {
                          const cleanPhone = String(client.contact || '').replace(/\D/g, '');
                          const waUrl = cleanPhone
                            ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Hola ${client.decisionMaker}, te saluda el equipo fundador de Zenda sobre el onboarding de ${client.businessName}.`,
                              )}`
                            : buildWhatsAppLink();

                          return (
                            <tr key={client.id} className="transition-colors hover:bg-white/[0.02]">
                              <td className="px-5 py-4">
                                <div className="font-semibold text-white">{client.businessName}</div>
                                {client.rucOrLegal && (
                                  <div className="text-[11px] font-mono text-neutral-400">
                                    RUC: {client.rucOrLegal}
                                  </div>
                                )}
                                <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                                  client.type === 'leads' ? 'bg-blue-500/10 text-blue-300' : 'bg-zenda-cyan/10 text-zenda-cyan'
                                }`}>
                                  {client.type === 'leads' ? 'Diagnóstico 60s' : 'Portal Onboarding'}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <div className="text-neutral-200">{client.decisionMaker}</div>
                                <div className="font-mono text-[11px] text-neutral-400">{client.contact}</div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="text-neutral-200 line-clamp-1">{client.starProduct || '—'}</div>
                                <div className="text-[11px] font-mono text-neutral-400">
                                  {client.avgTicket || '—'}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <select
                                  value={client.status || 'Nuevo'}
                                  onChange={(e) => updateClientStatus(client.id, e.target.value, client.type)}
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-mono font-medium outline-none transition-all ${getStatusBadge(
                                    client.status || 'Nuevo',
                                  )}`}
                                >
                                  <option value="Nuevo" className="bg-neutral-900 text-white">Nuevo</option>
                                  <option value="En integración" className="bg-neutral-900 text-white">En integración</option>
                                  <option value="Activo" className="bg-neutral-900 text-white">Activo</option>
                                  <option value="Pausado" className="bg-neutral-900 text-white">Pausado</option>
                                </select>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
                                    title="Escribir al WhatsApp"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    WhatsApp
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedClientDetail(client)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-neutral-300 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Detalle
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal de Detalle Completo de Ficha de Onboarding */}
              {selectedClientDetail && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                  onClick={() => setSelectedClientDetail(null)}
                >
                  <div
                    className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0C1019] p-6 shadow-2xl sm:p-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between border-b border-white/10 pb-5">
                      <div>
                        <span className="font-mono text-xs uppercase tracking-widest text-zenda-cyan">
                          Ficha Completa de Cliente
                        </span>
                        <h2 className="mt-1 text-2xl font-bold text-white">
                          {selectedClientDetail.businessName}
                        </h2>
                        {selectedClientDetail.rucOrLegal && (
                          <p className="font-mono text-xs text-neutral-400">
                            RUC / Razón Social: {selectedClientDetail.rucOrLegal}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedClientDetail(null)}
                        className="rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-6 space-y-5 text-sm">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Decisor Principal</p>
                          <p className="mt-1 font-semibold text-white">{selectedClientDetail.decisionMaker}</p>
                          <p className="mt-0.5 font-mono text-xs text-neutral-300">{selectedClientDetail.contact}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Canal & Volumen</p>
                          <p className="mt-1 font-semibold text-white">{selectedClientDetail.mainChannel}</p>
                          <p className="mt-0.5 text-xs text-neutral-300">{selectedClientDetail.weeklyVolume}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Producto o Servicio Estrella</p>
                        <p className="mt-1 text-white">{selectedClientDetail.starProduct}</p>
                        <p className="mt-1 text-xs text-zenda-cyan font-mono">Ticket: {selectedClientDetail.avgTicket}</p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Herramientas en Uso</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(selectedClientDetail.currentTools || []).map((t) => (
                            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300">
                              {t}
                            </span>
                          ))}
                        </div>
                        {selectedClientDetail.toolsOther && (
                          <p className="mt-2 text-xs text-neutral-400">Otras: {selectedClientDetail.toolsOther}</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-red-400">Cuello de Botella Declarado</p>
                        <p className="mt-1 text-neutral-200 leading-relaxed">{selectedClientDetail.bottleneckProcess}</p>
                      </div>

                      <div className="rounded-xl border border-zenda-cyan/20 bg-zenda-cyan/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-zenda-cyan">Meta a 90 Días</p>
                        <p className="mt-1 font-semibold text-white">{selectedClientDetail.primaryGoal}</p>
                        <p className="mt-1 text-xs text-neutral-300 leading-relaxed">{selectedClientDetail.goalDetail}</p>
                      </div>

                      {/* Accesos y links */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        {selectedClientDetail.driveFolder && (
                          <a
                            href={selectedClientDetail.driveFolder}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white transition-all hover:border-zenda-cyan hover:text-zenda-cyan"
                          >
                            <FolderGit2 className="h-4 w-4" />
                            Carpeta de Drive
                          </a>
                        )}
                        {selectedClientDetail.socialLinks && (
                          <a
                            href={
                              selectedClientDetail.socialLinks.startsWith('http')
                                ? selectedClientDetail.socialLinks
                                : `https://${selectedClientDetail.socialLinks}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white transition-all hover:border-white/20 hover:text-white"
                          >
                            <Globe className="h-4 w-4" />
                            Redes / Web
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 2: FINANZAS (INGRESOS / EGRESOS) */}
          {/* ========================================================= */}
          {activeTab === 'finances' && (
            <div className="space-y-8">
              {/* Tarjetas KPI Superiores: Total Ingresos, Total Egresos, Margen Neto Operativo */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <span>Total Ingresos</span>
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-emerald-400">
                    S/ {totalIncomePEN.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-400 font-mono mt-1">
                    + US$ {totalIncomeUSD.toLocaleString()} USD
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <span>Total Egresos</span>
                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-red-400">
                    S/ {totalExpensePEN.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-400 font-mono mt-1">
                    + US$ {totalExpenseUSD.toLocaleString()} USD
                  </div>
                </div>

                <div className="rounded-2xl border border-zenda-cyan/30 bg-zenda-cyan/[0.04] p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zenda-cyan">
                    <span>Margen Neto Operativo</span>
                    <Percent className="h-4 w-4 text-zenda-cyan" />
                  </div>
                  <div className={`mt-3 text-2xl font-bold ${netPEN >= 0 ? 'text-white' : 'text-red-400'}`}>
                    S/ {netPEN.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-zenda-cyan font-mono">({marginPEN}%)</span>
                  </div>
                  <div className="text-xs text-zenda-cyan/80 font-mono mt-1">
                    Neto USD: + US$ {netUSD.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Botón para abrir formulario rápido */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Movimientos Registrados</h2>
                  <p className="text-xs text-neutral-400">Almacenados en la colección Firestore: <code>zenda_finances</code></p>
                </div>
                <button
                  type="button"
                  onClick={() => setFinanceFormOpen(!financeFormOpen)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-zenda-cyan to-cyan-300 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  {financeFormOpen ? 'Cerrar Formulario' : 'Nuevo Movimiento'}
                </button>
              </div>

              {/* Formulario rápido con categorías oficiales */}
              {financeFormOpen && (
                <form
                  onSubmit={handleAddFinance}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur-md"
                >
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zenda-cyan mb-4">
                    Registrar Movimiento Financiero
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Tipo</label>
                      <select
                        value={newFinance.type}
                        onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      >
                        <option value="ingreso">Ingreso (+)</option>
                        <option value="egreso">Egreso (-)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Concepto</label>
                      <input
                        type="text"
                        placeholder="Ej. Retainer mensual Automatización - Dolciangel"
                        required
                        value={newFinance.concept}
                        onChange={(e) => setNewFinance({ ...newFinance, concept: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Monto</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        value={newFinance.amount}
                        onChange={(e) => setNewFinance({ ...newFinance, amount: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Moneda</label>
                      <select
                        value={newFinance.currency}
                        onChange={(e) => setNewFinance({ ...newFinance, currency: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      >
                        <option value="PEN">Soles (PEN S/)</option>
                        <option value="USD">Dólares (USD $)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Categoría</label>
                      <select
                        value={newFinance.category}
                        onChange={(e) => setNewFinance({ ...newFinance, category: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      >
                        <option value="Retainer Cliente">Retainer Cliente</option>
                        <option value="Setup">Setup / Implementación</option>
                        <option value="Pauta Ads">Pauta Ads</option>
                        <option value="Software/Herramientas">Software / Herramientas</option>
                        <option value="Operativo">Operativo</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={newFinance.date}
                        onChange={(e) => setNewFinance({ ...newFinance, date: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setFinanceFormOpen(false)}
                      className="rounded-xl px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-white px-5 py-2 text-xs font-mono font-bold text-neutral-950 hover:bg-neutral-200"
                    >
                      Guardar Movimiento
                    </button>
                  </div>
                </form>
              )}

              {/* Tabla de Finanzas */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                    <tr>
                      <th className="px-5 py-3.5">Fecha</th>
                      <th className="px-5 py-3.5">Concepto</th>
                      <th className="px-5 py-3.5">Categoría</th>
                      <th className="px-5 py-3.5">Tipo</th>
                      <th className="px-5 py-3.5 text-right">Monto</th>
                      <th className="px-5 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {finances.map((f) => (
                      <tr key={f.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 font-mono text-neutral-400">{f.date}</td>
                        <td className="px-5 py-3.5 font-medium text-white">{f.concept}</td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300">
                            {f.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                              f.type === 'ingreso'
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : 'bg-red-500/10 text-red-300'
                            }`}
                          >
                            {f.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold">
                          <span className={f.type === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}>
                            {f.type === 'ingreso' ? '+' : '-'} {f.currency === 'PEN' ? 'S/' : '$'}{' '}
                            {Number(f.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteFinance(f.id)}
                            className="rounded p-1 text-neutral-500 hover:text-red-400"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 3: GRILLA DE PRODUCCIÓN Y CONTENIDO */}
          {/* ========================================================= */}
          {activeTab === 'content' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Grilla de Producción & Reels por Cliente</h2>
                  <p className="text-xs text-neutral-400">
                    Registro de piezas audiovisuales en colección <code>zenda_content</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContentFormOpen(!contentFormOpen)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-zenda-cyan to-cyan-300 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  {contentFormOpen ? 'Cerrar' : 'Nuevo Reel'}
                </button>
              </div>

              {/* Formulario nuevo reel con estados: Planificado | Grabado | En Edición | Publicado */}
              {contentFormOpen && (
                <form
                  onSubmit={handleAddContent}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md"
                >
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zenda-cyan mb-4">
                    Registrar Nueva Pieza de Contenido
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Idea / Título del Video</label>
                      <input
                        type="text"
                        placeholder="Ej. Reel #03: Caso de éxito automatización WhatsApp"
                        required
                        value={newContent.title}
                        onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Cliente / Cuenta</label>
                      <input
                        type="text"
                        placeholder="Ej. Dolciangel, Valkiria"
                        required
                        value={newContent.client}
                        onChange={(e) => setNewContent({ ...newContent, client: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Fecha de Grabación / Entrega</label>
                      <input
                        type="date"
                        value={newContent.publishDate}
                        onChange={(e) => setNewContent({ ...newContent, publishDate: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Estado</label>
                      <select
                        value={newContent.status}
                        onChange={(e) => setNewContent({ ...newContent, status: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      >
                        <option value="Planificado">Planificado</option>
                        <option value="Grabado">Grabado</option>
                        <option value="En Edición">En Edición</option>
                        <option value="Publicado">Publicado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-300 mb-1">Link al Material / Drive (Opcional)</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={newContent.driveUrl}
                        onChange={(e) => setNewContent({ ...newContent, driveUrl: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080B11] px-3.5 py-2.5 text-xs text-white outline-none focus:border-zenda-cyan"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setContentFormOpen(false)}
                      className="rounded-xl px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-white px-5 py-2 text-xs font-mono font-bold text-neutral-950 hover:bg-neutral-200"
                    >
                      Guardar Reel
                    </button>
                  </div>
                </form>
              )}

              {/* Grid de piezas audiovisuales */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contentList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-white/20"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-neutral-300">
                          {item.client}
                        </span>
                        <select
                          value={item.status}
                          onChange={(e) => updateContentStatus(item.id, e.target.value)}
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium outline-none ${getContentStatusBadge(
                            item.status,
                          )}`}
                        >
                          <option value="Planificado" className="bg-neutral-900 text-white">Planificado</option>
                          <option value="Grabado" className="bg-neutral-900 text-white">Grabado</option>
                          <option value="En Edición" className="bg-neutral-900 text-white">En Edición</option>
                          <option value="Publicado" className="bg-neutral-900 text-white">Publicado</option>
                        </select>
                      </div>

                      <h3 className="mt-3 text-sm font-semibold text-white leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="mt-5 border-t border-white/5 pt-3 flex items-center justify-between text-xs">
                      <span className="font-mono text-neutral-400 text-[11px] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {item.publishDate}
                      </span>
                      {item.driveUrl && (
                        <a
                          href={item.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zenda-cyan hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <FolderGit2 className="h-3.5 w-3.5" />
                          Link Material
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 4: MÉTRICAS & METAS (CON BARRA MANUAL 0% A 100%) */}
          {/* ========================================================= */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Métricas & Seguimiento de Metas por Cuenta</h2>
                <p className="text-xs text-neutral-400">
                  Ajusta manualmente el porcentaje de cumplimiento operativo para cada cliente (0% a 100%).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {clients.map((client) => {
                  const currentProg = client.progress ?? 25;

                  return (
                    <div
                      key={client.id}
                      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{client.businessName}</span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono ${getStatusBadge(client.status || 'Nuevo')}`}>
                            {client.status || 'Nuevo'}
                          </span>
                        </div>

                        <div className="mt-4 rounded-xl border border-zenda-cyan/20 bg-zenda-cyan/[0.04] p-4">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-zenda-cyan">
                            Meta Declarada en Onboarding
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {client.primaryGoal || 'Optimización operativa'}
                          </p>
                          <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
                            {client.goalDetail || 'En proceso de auditoría preliminar.'}
                          </p>
                        </div>

                        {/* Barra de progreso manual interactiva (0% a 100%) */}
                        <div className="mt-5 space-y-2 rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-neutral-300 flex items-center gap-1.5">
                              <Sliders className="h-3.5 w-3.5 text-zenda-cyan" />
                              Avance Operativo:
                            </span>
                            <span className="font-mono font-bold text-zenda-cyan">{currentProg}%</span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={currentProg}
                            onChange={(e) => updateClientProgress(client.id, e.target.value, client.type)}
                            className="w-full accent-zenda-cyan cursor-pointer"
                          />

                          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                            <span>0% (Inicio)</span>
                            <span>50% (En Integración)</span>
                            <span>100% (Meta Cumplida)</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1 text-xs text-neutral-400">
                          <div className="flex items-center justify-between">
                            <span>Producto estrella:</span>
                            <span className="text-neutral-200">{client.starProduct || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Canal principal:</span>
                            <span className="text-neutral-200">{client.mainChannel || 'WhatsApp'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-neutral-400">
                          Decisor: {client.decisionMaker}
                        </span>
                        <a
                          href={buildWhatsAppLink(
                            `Hola ${client.decisionMaker}, te escribo de Zenda para revisar el avance del ${currentProg}% en las metas de ${client.businessName}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-zenda-cyan hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Coordinar avance
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
