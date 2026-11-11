import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  Film,
  Filter,
  FolderGit2,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Percent,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../firebase.js';
import usePageMeta from '../../lib/usePageMeta.js';
import { buildWhatsAppLink } from '../../lib/whatsapp.js';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getCurrentWeekLabel = () => {
  const now = new Date();
  return `Semana ${Math.ceil(now.getDate() / 7)} · Nov ${now.getFullYear()}`;
};

/**
 * Cálculo dinámico de fecha para tareas de sprint:
 * "Vence hoy", "Vence mañana", "En X días", o "Atrasada (X d)" en rojo tenue.
 */
function getDeadlineStatus(deadlineStr, todayDateStr) {
  if (!deadlineStr) {
    return {
      label: 'Sin fecha',
      colorClass: 'text-slate-500 bg-slate-100 border-slate-200',
    };
  }

  if (deadlineStr === todayDateStr) {
    return {
      label: 'Vence hoy',
      isToday: true,
      colorClass: 'text-amber-800 bg-amber-50 border-amber-200 font-semibold',
    };
  }

  const [y1, m1, d1] = deadlineStr.split('-').map(Number);
  const [y2, m2, d2] = todayDateStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((t1 - t2) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      label: abs === 1 ? 'Atrasada (ayer)' : `Atrasada (${abs}d)`,
      isOverdue: true,
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200 font-semibold',
    };
  }
  if (diffDays === 1) {
    return {
      label: 'Vence mañana',
      colorClass: 'text-sky-700 bg-sky-50 border-sky-200 font-medium',
    };
  }
  return {
    label: `En ${diffDays} días`,
    colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
  };
}

// ============================================================================
// DATOS INICIALES MOCK (FALLBACK INTELIGENTE)
// ============================================================================

const INITIAL_MOCK_SPRINTS = [
  {
    id: 'sp-1',
    title: 'Cierre de guiones y hooks de alto impacto para batch de Dolciangel',
    assignee: 'Angel',
    priority: 'Urgente',
    deadline: '2026-11-13',
    completed: true,
    createdAt: '2026-11-08T10:00:00.000Z',
  },
  {
    id: 'sp-2',
    title: 'Configuración y pruebas de estrés del Agente IA de WhatsApp (Pedidos)',
    assignee: 'Marco',
    priority: 'Alta',
    deadline: '2026-11-14',
    completed: true,
    createdAt: '2026-11-08T11:30:00.000Z',
  },
  {
    id: 'sp-3',
    title: 'Sesión presencial de rodaje con Valkiria Fitness (Batch de 8 reels)',
    assignee: 'Angel',
    priority: 'Urgente',
    deadline: '2026-11-15',
    completed: false,
    createdAt: '2026-11-09T09:15:00.000Z',
  },
  {
    id: 'sp-4',
    title: 'Integración webhook de pasarela con base de datos de clientes',
    assignee: 'Marco',
    priority: 'Alta',
    deadline: '2026-11-16',
    completed: false,
    createdAt: '2026-11-09T14:20:00.000Z',
  },
  {
    id: 'sp-5',
    title: 'Auditoría de métricas de campaña publicitaria y optimización de CPA',
    assignee: 'Angel',
    priority: 'Media',
    deadline: '2026-11-17',
    completed: false,
    createdAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'sp-6',
    title: 'Llamada de kickoff y arquitectura operativa para nuevo cliente B2B',
    assignee: 'Marco',
    priority: 'Baja',
    deadline: '2026-11-18',
    completed: false,
    createdAt: '2026-11-10T16:45:00.000Z',
  },
];

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
    status: 'Activo',
    health: 'En ritmo', // 'En ritmo' | 'Requiere atención' | 'Demorado'
    leadOwner: 'Marco',
    nextMilestone: 'Despliegue final de Agente IA en WhatsApp',
    progress: 75,
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
    bottleneckProcess: 'Muchos mensajes por DM de Instagram que no se convierten en visitas presenciales.',
    primaryGoal: 'Más leads calificados',
    goalDetail: 'Campañas de adquisición con chatbot de agendamiento para visitas guiadas al gimnasio.',
    driveFolder: 'https://drive.google.com/drive/folders/ejemplo-valkiria',
    socialLinks: 'https://instagram.com/valkiriafit',
    status: 'En integración',
    health: 'Requiere atención',
    leadOwner: 'Angel',
    nextMilestone: 'Sesión presencial de rodaje (8 reels)',
    progress: 45,
    timestamp: '2026-11-05T17:15:00.000Z',
    type: 'onboarding',
  },
  {
    id: 'mock-3',
    businessName: 'Clínica Odontológica DentalZ',
    decisionMaker: 'Dra. Patricia Silva',
    contact: '+51 998 112 233',
    starProduct: 'Implantes y diseño de sonrisa',
    avgTicket: 'Más de S/ 2,000 (Alto valor o ticket premium)',
    weeklyVolume: '15 a 30 consultas semanales',
    mainChannel: 'WhatsApp & Instagram',
    currentTools: ['Doctoralia', 'WhatsApp Web'],
    bottleneckProcess: 'Pacientes faltan a las citas de evaluación y no hay seguimiento automatizado tras cotización.',
    primaryGoal: 'Un sistema interno a medida',
    goalDetail: 'CRM de pacientes con recordatorios automáticos y pipeline de seguimiento de presupuestos altos.',
    driveFolder: '',
    socialLinks: 'https://instagram.com/dentalz_pe',
    status: 'Nuevo',
    health: 'Demorado',
    leadOwner: 'Marco',
    nextMilestone: 'Aprobación de guiones por la especialista',
    progress: 20,
    timestamp: '2026-11-06T10:00:00.000Z',
    type: 'onboarding',
  },
];

const INITIAL_MOCK_CONTENT = [
  {
    id: 'cnt-1',
    title: 'El error de S/ 3,000 que cometen las pastelerías al tomar pedidos por chat',
    client: 'Dolciangel Pastelería',
    stage: 'En edición / Agente', // 'Guion listo' | 'Por grabar' | 'En edición / Agente' | 'Aprobado' | 'Publicado'
    assignee: 'Marco',
    publishDate: '2026-11-14',
    driveUrl: 'https://drive.google.com/drive/folders/dolciangel-reels',
  },
  {
    id: 'cnt-2',
    title: 'Tour cinemático: Por qué las máquinas hammer strength cambian tus resultados',
    client: 'Valkiria Fitness Club',
    stage: 'Por grabar',
    assignee: 'Angel',
    publishDate: '2026-11-16',
    driveUrl: 'https://drive.google.com/drive/folders/valkiria-rodajes',
  },
  {
    id: 'cnt-3',
    title: '¿Por qué el carbón activado arruina el esmalte de tus dientes para siempre?',
    client: 'Clínica Odontológica DentalZ',
    stage: 'Guion listo',
    assignee: 'Angel',
    publishDate: '2026-11-18',
    driveUrl: 'https://docs.google.com/document/d/dentalz-guion-01',
  },
  {
    id: 'cnt-4',
    title: 'Caso Zenda: Cómo ahorramos 28 horas operativas semanales con automatización',
    client: 'Zenda Media',
    stage: 'Aprobado',
    assignee: 'Marco',
    publishDate: '2026-11-15',
    driveUrl: 'https://drive.google.com/drive/folders/zenda-cases',
  },
  {
    id: 'cnt-5',
    title: 'Reel de lanzamiento: Menú interactivo 24/7 sin esperas en WhatsApp',
    client: 'Dolciangel Pastelería',
    stage: 'Publicado',
    assignee: 'Angel',
    publishDate: '2026-11-10',
    driveUrl: 'https://drive.google.com/drive/folders/dolciangel-reels',
  },
];

const INITIAL_MOCK_CALENDAR = [
  {
    id: 'cal-1',
    title: 'Rodaje Presencial: Set de 8 Reels de Adquisición',
    client: 'Valkiria Fitness Club',
    type: 'Rodaje presencial',
    date: '2026-11-15',
    time: '10:00',
    assignee: 'Angel',
    notes: 'Llevar lentes 24-70mm, tubos RGB y micrófono lavalier inalámbrico.',
    completed: false,
  },
  {
    id: 'cal-2',
    title: 'Facturación & Cobro: Retainer Mensual Mes 2',
    client: 'Dolciangel Pastelería',
    type: 'Cobro / Facturación',
    date: '2026-11-16',
    time: '09:30',
    assignee: 'Marco',
    notes: 'Emisión de comprobante electrónico por S/ 1,800 a razón social.',
    completed: false,
  },
  {
    id: 'cal-3',
    title: 'Publicación: Reel Caso de Estudio Zenda en Redes',
    client: 'Zenda Media',
    type: 'Publicación / Entrega',
    date: '2026-11-16',
    time: '19:00',
    assignee: 'Marco',
    notes: 'Programar en Instagram y TikTok con copy de captación de leads.',
    completed: false,
  },
  {
    id: 'cal-4',
    title: 'Kickoff Operativo: Revisión de Guiones y Aprobación',
    client: 'Clínica Odontológica DentalZ',
    type: 'Reunión / Sync',
    date: '2026-11-18',
    time: '16:00',
    assignee: 'Ambos',
    notes: 'Llamada de 30 mins vía Google Meet con la Dra. Patricia Silva.',
    completed: false,
  },
  {
    id: 'cal-5',
    title: 'Cobro: Segunda Cuota Setup & Arquitectura IA ($750)',
    client: 'Valkiria Fitness Club',
    type: 'Cobro / Facturación',
    date: '2026-11-20',
    time: '11:00',
    assignee: 'Marco',
    notes: 'Confirmación de transferencia internacional o cuenta en dólares.',
    completed: false,
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminDashboard() {
  usePageMeta({
    title: 'Zenda OS · Command Center Centralizado',
    description: 'Command Center operativo de Zenda: Sprints, Pipeline de Contenido, Calendario y Finanzas.',
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

  // 4 Secciones principales:
  // 'command' | 'pipeline' | 'calendar' | 'finances'
  const [activeTab, setActiveTab] = useState('command');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de datos
  const [sprints, setSprints] = useState(INITIAL_MOCK_SPRINTS);
  const [clients, setClients] = useState(INITIAL_MOCK_CLIENTS);
  const [contentList, setContentList] = useState(INITIAL_MOCK_CONTENT);
  const [calendarEvents, setCalendarEvents] = useState(INITIAL_MOCK_CALENDAR);
  const [finances, setFinances] = useState(INITIAL_MOCK_FINANCES);

  // Modales
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [newSprint, setNewSprint] = useState(() => ({
    title: '',
    assignee: 'Angel',
    priority: 'Alta',
    deadline: getTodayDate(),
  }));

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [newContent, setNewContent] = useState(() => ({
    title: '',
    client: '',
    stage: 'Guion listo',
    assignee: 'Angel',
    publishDate: getTodayDate(),
    driveUrl: '',
  }));

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [newCalendarEvent, setNewCalendarEvent] = useState(() => ({
    title: '',
    client: '',
    type: 'Rodaje presencial',
    date: getTodayDate(),
    time: '10:00',
    assignee: 'Angel',
    notes: '',
  }));

  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [newFinance, setNewFinance] = useState(() => ({
    concept: '',
    amount: '',
    currency: 'PEN',
    type: 'ingreso',
    category: 'Retainer Cliente',
    date: getTodayDate(),
  }));

  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  // Filtros
  const [sprintFilter, setSprintFilter] = useState('all'); // all | Angel | Marco | pending | completed
  const [contentStageFilter, setContentStageFilter] = useState('all');
  const [calendarTypeFilter, setCalendarTypeFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [financeSubTab, setFinanceSubTab] = useState('clients');

  // Estado del calendario mensual
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const weekLabel = useMemo(() => getCurrentWeekLabel(), []);
  const todayDateStr = useMemo(() => getTodayDate(), []);

  // ============================================================================
  // SINCRONIZACIÓN EN TIEMPO REAL CON FIRESTORE (onSnapshot)
  // ============================================================================
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let unsubSprints;
    let unsubOnboarding;
    let unsubLeads;
    let unsubContent;
    let unsubCalendar;
    let unsubFinances;

    import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
      // 1. zenda_sprints
      try {
        const qSprints = query(collection(db, 'zenda_sprints'), orderBy('deadline', 'asc'));
        unsubSprints = onSnapshot(
          qSprints,
          (snapshot) => {
            if (!snapshot.empty) {
              const live = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setSprints(live);
            }
          },
          (err) => console.warn('[Firestore] Sprints listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query sprints:', e);
      }

      // 2. client_onboarding
      try {
        const qOnboarding = query(collection(db, 'client_onboarding'), orderBy('createdAt', 'desc'));
        unsubOnboarding = onSnapshot(
          qOnboarding,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveOnboardings = snapshot.docs.map((doc) => ({
                id: doc.id,
                progress: doc.data().progress || 25,
                status: doc.data().status || 'Nuevo',
                health: doc.data().health || 'En ritmo',
                leadOwner: doc.data().leadOwner || 'Angel',
                nextMilestone: doc.data().nextMilestone || 'Auditoría inicial de procesos',
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

      // 3. leads (Diagnóstico 60s)
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
                weeklyVolume: 'Por evaluar',
                mainChannel: 'Web',
                bottleneckProcess: doc.data().bottleneck || 'Diagnóstico inicial 60s',
                primaryGoal: 'Diagnóstico 60s',
                goalDetail: `Interés: ${doc.data().caseInterest || 'General'}`,
                status: doc.data().status || 'Nuevo',
                health: doc.data().health || 'En ritmo',
                leadOwner: doc.data().leadOwner || 'Marco',
                nextMilestone: 'Contacto por WhatsApp para diagnóstico',
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

      // 4. zenda_content
      try {
        const qContent = query(collection(db, 'zenda_content'), orderBy('publishDate', 'asc'));
        unsubContent = onSnapshot(
          qContent,
          (snapshot) => {
            if (!snapshot.empty) {
              const live = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setContentList(live);
            }
          },
          (err) => console.warn('[Firestore] Content listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query content:', e);
      }

      // 5. zenda_calendar
      try {
        const qCalendar = query(collection(db, 'zenda_calendar'), orderBy('date', 'asc'));
        unsubCalendar = onSnapshot(
          qCalendar,
          (snapshot) => {
            if (!snapshot.empty) {
              const live = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setCalendarEvents(live);
            }
          },
          (err) => console.warn('[Firestore] Calendar listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query calendar:', e);
      }

      // 6. zenda_finances
      try {
        const qFinances = query(collection(db, 'zenda_finances'), orderBy('date', 'desc'));
        unsubFinances = onSnapshot(
          qFinances,
          (snapshot) => {
            if (!snapshot.empty) {
              const live = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setFinances(live);
            }
          },
          (err) => console.warn('[Firestore] Finances listener:', err),
        );
      } catch (e) {
        console.warn('[Firestore] Error query finances:', e);
      }
    });

    return () => {
      if (unsubSprints) unsubSprints();
      if (unsubOnboarding) unsubOnboarding();
      if (unsubLeads) unsubLeads();
      if (unsubContent) unsubContent();
      if (unsubCalendar) unsubCalendar();
      if (unsubFinances) unsubFinances();
    };
  }, []);

  // ============================================================================
  // ACCIONES: SPRINTS (zenda_sprints)
  // ============================================================================

  const handleToggleSprint = async (sprintId, currentCompleted) => {
    const nextVal = !currentCompleted;
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, completed: nextVal } : s)),
    );
    if (isFirebaseConfigured && db && !sprintId.startsWith('sp-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_sprints', sprintId), { completed: nextVal });
      } catch (err) {
        console.warn('[Firestore] Error toggle sprint:', err);
      }
    }
  };

  const handleAddSprint = async (e) => {
    e.preventDefault();
    if (!newSprint.title.trim()) return;

    const record = {
      title: newSprint.title.trim(),
      assignee: newSprint.assignee,
      priority: newSprint.priority,
      deadline: newSprint.deadline,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'zenda_sprints'), {
          ...record,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Firestore] Error add sprint:', err);
      }
    }

    setSprints((prev) => [{ id: `local-sp-${Date.now()}`, ...record }, ...prev]);
    setNewSprint({
      title: '',
      assignee: 'Angel',
      priority: 'Alta',
      deadline: getTodayDate(),
    });
    setSprintModalOpen(false);
  };

  const handleDeleteSprint = async (id) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
    if (isFirebaseConfigured && db && !id.startsWith('sp-') && !id.startsWith('local-sp-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_sprints', id));
      } catch (err) {
        console.warn('[Firestore] Error delete sprint:', err);
      }
    }
  };

  // ============================================================================
  // ACCIONES: SEMÁFORO Y CUENTAS (client_onboarding)
  // ============================================================================

  const handleUpdateHealth = async (clientId, newHealth, clientType) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, health: newHealth } : c)),
    );
    if (isFirebaseConfigured && db && !clientId.startsWith('mock-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const col = clientType === 'leads' ? 'leads' : 'client_onboarding';
        await updateDoc(doc(db, col, clientId), { health: newHealth });
      } catch (err) {
        console.warn('[Firestore] Error update health:', err);
      }
    }
  };

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
        console.warn('[Firestore] Error update status:', err);
      }
    }
  };

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
        console.warn('[Firestore] Error update progress:', err);
      }
    }
  };

  // ============================================================================
  // ACCIONES: PIPELINE DE CONTENIDO (zenda_content)
  // ============================================================================

  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!newContent.title.trim() || !newContent.client.trim()) return;

    const record = {
      title: newContent.title.trim(),
      client: newContent.client.trim(),
      stage: newContent.stage,
      assignee: newContent.assignee,
      publishDate: newContent.publishDate,
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
        console.warn('[Firestore] Error add content:', err);
      }
    }

    setContentList((prev) => [...prev, { id: `local-cnt-${Date.now()}`, ...record }]);
    setNewContent({
      title: '',
      client: '',
      stage: 'Guion listo',
      assignee: 'Angel',
      publishDate: getTodayDate(),
      driveUrl: '',
    });
    setContentModalOpen(false);
  };

  const handleUpdateContentStage = async (id, newStage) => {
    setContentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c)),
    );
    if (isFirebaseConfigured && db && !id.startsWith('cnt-') && !id.startsWith('local-cnt-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_content', id), { stage: newStage });
      } catch (err) {
        console.warn('[Firestore] Error update stage:', err);
      }
    }
  };

  const handleUpdateContentAssignee = async (id, newAssignee) => {
    setContentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, assignee: newAssignee } : c)),
    );
    if (isFirebaseConfigured && db && !id.startsWith('cnt-') && !id.startsWith('local-cnt-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_content', id), { assignee: newAssignee });
      } catch (err) {
        console.warn('[Firestore] Error update assignee:', err);
      }
    }
  };

  const handleDeleteContent = async (id) => {
    setContentList((prev) => prev.filter((c) => c.id !== id));
    if (isFirebaseConfigured && db && !id.startsWith('cnt-') && !id.startsWith('local-cnt-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_content', id));
      } catch (err) {
        console.warn('[Firestore] Error delete content:', err);
      }
    }
  };

  // ============================================================================
  // ACCIONES: CALENDARIO & RODAJES (zenda_calendar)
  // ============================================================================

  const handleAddCalendarEvent = async (e) => {
    e.preventDefault();
    if (!newCalendarEvent.title.trim()) return;

    const record = {
      title: newCalendarEvent.title.trim(),
      client: newCalendarEvent.client.trim() || 'General / Interno',
      type: newCalendarEvent.type,
      date: newCalendarEvent.date,
      time: newCalendarEvent.time || '10:00',
      assignee: newCalendarEvent.assignee,
      notes: newCalendarEvent.notes.trim() || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'zenda_calendar'), {
          ...record,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Firestore] Error add calendar:', err);
      }
    }

    setCalendarEvents((prev) => [...prev, { id: `local-cal-${Date.now()}`, ...record }]);
    setNewCalendarEvent({
      title: '',
      client: '',
      type: 'Rodaje presencial',
      date: getTodayDate(),
      time: '10:00',
      assignee: 'Angel',
      notes: '',
    });
    setCalendarModalOpen(false);
  };

  const handleToggleCalendarCompleted = async (id, currentVal) => {
    const nextVal = !currentVal;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, completed: nextVal } : ev)),
    );
    if (isFirebaseConfigured && db && !id.startsWith('cal-') && !id.startsWith('local-cal-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_calendar', id), { completed: nextVal });
      } catch (err) {
        console.warn('[Firestore] Error toggle calendar completed:', err);
      }
    }
  };

  const handleDeleteCalendarEvent = async (id) => {
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== id));
    if (isFirebaseConfigured && db && !id.startsWith('cal-') && !id.startsWith('local-cal-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_calendar', id));
      } catch (err) {
        console.warn('[Firestore] Error delete calendar:', err);
      }
    }
  };

  // ============================================================================
  // ACCIONES: FINANZAS (zenda_finances)
  // ============================================================================

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
        console.warn('[Firestore] Error add finance:', err);
      }
    }

    setFinances((prev) => [{ id: `local-fin-${Date.now()}`, ...record }, ...prev]);
    setNewFinance({
      concept: '',
      amount: '',
      currency: 'PEN',
      type: 'ingreso',
      category: 'Retainer Cliente',
      date: getTodayDate(),
    });
    setFinanceModalOpen(false);
  };

  const handleDeleteFinance = async (id) => {
    setFinances((prev) => prev.filter((f) => f.id !== id));
    if (isFirebaseConfigured && db && !id.startsWith('fin-') && !id.startsWith('local-fin-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_finances', id));
      } catch (err) {
        console.warn('[Firestore] Error delete finance:', err);
      }
    }
  };

  // ============================================================================
  // CÁLCULOS Y KPIs
  // ============================================================================

  // Sprints
  const completedSprintsCount = sprints.filter((s) => s.completed).length;
  const totalSprintsCount = sprints.length;
  const sprintProgressPercent = totalSprintsCount > 0 ? Math.round((completedSprintsCount / totalSprintsCount) * 100) : 0;

  const filteredSprints = sprints.filter((s) => {
    if (sprintFilter === 'Angel') return s.assignee === 'Angel';
    if (sprintFilter === 'Marco') return s.assignee === 'Marco';
    if (sprintFilter === 'pending') return !s.completed;
    if (sprintFilter === 'completed') return s.completed;
    return true;
  });

  // Semáforo de salud de cuentas
  const accountsInRhythm = clients.filter((c) => (c.health || 'En ritmo') === 'En ritmo').length;
  const accountsAttention = clients.filter((c) => c.health === 'Requiere atención').length;
  const accountsDelayed = clients.filter((c) => c.health === 'Demorado').length;

  // Pipeline de Contenido
  const contentStages = ['Guion listo', 'Por grabar', 'En edición / Agente', 'Aprobado', 'Publicado'];
  const filteredContent = contentList.filter((c) => {
    if (contentStageFilter === 'all') return true;
    return c.stage === contentStageFilter;
  });

  // Calendario
  const filteredCalendarEvents = calendarEvents.filter((ev) => {
    const matchesType = calendarTypeFilter === 'all' || ev.type === calendarTypeFilter;
    const matchesDay = !selectedCalendarDay || ev.date === selectedCalendarDay;
    return matchesType && matchesDay;
  });

  // Días del mes actual
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter((e) => e.date === dateStr);
      days.push({ day: d, dateStr, events: dayEvents });
    }
    return days;
  }, [currentCalendarDate, calendarEvents]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  // Finanzas
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

  // Helpers de estilos para Light Workspace
  const getHealthBadge = (health) => {
    switch (health) {
      case 'En ritmo':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm';
      case 'Requiere atención':
        return 'border-amber-200 bg-amber-50 text-amber-800 shadow-sm';
      case 'Demorado':
        return 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgente':
        return 'border-rose-200 bg-rose-50 text-rose-700 font-semibold';
      case 'Alta':
        return 'border-amber-200 bg-amber-50 text-amber-800 font-medium';
      case 'Media':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Guion listo':
        return 'border-blue-200 bg-blue-50 text-blue-700 font-medium';
      case 'Por grabar':
        return 'border-amber-200 bg-amber-50 text-amber-800 font-medium';
      case 'En edición / Agente':
        return 'border-purple-200 bg-purple-50 text-purple-700 font-medium';
      case 'Aprobado':
        return 'border-cyan-200 bg-cyan-50 text-cyan-800 font-medium';
      case 'Publicado':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const getCalendarTypeBadge = (type) => {
    switch (type) {
      case 'Rodaje presencial':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'Publicación / Entrega':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'Cobro / Facturación':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'Reunión / Sync':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased selection:bg-cyan-500 selection:text-white">
      {/* ==================================================================== */}
      {/* SIDEBAR DARK (#09090B) */}
      {/* ==================================================================== */}
      <aside className="hidden w-64 flex-col border-r border-[#27272A] bg-[#09090B] p-5 md:flex select-none">
        {/* Marca & Status */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <img src="/isotipo-zenda.png" alt="Zenda" className="h-6 w-auto object-contain brightness-110" />
            <span className="text-base font-bold tracking-tight text-white">zenda</span>
            <span className="rounded border border-zenda-cyan/50 bg-zenda-cyan/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zenda-cyan">
              OS
            </span>
          </div>
        </div>

        <div className="mt-3 px-2">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
            <span className="truncate">{isFirebaseConfigured ? 'Cloud Sync Activo' : 'Modo Mock'}</span>
          </div>
        </div>

        {/* Navegación oficial: 4 secciones requeridas */}
        <nav className="mt-7 flex-1 space-y-1.5" aria-label="Secciones del Command Center">
          {/* 1. Command Center */}
          <button
            type="button"
            onClick={() => setActiveTab('command')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium tracking-wide transition-all ${
              activeTab === 'command'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`h-4 w-4 ${activeTab === 'command' ? 'text-zenda-cyan' : 'text-zinc-400'}`} />
              <span>Command Center</span>
            </div>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
              {sprints.filter((s) => !s.completed).length}
            </span>
          </button>

          {/* 2. Pipeline de Contenido */}
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium tracking-wide transition-all ${
              activeTab === 'pipeline'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Film className={`h-4 w-4 ${activeTab === 'pipeline' ? 'text-purple-400' : 'text-zinc-400'}`} />
              <span>Pipeline de Contenido</span>
            </div>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
              {contentList.length}
            </span>
          </button>

          {/* 3. Calendario & Rodajes */}
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium tracking-wide transition-all ${
              activeTab === 'calendar'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarIcon className={`h-4 w-4 ${activeTab === 'calendar' ? 'text-cyan-400' : 'text-zinc-400'}`} />
              <span>Calendario & Rodajes</span>
            </div>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
              {calendarEvents.filter((e) => !e.completed).length}
            </span>
          </button>

          {/* 4. Finanzas & Clientes */}
          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium tracking-wide transition-all ${
              activeTab === 'finances'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className={`h-4 w-4 ${activeTab === 'finances' ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>Finanzas & Clientes</span>
            </div>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
              {clients.length}
            </span>
          </button>
        </nav>

        {/* Footer Sidebar */}
        <div className="space-y-3 border-t border-[#27272A] pt-4">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              wearezenda.com
            </span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
            <div className="truncate">
              <p className="font-semibold text-white">{currentUser?.displayName || 'Equipo Fundador'}</p>
              <p className="truncate font-mono text-[11px] text-zinc-400">{currentUser?.email || 'admin@wearezenda.com'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* CONTENIDO PRINCIPAL: LIGHT WORKSPACE */}
      {/* ==================================================================== */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header Superior Blanco */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-600">ZENDA OS</span>
              <span className="text-slate-300">/</span>
              <h1 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
                {activeTab === 'command' && 'Command Center · Foco Semanal & Cuentas'}
                {activeTab === 'pipeline' && 'Pipeline Audiovisual · Reels & Contenido'}
                {activeTab === 'calendar' && 'Calendario Operativo · Rodajes, Publicaciones & Cobros'}
                {activeTab === 'finances' && 'Finanzas & Clientes · Caja Neta & Onboardings'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[11px] text-slate-600 sm:flex">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{weekLabel}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-700 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-[#27272A] bg-[#09090B] p-4 text-white md:hidden">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('command');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'command' ? 'bg-white/10 text-white' : 'text-zinc-400'
                }`}
              >
                <span>Command Center</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px]">{sprints.filter((s) => !s.completed).length}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pipeline');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'pipeline' ? 'bg-white/10 text-white' : 'text-zinc-400'
                }`}
              >
                <span>Pipeline de Contenido</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px]">{contentList.length}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('calendar');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'calendar' ? 'bg-white/10 text-white' : 'text-zinc-400'
                }`}
              >
                <span>Calendario & Rodajes</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px]">{calendarEvents.length}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('finances');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-mono font-semibold uppercase ${
                  activeTab === 'finances' ? 'bg-white/10 text-white' : 'text-zinc-400'
                }`}
              >
                <span>Finanzas & Clientes</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px]">{clients.length}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <main className="flex-1 p-5 md:p-8">
          {/* ================================================================== */}
          {/* MÓDULO 1: COMMAND CENTER (FOCO SEMANAL & SEMÁFORO DE CUENTAS) */}
          {/* ================================================================== */}
          {activeTab === 'command' && (
            <div className="space-y-8">
              {/* Tarjetas KPI Superiores (Fondo Blanco, Sombra Suave, Texto Alto Contraste) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* KPI 1: Sprint */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#64748B]">
                    <span>Sprint Semanal</span>
                    <Sparkles className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-[#0F172A]">{completedSprintsCount} de {totalSprintsCount}</span>
                    <span className="font-mono text-xs font-semibold text-cyan-700">({sprintProgressPercent}%)</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-slate-900 to-cyan-600 transition-all duration-500 rounded-full"
                      style={{ width: `${sprintProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* KPI 2: Semáforo de Cuentas */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#64748B]">
                    <span>Salud de Cuentas</span>
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-xs font-bold text-emerald-800">{accountsInRhythm}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-0.5 border border-amber-200">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="font-mono text-xs font-bold text-amber-800">{accountsAttention}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2 py-0.5 border border-rose-200">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="font-mono text-xs font-bold text-rose-800">{accountsDelayed}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] font-mono text-slate-500">
                    {accountsDelayed > 0 ? `⚠️ ${accountsDelayed} cuenta requiere atención inmediata` : 'Operaciones en curso fluido'}
                  </p>
                </div>

                {/* KPI 3: Pipeline Activo */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#64748B]">
                    <span>Reels en Pipeline</span>
                    <Film className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-[#0F172A]">{contentList.filter((c) => c.stage !== 'Publicado').length}</span>
                    <span className="text-xs text-slate-500">piezas activas</span>
                  </div>
                  <p className="mt-3 text-[11px] font-mono text-slate-500">
                    {contentList.filter((c) => c.stage === 'Publicado').length} entregadas este mes
                  </p>
                </div>

                {/* KPI 4: Flujo Neto */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#64748B]">
                    <span>Balance Neto Zenda</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-tight text-[#0F172A]">
                    S/ {netPEN.toLocaleString()}
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-slate-500">
                    + US$ {netUSD.toLocaleString()} USD · Margen {marginPEN}%
                  </p>
                </div>
              </div>

              {/* SECCIÓN 1: SPRINT DE LA SEMANA */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-600" />
                      <h2 className="text-lg font-bold text-[#0F172A]">Sprint de la Semana</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Entregables y foco operativo semanal en colección Firestore: <code className="text-slate-800 font-semibold">zenda_sprints</code>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filtros Funcionales de Sprint */}
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setSprintFilter('all')}
                        className={`rounded-lg px-2.5 py-1 transition-all ${
                          sprintFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Todos ({sprints.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSprintFilter('Angel')}
                        className={`rounded-lg px-2.5 py-1 transition-all ${
                          sprintFilter === 'Angel' ? 'bg-zinc-800 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Angel
                      </button>
                      <button
                        type="button"
                        onClick={() => setSprintFilter('Marco')}
                        className={`rounded-lg px-2.5 py-1 transition-all ${
                          sprintFilter === 'Marco' ? 'bg-[#0B2545] text-cyan-200 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Marco
                      </button>
                      <button
                        type="button"
                        onClick={() => setSprintFilter('pending')}
                        className={`rounded-lg px-2.5 py-1 transition-all ${
                          sprintFilter === 'pending' ? 'bg-white text-amber-800 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Pendientes
                      </button>
                    </div>

                    {/* Botón '+ NUEVA TAREA' (Fondo negro #0F172A, texto blanco) */}
                    <button
                      type="button"
                      onClick={() => setSprintModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm transition-all hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      + NUEVA TAREA
                    </button>
                  </div>
                </div>

                {/* Lista interactiva de tareas del sprint */}
                <div className="mt-4 divide-y divide-slate-100">
                  {filteredSprints.length === 0 ? (
                    <div className="py-10 text-center font-mono text-xs text-slate-400">
                      No hay tareas en esta vista del sprint.
                    </div>
                  ) : (
                    filteredSprints.map((sprint) => {
                      const deadlineInfo = getDeadlineStatus(sprint.deadline, todayDateStr);

                      return (
                        <div
                          key={sprint.id}
                          className={`group flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                            sprint.completed ? 'opacity-50' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSprint(sprint.id, sprint.completed)}
                              className="mt-0.5 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                              title={sprint.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                            >
                              {sprint.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-700" />
                              )}
                            </button>

                            <div>
                              <p className={`text-sm ${sprint.completed ? 'line-through text-slate-400 font-normal' : 'font-medium text-slate-900'}`}>
                                {sprint.title}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {/* Badges de asignado requeridos */}
                                {sprint.assignee === 'Angel' ? (
                                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                                    @Angel
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-[#0B2545] border border-cyan-800/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-200">
                                    @Marco
                                  </span>
                                )}

                                {/* Prioridad */}
                                <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] border ${getPriorityBadge(sprint.priority)}`}>
                                  {sprint.priority}
                                </span>

                                {/* Fecha de entrega con cálculo dinámico */}
                                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] border ${deadlineInfo.colorClass}`}>
                                  <Clock className="h-3 w-3" />
                                  <span>{sprint.deadline} · {deadlineInfo.label}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pl-8 sm:pl-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteSprint(sprint.id)}
                              className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: SEMÁFORO DE CUENTAS ACTIVAS */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h2 className="text-lg font-bold text-[#0F172A]">Semáforo de Cuentas Activas</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Detección instantánea de cuellos de botella y salud de entrega por cliente.
                    </p>
                  </div>

                  {/* Leyenda del semáforo */}
                  <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> En ritmo
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Requiere atención
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Demorado
                    </span>
                  </div>
                </div>

                {/* Grid de Cuentas con Semáforo */}
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {clients.map((client) => {
                    const health = client.health || 'En ritmo';
                    const cleanPhone = String(client.contact || '').replace(/\D/g, '');
                    const waUrl = cleanPhone
                      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hola ${client.decisionMaker}, te saluda el equipo fundador de Zenda sobre el estado operativo de ${client.businessName}.`,
                        )}`
                      : buildWhatsAppLink();

                    return (
                      <div
                        key={client.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <div>
                          {/* Header de la tarjeta */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900 leading-tight">
                                {client.businessName}
                              </h3>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{client.decisionMaker}</p>
                            </div>

                            {/* Selector de Semáforo en Tiempo Real */}
                            <select
                              value={health}
                              onChange={(e) => handleUpdateHealth(client.id, e.target.value, client.type)}
                              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold outline-none cursor-pointer ${getHealthBadge(
                                health,
                              )}`}
                            >
                              <option value="En ritmo">🟢 En ritmo</option>
                              <option value="Requiere atención">🟡 Requiere atención</option>
                              <option value="Demorado">🔴 Demorado</option>
                            </select>
                          </div>

                          {/* Cuello de botella detectado */}
                          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-rose-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Foco / Cuello de Botella:
                            </span>
                            <p className="mt-1 text-slate-700 leading-snug line-clamp-2 font-normal">
                              {client.bottleneckProcess || 'En diagnóstico preliminar.'}
                            </p>
                          </div>

                          {/* Próximo hito */}
                          <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/50 p-3 text-xs">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-sky-800 font-semibold flex items-center gap-1">
                              <Target className="h-3 w-3" /> Próximo Hito:
                            </span>
                            <p className="mt-1 font-medium text-slate-800 line-clamp-2">
                              {client.nextMilestone || client.primaryGoal || 'Configuración operativa'}
                            </p>
                          </div>
                        </div>

                        {/* Footer de la tarjeta con responsable y WhatsApp */}
                        <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-500">
                            Lead: <span className="text-slate-900 font-bold">{client.leadOwner || 'Angel'}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedClientDetail(client)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                            >
                              Ficha
                            </button>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* MÓDULO 2: PIPELINE DE PRODUCCIÓN AUDIOVISUAL */}
          {/* ================================================================== */}
          {activeTab === 'pipeline' && (
            <div className="space-y-8">
              {/* Header del Pipeline */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Film className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-[#0F172A]">Pipeline de Producción Audiovisual</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Seguimiento etapa por etapa de reels, hooks y entregables por cliente en <code className="text-slate-800 font-semibold">zenda_content</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContentModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm transition-all hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    + NUEVO REEL / VIDEO
                  </button>
                </div>
              </div>

              {/* Filtros por etapa */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Etapa:
                </span>
                <button
                  type="button"
                  onClick={() => setContentStageFilter('all')}
                  className={`rounded-xl px-3 py-1.5 font-mono text-xs transition-all ${
                    contentStageFilter === 'all'
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({contentList.length})
                </button>
                {contentStages.map((stage) => {
                  const count = contentList.filter((c) => c.stage === stage).length;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setContentStageFilter(stage)}
                      className={`rounded-xl px-3 py-1.5 font-mono text-xs transition-all ${
                        contentStageFilter === stage
                          ? 'bg-slate-900 text-white font-semibold shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {stage} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Tabla de Contenido en Contenedor Blanco */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Cliente / Cuenta</th>
                        <th className="px-5 py-4">Hook o Título del Video</th>
                        <th className="px-5 py-4">Etapa Actual</th>
                        <th className="px-5 py-4">Responsable</th>
                        <th className="px-5 py-4">Publicación</th>
                        <th className="px-5 py-4 text-right">Material / Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredContent.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center font-mono text-slate-400">
                            No hay piezas de contenido en la etapa seleccionada.
                          </td>
                        </tr>
                      ) : (
                        filteredContent.map((item) => (
                          <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                            {/* Cliente */}
                            <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                                {item.client}
                              </span>
                            </td>

                            {/* Hook / Título */}
                            <td className="px-5 py-4">
                              <p className="max-w-md font-medium text-slate-900 leading-snug">
                                {item.title}
                              </p>
                            </td>

                            {/* Etapa actual */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <select
                                value={item.stage}
                                onChange={(e) => handleUpdateContentStage(item.id, e.target.value)}
                                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold outline-none cursor-pointer ${getStageBadge(
                                  item.stage,
                                )}`}
                              >
                                {contentStages.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Responsable */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <select
                                value={item.assignee || 'Angel'}
                                onChange={(e) => handleUpdateContentAssignee(item.id, e.target.value)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="Angel">Angel</option>
                                <option value="Marco">Marco</option>
                              </select>
                            </td>

                            {/* Fecha */}
                            <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                {item.publishDate}
                              </span>
                            </td>

                            {/* Material & Acciones */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {item.driveUrl ? (
                                  <a
                                    href={item.driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100"
                                    title="Abrir carpeta de Drive"
                                  >
                                    <FolderGit2 className="h-3.5 w-3.5" />
                                    Drive
                                  </a>
                                ) : (
                                  <span className="font-mono text-[10px] text-slate-400">Sin link</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteContent(item.id)}
                                  className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Eliminar pieza"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* MÓDULO 3: CALENDARIO OPERATIVO INTEGRADO */}
          {/* ================================================================== */}
          {activeTab === 'calendar' && (
            <div className="space-y-8">
              {/* Header del Calendario */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-cyan-600" />
                    <h2 className="text-lg font-bold text-[#0F172A]">Calendario & Rodajes Operativos</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Rodajes presenciales, fechas límite de publicación y cobros en colección <code className="text-slate-800 font-semibold">zenda_calendar</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm transition-all hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    + NUEVO EVENTO
                  </button>
                </div>
              </div>

              {/* Filtro por tipo de evento */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Tipo:
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarTypeFilter('all')}
                  className={`rounded-xl px-3 py-1 font-mono text-xs transition-all ${
                    calendarTypeFilter === 'all'
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({calendarEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarTypeFilter('Rodaje presencial')}
                  className={`rounded-xl px-3 py-1 font-mono text-xs transition-all ${
                    calendarTypeFilter === 'Rodaje presencial'
                      ? 'border border-purple-300 bg-purple-100 text-purple-900 font-semibold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎥 Rodajes ({calendarEvents.filter((e) => e.type === 'Rodaje presencial').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarTypeFilter('Publicación / Entrega')}
                  className={`rounded-xl px-3 py-1 font-mono text-xs transition-all ${
                    calendarTypeFilter === 'Publicación / Entrega'
                      ? 'border border-sky-300 bg-sky-100 text-sky-900 font-semibold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🚀 Publicaciones ({calendarEvents.filter((e) => e.type === 'Publicación / Entrega').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarTypeFilter('Cobro / Facturación')}
                  className={`rounded-xl px-3 py-1 font-mono text-xs transition-all ${
                    calendarTypeFilter === 'Cobro / Facturación'
                      ? 'border border-emerald-300 bg-emerald-100 text-emerald-900 font-semibold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💰 Cobros ({calendarEvents.filter((e) => e.type === 'Cobro / Facturación').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarTypeFilter('Reunión / Sync')}
                  className={`rounded-xl px-3 py-1 font-mono text-xs transition-all ${
                    calendarTypeFilter === 'Reunión / Sync'
                      ? 'border border-amber-300 bg-amber-100 text-amber-900 font-semibold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🤝 Reuniones ({calendarEvents.filter((e) => e.type === 'Reunión / Sync').length})
                </button>
              </div>

              {/* Grid: Mini-Calendario a la izquierda y Agenda detallada a la derecha */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Cuadrícula interactiva mensual */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-mono text-sm font-bold text-slate-900">
                      {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentCalendarDate(
                            new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1),
                          )
                        }
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentCalendarDate(new Date());
                          setSelectedCalendarDay(null);
                        }}
                        className="rounded-lg px-2 py-1 font-mono text-[10px] text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentCalendarDate(
                            new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1),
                          )
                        }
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Días de la semana */}
                  <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase text-slate-400">
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mié</div>
                    <div>Jue</div>
                    <div>Vie</div>
                    <div>Sáb</div>
                    <div>Dom</div>
                  </div>

                  {/* Días del mes */}
                  <div className="mt-2 grid grid-cols-7 gap-1">
                    {calendarDays.map((cell, idx) => {
                      if (!cell.day) {
                        return <div key={`empty-${idx}`} className="h-9" />;
                      }

                      const hasEvents = cell.events && cell.events.length > 0;
                      const isSelected = selectedCalendarDay === cell.dateStr;
                      const isToday = cell.dateStr === todayDateStr;

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() =>
                            setSelectedCalendarDay(isSelected ? null : cell.dateStr)
                          }
                          className={`relative flex h-10 flex-col items-center justify-center rounded-xl font-mono text-xs transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white font-bold shadow-md'
                              : isToday
                              ? 'border-2 border-slate-900 text-slate-900 font-bold bg-slate-50'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{cell.day}</span>
                          {hasEvents && (
                            <span className="absolute bottom-1 flex gap-0.5">
                              {cell.events.slice(0, 3).map((ev) => (
                                <span
                                  key={ev.id}
                                  className={`h-1 w-1 rounded-full ${
                                    ev.type === 'Rodaje presencial'
                                      ? 'bg-purple-500'
                                      : ev.type === 'Cobro / Facturación'
                                      ? 'bg-emerald-500'
                                      : 'bg-sky-500'
                                  }`}
                                />
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedCalendarDay && (
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-700 font-semibold">Filtrando por día: {selectedCalendarDay}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDay(null)}
                        className="text-slate-500 hover:text-slate-900 underline"
                      >
                        Ver todos
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista de Agenda de Eventos */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-mono text-sm font-bold text-slate-900">
                      Próximos Eventos & Fechas Límite
                    </h3>
                    <span className="font-mono text-xs text-slate-500">
                      {filteredCalendarEvents.length} eventos en vista
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredCalendarEvents.length === 0 ? (
                      <div className="py-12 text-center font-mono text-xs text-slate-400">
                        No hay eventos programados para los filtros seleccionados.
                      </div>
                    ) : (
                      filteredCalendarEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 ${
                            ev.completed ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleCalendarCompleted(ev.id, ev.completed)}
                                className="mt-1 text-slate-400 hover:text-emerald-600 transition-colors"
                                title={ev.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                              >
                                {ev.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-300" />
                                )}
                              </button>

                              <div>
                                <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getCalendarTypeBadge(
                                  ev.type,
                                )}`}>
                                  {ev.type}
                                </span>

                                <h4 className={`mt-1.5 text-sm font-bold text-slate-900 ${ev.completed ? 'line-through text-slate-400' : ''}`}>
                                  {ev.title}
                                </h4>

                                <p className="font-mono text-xs text-slate-600">
                                  Cuenta: <span className="text-slate-900 font-semibold">{ev.client}</span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteCalendarEvent(ev.id)}
                              className="rounded p-1 text-slate-400 hover:text-rose-600"
                              title="Eliminar evento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {ev.notes && (
                            <p className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700 leading-relaxed font-normal">
                              {ev.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-mono text-slate-600">
                            <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                              <Clock className="h-3.5 w-3.5 text-cyan-600" />
                              {ev.date} · {ev.time} hrs
                            </span>

                            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                              @{ev.assignee}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* MÓDULO 4: FINANZAS & CLIENTES */}
          {/* ================================================================== */}
          {activeTab === 'finances' && (
            <div className="space-y-8">
              {/* Selector de Subsección: Clientes vs Caja Neta */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Finanzas & Clientes Onboarding</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Control de caja, rentabilidad y fichas oficiales de clientes en Zenda.
                  </p>
                </div>

                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('clients')}
                    className={`rounded-lg px-4 py-2 transition-all ${
                      financeSubTab === 'clients'
                        ? 'bg-white text-slate-900 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Clientes & Onboardings ({clients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('ledger')}
                    className={`rounded-lg px-4 py-2 transition-all ${
                      financeSubTab === 'ledger'
                        ? 'bg-white text-emerald-800 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Caja Neta & Movimientos
                  </button>
                </div>
              </div>

              {/* SUBSECCIÓN A: CLIENTES & ONBOARDINGS */}
              {financeSubTab === 'clients' && (
                <div className="space-y-6">
                  {/* Barra de filtros y búsqueda */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por negocio, decisor o WhatsApp..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none hover:border-slate-300 focus:border-slate-900 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <Filter className="h-3.5 w-3.5" /> Filtrar:
                      </span>
                      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setClientFilter('all')}
                          className={`rounded-lg px-3 py-1 transition-all ${
                            clientFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Todos ({clients.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientFilter('onboarding')}
                          className={`rounded-lg px-3 py-1 transition-all ${
                            clientFilter === 'onboarding' ? 'bg-white text-cyan-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Onboardings ({clients.filter((c) => c.type === 'onboarding').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientFilter('leads')}
                          className={`rounded-lg px-3 py-1 transition-all ${
                            clientFilter === 'leads' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Leads 60s ({clients.filter((c) => c.type === 'leads').length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Clientes en Blanco */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-5 py-4">Negocio / Razón</th>
                            <th className="px-5 py-4">Decisor & WhatsApp</th>
                            <th className="px-5 py-4">Ticket Promedio</th>
                            <th className="px-5 py-4">Estado Operativo</th>
                            <th className="px-5 py-4">Avance (%)</th>
                            <th className="px-5 py-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredClients.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center font-mono text-slate-400">
                                No se encontraron clientes con los filtros aplicados.
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

                              const currentProg = client.progress ?? 25;

                              return (
                                <tr key={client.id} className="transition-colors hover:bg-slate-50/70">
                                  {/* Negocio */}
                                  <td className="px-5 py-4">
                                    <div className="font-semibold text-slate-900">{client.businessName}</div>
                                    <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-semibold ${
                                      client.type === 'leads' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                    }`}>
                                      {client.type === 'leads' ? 'Diagnóstico 60s' : 'Portal Onboarding'}
                                    </span>
                                  </td>

                                  {/* Decisor & WhatsApp */}
                                  <td className="px-5 py-4">
                                    <div className="text-slate-900 font-medium">{client.decisionMaker}</div>
                                    <div className="font-mono text-[11px] text-slate-500">{client.contact}</div>
                                  </td>

                                  {/* Ticket */}
                                  <td className="px-5 py-4 font-mono text-slate-700">
                                    {client.avgTicket || '—'}
                                  </td>

                                  {/* Estado */}
                                  <td className="px-5 py-4">
                                    <select
                                      value={client.status || 'Nuevo'}
                                      onChange={(e) => updateClientStatus(client.id, e.target.value, client.type)}
                                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-800 outline-none shadow-sm cursor-pointer"
                                    >
                                      <option value="Nuevo">Nuevo</option>
                                      <option value="En integración">En integración</option>
                                      <option value="Activo">Activo</option>
                                      <option value="Pausado">Pausado</option>
                                    </select>
                                  </td>

                                  {/* Avance */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={currentProg}
                                        onChange={(e) => updateClientProgress(client.id, e.target.value, client.type)}
                                        className="w-20 accent-slate-900 cursor-pointer"
                                      />
                                      <span className="font-mono text-[11px] text-slate-900 font-bold">{currentProg}%</span>
                                    </div>
                                  </td>

                                  {/* Acciones */}
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        WhatsApp
                                      </a>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedClientDetail(client)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        Ficha
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
                </div>
              )}

              {/* SUBSECCIÓN B: CAJA NETA & MOVIMIENTOS */}
              {financeSubTab === 'ledger' && (
                <div className="space-y-6">
                  {/* Tarjetas KPI */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-500">
                        <span>Total Ingresos</span>
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-600">
                        S/ {totalIncomePEN.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">
                        + US$ {totalIncomeUSD.toLocaleString()} USD
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-500">
                        <span>Total Egresos</span>
                        <ArrowDownRight className="h-4 w-4 text-rose-600" />
                      </div>
                      <div className="mt-3 text-2xl font-bold tracking-tight text-rose-600">
                        S/ {totalExpensePEN.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">
                        + US$ {totalExpenseUSD.toLocaleString()} USD
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-500">
                        <span>Margen Neto Operativo</span>
                        <Percent className="h-4 w-4 text-slate-900" />
                      </div>
                      <div className={`mt-3 text-2xl font-bold tracking-tight ${netPEN >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        S/ {netPEN.toLocaleString()}{' '}
                        <span className="text-sm font-normal text-slate-500 font-mono">({marginPEN}%)</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">
                        Neto USD: + US$ {netUSD.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Botón de nuevo movimiento */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Registro de Movimientos Financieros</h3>
                      <p className="text-xs text-slate-500">Almacenados en la colección Firestore: <code>zenda_finances</code></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFinanceModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm transition-all hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      + NUEVO MOVIMIENTO
                    </button>
                  </div>

                  {/* Tabla de Finanzas en Blanco */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5">Fecha</th>
                          <th className="px-5 py-3.5">Concepto</th>
                          <th className="px-5 py-3.5">Categoría</th>
                          <th className="px-5 py-3.5">Tipo</th>
                          <th className="px-5 py-3.5 text-right">Monto</th>
                          <th className="px-5 py-3.5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {finances.map((f) => (
                          <tr key={f.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-mono text-slate-600">{f.date}</td>
                            <td className="px-5 py-3.5 font-medium text-slate-900">{f.concept}</td>
                            <td className="px-5 py-3.5">
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                                {f.category}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                                  f.type === 'ingreso'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {f.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-semibold">
                              <span className={f.type === 'ingreso' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                {f.type === 'ingreso' ? '+' : '-'} {f.currency === 'PEN' ? 'S/' : '$'}{' '}
                                {Number(f.amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteFinance(f.id)}
                                className="rounded p-1 text-slate-400 hover:text-rose-600"
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
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALES DEL DASHBOARD (FONDO BLANCO, BORDES LIMPIOS, ESTILO VERCEL) */}
      {/* ==================================================================== */}

      {/* Modal 1: Nueva Tarea de Sprint */}
      {sprintModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setSprintModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                Nueva Tarea de Sprint
              </h3>
              <button
                type="button"
                onClick={() => setSprintModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSprint} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Título de la Tarea / Entregable
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cierre de guiones para batch de reels"
                  value={newSprint.title}
                  onChange={(e) => setNewSprint({ ...newSprint, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Asignado a
                  </label>
                  <select
                    value={newSprint.assignee}
                    onChange={(e) => setNewSprint({ ...newSprint, assignee: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="Angel">Angel</option>
                    <option value="Marco">Marco</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newSprint.priority}
                    onChange={(e) => setNewSprint({ ...newSprint, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="Urgente">Urgente</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Fecha Límite (Deadline)
                </label>
                <input
                  type="date"
                  required
                  value={newSprint.deadline}
                  onChange={(e) => setNewSprint({ ...newSprint, deadline: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSprintModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-mono text-slate-500 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Nuevo Reel / Contenido */}
      {contentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setContentModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                Nuevo Reel en Pipeline
              </h3>
              <button
                type="button"
                onClick={() => setContentModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddContent} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Cliente / Cuenta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dolciangel Pastelería"
                  value={newContent.client}
                  onChange={(e) => setNewContent({ ...newContent, client: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Hook o Título del Video
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej. El error de S/ 3,000 que cometen las pastelerías al tomar pedidos por WhatsApp..."
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Etapa Inicial
                  </label>
                  <select
                    value={newContent.stage}
                    onChange={(e) => setNewContent({ ...newContent, stage: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    {contentStages.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Responsable
                  </label>
                  <select
                    value={newContent.assignee}
                    onChange={(e) => setNewContent({ ...newContent, assignee: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="Angel">Angel</option>
                    <option value="Marco">Marco</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Fecha de Publicación
                  </label>
                  <input
                    type="date"
                    required
                    value={newContent.publishDate}
                    onChange={(e) => setNewContent({ ...newContent, publishDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    URL Drive / Guion (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={newContent.driveUrl}
                    onChange={(e) => setNewContent({ ...newContent, driveUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContentModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-mono text-slate-500 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
                >
                  Guardar Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Nuevo Evento de Calendario */}
      {calendarModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setCalendarModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                Agendar Evento / Rodaje
              </h3>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCalendarEvent} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Título del Evento / Motivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rodaje presencial: Set de 8 reels"
                  value={newCalendarEvent.title}
                  onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Cliente / Cuenta
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Valkiria Fitness"
                    value={newCalendarEvent.client}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, client: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={newCalendarEvent.type}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="Rodaje presencial">🎥 Rodaje presencial</option>
                    <option value="Publicación / Entrega">🚀 Publicación / Entrega</option>
                    <option value="Cobro / Facturación">💰 Cobro / Facturación</option>
                    <option value="Reunión / Sync">🤝 Reunión / Sync</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={newCalendarEvent.date}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={newCalendarEvent.time}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Responsable
                </label>
                <select
                  value={newCalendarEvent.assignee}
                  onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, assignee: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                >
                  <option value="Angel">Angel</option>
                  <option value="Marco">Marco</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Llevar equipo de iluminación, trípode y micrófonos inalámbricos..."
                  value={newCalendarEvent.notes}
                  onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-mono text-slate-500 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
                >
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Nuevo Movimiento Financiero */}
      {financeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setFinanceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                Registrar Movimiento Financiero
              </h3>
              <button
                type="button"
                onClick={() => setFinanceModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddFinance} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Tipo
                  </label>
                  <select
                    value={newFinance.type}
                    onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="ingreso">Ingreso (+)</option>
                    <option value="egreso">Egreso (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Moneda
                  </label>
                  <select
                    value={newFinance.currency}
                    onChange={(e) => setNewFinance({ ...newFinance, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="PEN">Soles (PEN S/)</option>
                    <option value="USD">Dólares (USD $)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Retainer mensual Automatización - Dolciangel"
                  value={newFinance.concept}
                  onChange={(e) => setNewFinance({ ...newFinance, concept: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newFinance.amount}
                    onChange={(e) => setNewFinance({ ...newFinance, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    value={newFinance.category}
                    onChange={(e) => setNewFinance({ ...newFinance, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                  >
                    <option value="Retainer Cliente">Retainer Cliente</option>
                    <option value="Setup">Setup / Implementación</option>
                    <option value="Pauta Ads">Pauta Ads</option>
                    <option value="Software/Herramientas">Software / Herramientas</option>
                    <option value="Operativo">Operativo</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-600 uppercase text-[10px] tracking-wider mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={newFinance.date}
                  onChange={(e) => setNewFinance({ ...newFinance, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:bg-white focus:border-slate-900 font-mono transition-all"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFinanceModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-mono text-slate-500 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Ficha Completa de Onboarding */}
      {selectedClientDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedClientDetail(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 font-semibold">
                  Ficha Completa de Cliente
                </span>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedClientDetail.businessName}
                </h2>
                {selectedClientDetail.rucOrLegal && (
                  <p className="font-mono text-xs text-slate-500">
                    RUC / Razón: {selectedClientDetail.rucOrLegal}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Decisor Principal</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedClientDetail.decisionMaker}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-600">{selectedClientDetail.contact}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Canal & Volumen</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedClientDetail.mainChannel || 'WhatsApp'}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{selectedClientDetail.weeklyVolume || 'Por definir'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Producto o Servicio Estrella</p>
                <p className="mt-1 font-medium text-slate-900">{selectedClientDetail.starProduct}</p>
                <p className="mt-1 text-xs text-cyan-800 font-mono font-semibold">Ticket: {selectedClientDetail.avgTicket}</p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-rose-700 font-semibold">Cuello de Botella Declarado</p>
                <p className="mt-1 text-slate-800 leading-relaxed">{selectedClientDetail.bottleneckProcess}</p>
              </div>

              <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-800 font-semibold">Meta a 90 Días</p>
                <p className="mt-1 font-semibold text-slate-900">{selectedClientDetail.primaryGoal}</p>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">{selectedClientDetail.goalDetail}</p>
              </div>

              {/* Accesos y links */}
              <div className="flex flex-wrap gap-3 pt-2">
                {selectedClientDetail.driveFolder && (
                  <a
                    href={selectedClientDetail.driveFolder}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 transition-all hover:border-slate-900 shadow-sm"
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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 transition-all hover:border-slate-900 shadow-sm"
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
  );
}
