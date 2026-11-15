import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Filter,
  FolderGit2,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Palette,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../firebase.js';
import usePageMeta from '../../lib/usePageMeta.js';
import { buildWhatsAppLink } from '../../lib/whatsapp.js';

const SPRING_TRANSITION = { type: 'spring', stiffness: 400, damping: 25 };

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
// 3 CLIENTES REALES OFICIALES DE ZENDA (ORDEN EXACTO Y CONTADORES EN 0)
// ============================================================================

const OFFICIAL_INITIAL_CLIENTS = [
  {
    id: 'client-dolciangel',
    order: 1,
    name: 'Dolciangel',
    category: 'Pastelería & Cafetería de Especialidad',
    brandColors: ['#F3A6B2', '#2B1B17', '#FFF8F0'],
    story: 'Repostería artesanal y café de especialidad con sedes en Villa España y Buenos Aires, Nuevo Chimbote.',
    targetAudience: '',
    valueProp: '',
    monthlyRetainer: 0,
    currency: 'PEN',
    billingDay: '05',
    currentMonthPaid: 0,
    webProgress: 0,
    automationProgress: 0,
    weeklyVideoGoal: 4,
    videosPublicadosEstaSemana: 0,
    health: 'En ritmo',
    leadOwner: 'Marco',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: '',
    n8nBotNumber: '',
    techNotes: '',
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'client-lalanchita',
    order: 2,
    name: 'Lalanchita',
    category: 'Cevichería & Gastronomía Marina',
    brandColors: ['#005F73', '#EE9B00', '#FFFFFF'],
    story: 'Tradición marina, ceviches y platos marinos frescos en Chimbote y Nuevo Chimbote.',
    targetAudience: '',
    valueProp: '',
    monthlyRetainer: 0,
    currency: 'PEN',
    billingDay: '15',
    currentMonthPaid: 0,
    webProgress: 0,
    automationProgress: 0,
    weeklyVideoGoal: 3,
    videosPublicadosEstaSemana: 0,
    health: 'En ritmo',
    leadOwner: 'Angel',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: '',
    n8nBotNumber: '',
    techNotes: '',
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'client-kings-barber-shop',
    order: 3,
    name: 'King´s barber shop',
    category: 'Barbería & Estilismo Masculino',
    brandColors: ['#111111', '#D4AF37', '#FFFFFF'],
    story: 'Servicio especializado de barbería, cortes modernos y cuidado de barba.',
    targetAudience: '',
    valueProp: '',
    monthlyRetainer: 0,
    currency: 'PEN',
    billingDay: '10',
    currentMonthPaid: 0,
    webProgress: 0,
    automationProgress: 0,
    weeklyVideoGoal: 3,
    videosPublicadosEstaSemana: 0,
    health: 'En ritmo',
    leadOwner: 'Angel',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: '',
    n8nBotNumber: '',
    techNotes: '',
    createdAt: '2026-11-03T10:00:00.000Z',
  },
];

// Ordenador consistente para mantener: 1) Dolciangel, 2) Lalanchita, 3) King´s barber shop
function sortClientsOfficialOrder(list) {
  const priorityMap = {
    dolciangel: 1,
    lalanchita: 2,
    'la lanchita': 2,
    'king´s barber shop': 3,
    "king's barber shop": 3,
  };
  return [...list].sort((a, b) => {
    const oa = a.order ?? priorityMap[(a.name || '').toLowerCase().trim()] ?? 99;
    const ob = b.order ?? priorityMap[(b.name || '').toLowerCase().trim()] ?? 99;
    if (oa !== ob) return oa - ob;
    return (a.name || '').localeCompare(b.name || '');
  });
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminDashboard() {
  usePageMeta({
    title: 'Zenda OS · Command Center & Clientes 360°',
    description: 'Command Center operativo de Zenda: Clientes 360°, Taller de Guiones, Sprints, Calendario y Finanzas.',
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

  // Secciones del Sidebar:
  // 'command' | 'clients' | 'pipeline' | 'calendar' | 'finances'
  const [activeTab, setActiveTab] = useState('command');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de colecciones reales (sin transacciones ni tareas falsas)
  const [zendaClients, setZendaClients] = useState(OFFICIAL_INITIAL_CLIENTS);
  const [scriptsList, setScriptsList] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [finances, setFinances] = useState([]);
  const [inboundOnboardings, setInboundOnboardings] = useState([]);

  // Estado de Clientes 360°
  const [selectedClient360Id, setSelectedClient360Id] = useState(null);
  const [client360Tab, setClient360Tab] = useState('finances'); // 'finances' | 'scripts' | 'infra' | 'dossier'
  const [activeScriptId, setActiveScriptId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modal de confirmación "Reiniciar Base Real"
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResettingBase, setIsResettingBase] = useState(false);

  // Modal: Registrar Pago / Abono en Vista 360°
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(() => ({
    amount: '',
    date: getTodayDate(),
    method: 'Transferencia Bancaria',
    note: '',
  }));

  // Modal: + Nuevo Cliente
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    category: '',
    monthlyRetainer: '0',
    currency: 'PEN',
    billingDay: '05',
    driveFolder: '',
    story: '',
    targetAudience: '',
    valueProp: '',
    color1: '#0F172A',
    color2: '#06B6D4',
    color3: '#FFFFFF',
    webProgress: 0,
    automationProgress: 0,
    weeklyVideoGoal: 3,
    leadOwner: 'Angel',
    contact: '',
  });

  // Modales de otros módulos
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [newSprint, setNewSprint] = useState(() => ({
    title: '',
    client: 'Dolciangel',
    assignee: 'Angel',
    priority: 'Alta',
    deadline: getTodayDate(),
  }));

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [newContent, setNewContent] = useState(() => ({
    title: '',
    client: 'Dolciangel',
    stage: 'Guion listo',
    assignee: 'Angel',
    publishDate: getTodayDate(),
    driveUrl: '',
  }));

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [newCalendarEvent, setNewCalendarEvent] = useState(() => ({
    title: '',
    client: 'Dolciangel',
    type: 'Rodaje presencial',
    date: getTodayDate(),
    time: '10:00',
    assignee: 'Angel',
    notes: '',
  }));

  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [newFinance, setNewFinance] = useState(() => ({
    concept: '',
    client: 'Dolciangel',
    amount: '',
    currency: 'PEN',
    type: 'ingreso',
    category: 'Retainer Cliente',
    date: getTodayDate(),
  }));

  const [selectedOnboardingDetail, setSelectedOnboardingDetail] = useState(null);

  // Filtros dinámicos (todos incluyen filtro por cliente real)
  const [sprintFilter, setSprintFilter] = useState('all'); // all | Angel | Marco | pending
  const [sprintClientFilter, setSprintClientFilter] = useState('all');
  const [contentStageFilter, setContentStageFilter] = useState('all');
  const [contentClientFilter, setContentClientFilter] = useState('all');
  const [calendarTypeFilter, setCalendarTypeFilter] = useState('all');
  const [calendarClientFilter, setCalendarClientFilter] = useState('all');
  const [financeClientFilter, setFinanceClientFilter] = useState('all');
  const [financeSubTab, setFinanceSubTab] = useState('ledger'); // 'ledger' | 'onboardings'
  const [onboardingSearch, setOnboardingSearch] = useState('');

  // Calendario mensual
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const weekLabel = useMemo(() => getCurrentWeekLabel(), []);
  const todayDateStr = useMemo(() => getTodayDate(), []);

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2400);
  };

  // ============================================================================
  // SINCRONIZACIÓN EN TIEMPO REAL CON FIRESTORE (onSnapshot)
  // ============================================================================
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let unsubZendaClients;
    let unsubScripts;
    let unsubSprints;
    let unsubContent;
    let unsubCalendar;
    let unsubFinances;
    let unsubOnboarding;
    let unsubLeads;

    import('firebase/firestore').then(
      ({ collection, onSnapshot, query, orderBy, doc, setDoc }) => {
        // 1. zenda_clients (Si está vacía, siembra automáticamente los 3 clientes reales)
        try {
          const colClients = collection(db, 'zenda_clients');
          unsubZendaClients = onSnapshot(
            colClients,
            async (snapshot) => {
              if (snapshot.empty) {
                try {
                  await Promise.all(
                    OFFICIAL_INITIAL_CLIENTS.map((client) =>
                      setDoc(doc(db, 'zenda_clients', client.id), client),
                    ),
                  );
                } catch (seedErr) {
                  console.warn('[Firestore] No se pudo sembrar zenda_clients:', seedErr);
                }
              } else {
                const liveClients = snapshot.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                }));
                setZendaClients(sortClientsOfficialOrder(liveClients));
              }
            },
            (err) => console.warn('[Firestore] zenda_clients listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query zenda_clients:', e);
        }

        // 2. zenda_scripts
        try {
          const colScripts = collection(db, 'zenda_scripts');
          unsubScripts = onSnapshot(
            colScripts,
            (snapshot) => {
              const liveScripts = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              }));
              setScriptsList(liveScripts);
            },
            (err) => console.warn('[Firestore] zenda_scripts listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query zenda_scripts:', e);
        }

        // 3. zenda_sprints
        try {
          const qSprints = query(collection(db, 'zenda_sprints'), orderBy('deadline', 'asc'));
          unsubSprints = onSnapshot(
            qSprints,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
              setSprints(live);
            },
            (err) => console.warn('[Firestore] Sprints listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query sprints:', e);
        }

        // 4. zenda_content
        try {
          const qContent = query(collection(db, 'zenda_content'), orderBy('publishDate', 'asc'));
          unsubContent = onSnapshot(
            qContent,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
              setContentList(live);
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
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
              setCalendarEvents(live);
            },
            (err) => console.warn('[Firestore] Calendar listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query calendar:', e);
        }

        // 6. zenda_finances
        try {
          const colFinances = collection(db, 'zenda_finances');
          unsubFinances = onSnapshot(
            colFinances,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
              live.sort((a, b) => {
                const da = a.fecha || a.date || '';
                const dbDate = b.fecha || b.date || '';
                return dbDate.localeCompare(da);
              });
              setFinances(live);
            },
            (err) => console.warn('[Firestore] Finances listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query finances:', e);
        }

        // 7. client_onboarding & leads
        try {
          const qOnboarding = query(collection(db, 'client_onboarding'), orderBy('createdAt', 'desc'));
          unsubOnboarding = onSnapshot(
            qOnboarding,
            (snapshot) => {
              const liveOnboardings = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                type: 'onboarding',
              }));
              setInboundOnboardings((prev) => {
                const leadsOnly = prev.filter((c) => c.type === 'leads');
                return [...liveOnboardings, ...leadsOnly];
              });
            },
            (err) => console.warn('[Firestore] Onboarding listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query onboarding:', e);
        }

        try {
          const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
          unsubLeads = onSnapshot(
            qLeads,
            (snapshot) => {
              const liveLeads = snapshot.docs.map((d) => ({
                id: d.id,
                businessName: d.data().business || d.data().name || 'Prospecto Web',
                decisionMaker: d.data().name || 'Decisor',
                contact: d.data().whatsapp || 'Sin teléfono',
                starProduct: d.data().industry || 'Diagnóstico 60s',
                avgTicket: d.data().budget || 'Sin definir',
                bottleneckProcess: d.data().bottleneck || 'Diagnóstico 60s',
                primaryGoal: 'Diagnóstico 60s',
                type: 'leads',
                ...d.data(),
              }));
              setInboundOnboardings((prev) => {
                const onboardingsOnly = prev.filter((c) => c.type !== 'leads');
                return [...onboardingsOnly, ...liveLeads];
              });
            },
            (err) => console.warn('[Firestore] Leads listener:', err),
          );
        } catch (e) {
          console.warn('[Firestore] Error query leads:', e);
        }
      },
    );

    return () => {
      if (unsubZendaClients) unsubZendaClients();
      if (unsubScripts) unsubScripts();
      if (unsubSprints) unsubSprints();
      if (unsubContent) unsubContent();
      if (unsubCalendar) unsubCalendar();
      if (unsubFinances) unsubFinances();
      if (unsubOnboarding) unsubOnboarding();
      if (unsubLeads) unsubLeads();
    };
  }, []);

  // ============================================================================
  // PURGA TOTAL Y REINICIO DE BASE REAL EN FIRESTORE
  // ============================================================================

  const handleResetRealDatabase = async () => {
    setIsResettingBase(true);
    try {
      if (isFirebaseConfigured && db) {
        const { collection, getDocs, deleteDoc, doc, setDoc } = await import(
          'firebase/firestore'
        );

        const collectionsToPurge = [
          'zenda_clients',
          'zenda_sprints',
          'zenda_content',
          'zenda_calendar',
          'zenda_finances',
          'zenda_scripts',
        ];

        for (const colName of collectionsToPurge) {
          const snap = await getDocs(collection(db, colName));
          const deletions = snap.docs.map((d) => deleteDoc(doc(db, colName, d.id)));
          await Promise.all(deletions);
        }

        // Sembrar únicamente los 3 clientes reales oficiales con contadores en 0
        await Promise.all(
          OFFICIAL_INITIAL_CLIENTS.map((client) =>
            setDoc(doc(db, 'zenda_clients', client.id), client),
          ),
        );
      }

      setZendaClients(OFFICIAL_INITIAL_CLIENTS);
      setSprints([]);
      setContentList([]);
      setCalendarEvents([]);
      setFinances([]);
      setScriptsList([]);
      setSelectedClient360Id(null);
      setResetModalOpen(false);
      showToast('Base real reiniciada: Dolciangel, Lalanchita y King´s barber shop');
    } catch (err) {
      console.warn('[Firestore] Error al reiniciar base real:', err);
      showToast('Error al reiniciar base en Firestore');
    } finally {
      setIsResettingBase(false);
    }
  };

  // Cliente actualmente seleccionado para Vista 360°
  const selectedClient360 = useMemo(
    () => zendaClients.find((c) => c.id === selectedClient360Id) || null,
    [zendaClients, selectedClient360Id],
  );

  // Guiones del cliente seleccionado en Vista 360°
  const clientScripts = useMemo(
    () => scriptsList.filter((s) => s.clientId === selectedClient360Id),
    [scriptsList, selectedClient360Id],
  );

  // Guion activo en el editor Notion
  const activeScript = useMemo(() => {
    if (!clientScripts.length) return null;
    return clientScripts.find((s) => s.id === activeScriptId) || clientScripts[0];
  }, [clientScripts, activeScriptId]);

  const handleCopyText = async (text, label = 'Copiado al portapapeles') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch (err) {
      console.warn('Error copiando al portapapeles:', err);
    }
  };

  // ============================================================================
  // ACCIONES: CLIENTES 360° ('zenda_clients') & PAGO BIDIRECCIONAL
  // ============================================================================

  const handleOpenClient360 = (clientId, initialSubTab = 'finances') => {
    setSelectedClient360Id(clientId);
    setClient360Tab(initialSubTab);
    const firstScript = scriptsList.find((s) => s.clientId === clientId);
    setActiveScriptId(firstScript ? firstScript.id : null);
    setActiveTab('clients');
  };

  const handleUpdateClientField = async (clientId, updates, toastText = 'Guardado en Zenda OS') => {
    setZendaClients((prev) =>
      sortClientsOfficialOrder(
        prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c)),
      ),
    );
    if (toastText) showToast(toastText);

    if (isFirebaseConfigured && db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'zenda_clients', clientId), updates, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Error actualizando cliente:', err);
      }
    }
  };

  const handleUpdateClientBrandColor = async (client, colorIndex, newHex) => {
    const nextColors = [...(client.brandColors || ['#0F172A', '#06B6D4', '#FFFFFF'])];
    nextColors[colorIndex] = newHex;
    await handleUpdateClientField(client.id, { brandColors: nextColors }, 'Color HEX guardado en Zenda OS');
  };

  // Registrar Pago / Abono (Conexión Bidireccional Cliente -> zenda_finances)
  const handleRegisterClientPayment = async (e) => {
    e.preventDefault();
    if (!selectedClient360 || !paymentForm.amount) return;

    const montoAbonado = Number(paymentForm.amount);
    if (Number.isNaN(montoAbonado) || montoAbonado <= 0) return;

    const fechaActual = paymentForm.date || getTodayDate();
    const newPaidTotal = Number(selectedClient360.currentMonthPaid || 0) + montoAbonado;

    // 1. Suma el monto a 'currentMonthPaid' del cliente
    await handleUpdateClientField(
      selectedClient360.id,
      { currentMonthPaid: newPaidTotal },
      '',
    );

    // 2. Crea automáticamente el documento en 'zenda_finances'
    const financeDoc = {
      tipo: 'INGRESO',
      type: 'ingreso',
      concepto: 'Abono Retainer - ' + selectedClient360.name,
      concept: 'Abono Retainer - ' + selectedClient360.name,
      monto: montoAbonado,
      amount: montoAbonado,
      currency: selectedClient360.currency || 'PEN',
      categoria: 'Retainer Cliente',
      category: 'Retainer Cliente',
      fecha: fechaActual,
      date: fechaActual,
      metodoPago: paymentForm.method,
      nota: paymentForm.note.trim(),
      clientId: selectedClient360.id,
      clientName: selectedClient360.name,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'zenda_finances'), {
          ...financeDoc,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Firestore] Error creando abono en zenda_finances:', err);
      }
    } else {
      setFinances((prev) => [{ id: `local-fin-${Date.now()}`, ...financeDoc }, ...prev]);
    }

    setPaymentForm({
      amount: '',
      date: getTodayDate(),
      method: 'Transferencia Bancaria',
      note: '',
    });
    setPaymentModalOpen(false);
    showToast('Pago registrado en caja');
  };

  // Crear Nuevo Cliente en 'zenda_clients'
  const handleCreateNewClient = async (e) => {
    e.preventDefault();
    if (!newClientForm.name.trim()) return;

    const slugId = `client-${newClientForm.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const clientRecord = {
      id: slugId,
      order: zendaClients.length + 1,
      name: newClientForm.name.trim(),
      category: newClientForm.category.trim() || 'Servicios & Comercio',
      brandColors: [
        newClientForm.color1 || '#0F172A',
        newClientForm.color2 || '#06B6D4',
        newClientForm.color3 || '#FFFFFF',
      ],
      story: newClientForm.story.trim() || '',
      targetAudience: newClientForm.targetAudience.trim() || '',
      valueProp: newClientForm.valueProp.trim() || '',
      monthlyRetainer: Number(newClientForm.monthlyRetainer) || 0,
      currency: newClientForm.currency || 'PEN',
      billingDay: String(newClientForm.billingDay || '05').padStart(2, '0'),
      currentMonthPaid: 0,
      webProgress: Number(newClientForm.webProgress) || 0,
      automationProgress: Number(newClientForm.automationProgress) || 0,
      weeklyVideoGoal: Number(newClientForm.weeklyVideoGoal) || 3,
      videosPublicadosEstaSemana: 0,
      health: 'En ritmo',
      leadOwner: newClientForm.leadOwner || 'Angel',
      contact: newClientForm.contact.trim() || '',
      driveFolder: newClientForm.driveFolder.trim() || '',
      githubRepo: '',
      firebaseProjectId: '',
      n8nBotNumber: '',
      techNotes: '',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'zenda_clients', slugId), clientRecord);
      } catch (err) {
        console.warn('[Firestore] Error creando nuevo cliente:', err);
      }
    } else {
      setZendaClients((prev) => sortClientsOfficialOrder([...prev, clientRecord]));
    }

    setNewClientModalOpen(false);
    showToast('Guardado en Zenda OS');
    setNewClientForm({
      name: '',
      category: '',
      monthlyRetainer: '0',
      currency: 'PEN',
      billingDay: '05',
      driveFolder: '',
      story: '',
      targetAudience: '',
      valueProp: '',
      color1: '#0F172A',
      color2: '#06B6D4',
      color3: '#FFFFFF',
      webProgress: 0,
      automationProgress: 0,
      weeklyVideoGoal: 3,
      leadOwner: 'Angel',
      contact: '',
    });
  };

  // ============================================================================
  // ACCIONES: TALLER DE GUIONES ('zenda_scripts')
  // ============================================================================

  const handleCreateScript = async () => {
    if (!selectedClient360) return;

    const newId = `scr-${Date.now()}`;
    const newScriptDoc = {
      id: newId,
      clientId: selectedClient360.id,
      clientName: selectedClient360.name,
      title: 'Nuevo Guion de Video',
      hook: '',
      body: '',
      cta: '',
      status: 'Borrador',
      updatedAt: new Date().toISOString(),
    };

    setScriptsList((prev) => [newScriptDoc, ...prev]);
    setActiveScriptId(newId);
    showToast('Nuevo guion creado en Zenda OS');

    if (isFirebaseConfigured && db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'zenda_scripts', newId), newScriptDoc);
      } catch (err) {
        console.warn('[Firestore] Error creando guion:', err);
      }
    }
  };

  const handleUpdateScript = async (scriptId, updates, notify = false) => {
    setScriptsList((prev) =>
      prev.map((s) =>
        s.id === scriptId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s,
      ),
    );
    if (notify) showToast('Guardado en Zenda OS');

    if (isFirebaseConfigured && db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(
          doc(db, 'zenda_scripts', scriptId),
          { ...updates, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch (err) {
        console.warn('[Firestore] Error actualizando guion:', err);
      }
    }
  };

  // Switch rápido: "Marcar como Publicado" -> Suma +1 a videosPublicadosEstaSemana del cliente
  const handleToggleScriptPublished = async (script) => {
    if (!script || !selectedClient360) return;

    const wasPublished = script.status === 'Publicado';
    const nextStatus = wasPublished ? 'En Edición IA' : 'Publicado';

    await handleUpdateScript(script.id, { status: nextStatus });

    const currentCount = Number(selectedClient360.videosPublicadosEstaSemana || 0);
    const nextCount = wasPublished ? Math.max(0, currentCount - 1) : currentCount + 1;

    await handleUpdateClientField(
      selectedClient360.id,
      { videosPublicadosEstaSemana: nextCount },
      wasPublished ? 'Guion desmarcado como publicado' : 'Guardado en Zenda OS (+1 video publicado)',
    );
  };

  const handleDeleteScript = async (scriptId) => {
    setScriptsList((prev) => prev.filter((s) => s.id !== scriptId));
    if (activeScriptId === scriptId) {
      setActiveScriptId(null);
    }
    showToast('Guion eliminado');
    if (isFirebaseConfigured && db) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_scripts', scriptId));
      } catch (err) {
        console.warn('[Firestore] Error eliminando guion:', err);
      }
    }
  };

  const handleCopyScriptForAgent = (script, client) => {
    if (!script) return;
    const formattedPrompt = [
      `=== GUION DE PRODUCCIÓN ZENDA OS ===`,
      `Cliente: ${client?.name || script.clientName} (${client?.category || ''})`,
      `Estado: ${script.status}`,
      `Título / Idea: ${script.title}`,
      ``,
      `[HOOK - PRIMEROS 3 SEGUNDOS]`,
      `${script.hook}`,
      ``,
      `[ESTRUCTURA VISUAL & CUERPO DEL GUION]`,
      `${script.body}`,
      ``,
      `[CALL TO ACTION (CTA)]`,
      `${script.cta}`,
    ].join('\n');

    handleCopyText(formattedPrompt, 'Guion copiado');
  };

  // ============================================================================
  // ACCIONES: SPRINTS, PIPELINE, CALENDARIO Y FINANZAS
  // ============================================================================

  const handleToggleSprint = async (sprintId, currentCompleted) => {
    const nextVal = !currentCompleted;
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, completed: nextVal } : s)),
    );
    showToast('Guardado en Zenda OS');

    if (isFirebaseConfigured && db && !sprintId.startsWith('local-sp-')) {
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
      client: newSprint.client || zendaClients[0]?.name || 'Dolciangel',
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
    } else {
      setSprints((prev) => [{ id: `local-sp-${Date.now()}`, ...record }, ...prev]);
    }

    setNewSprint({
      title: '',
      client: zendaClients[0]?.name || 'Dolciangel',
      assignee: 'Angel',
      priority: 'Alta',
      deadline: getTodayDate(),
    });
    setSprintModalOpen(false);
    showToast('Guardado en Zenda OS');
  };

  const handleDeleteSprint = async (id) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
    showToast('Tarea eliminada');
    if (isFirebaseConfigured && db && !id.startsWith('local-sp-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_sprints', id));
      } catch (err) {
        console.warn('[Firestore] Error delete sprint:', err);
      }
    }
  };

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
    } else {
      setContentList((prev) => [...prev, { id: `local-cnt-${Date.now()}`, ...record }]);
    }

    setNewContent({
      title: '',
      client: zendaClients[0]?.name || 'Dolciangel',
      stage: 'Guion listo',
      assignee: 'Angel',
      publishDate: getTodayDate(),
      driveUrl: '',
    });
    setContentModalOpen(false);
    showToast('Guardado en Zenda OS');
  };

  const handleUpdateContentStage = async (id, newStage) => {
    setContentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c)),
    );
    showToast('Guardado en Zenda OS');
    if (isFirebaseConfigured && db && !id.startsWith('local-cnt-')) {
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
    showToast('Guardado en Zenda OS');
    if (isFirebaseConfigured && db && !id.startsWith('local-cnt-')) {
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
    showToast('Pieza eliminada');
    if (isFirebaseConfigured && db && !id.startsWith('local-cnt-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_content', id));
      } catch (err) {
        console.warn('[Firestore] Error delete content:', err);
      }
    }
  };

  const handleAddCalendarEvent = async (e) => {
    e.preventDefault();
    if (!newCalendarEvent.title.trim()) return;

    const record = {
      title: newCalendarEvent.title.trim(),
      client: newCalendarEvent.client.trim() || zendaClients[0]?.name || 'Dolciangel',
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
    } else {
      setCalendarEvents((prev) => [...prev, { id: `local-cal-${Date.now()}`, ...record }]);
    }

    setNewCalendarEvent({
      title: '',
      client: zendaClients[0]?.name || 'Dolciangel',
      type: 'Rodaje presencial',
      date: getTodayDate(),
      time: '10:00',
      assignee: 'Angel',
      notes: '',
    });
    setCalendarModalOpen(false);
    showToast('Guardado en Zenda OS');
  };

  const handleToggleCalendarCompleted = async (id, currentVal) => {
    const nextVal = !currentVal;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, completed: nextVal } : ev)),
    );
    showToast('Guardado en Zenda OS');
    if (isFirebaseConfigured && db && !id.startsWith('local-cal-')) {
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
    showToast('Evento eliminado');
    if (isFirebaseConfigured && db && !id.startsWith('local-cal-')) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'zenda_calendar', id));
      } catch (err) {
        console.warn('[Firestore] Error delete calendar:', err);
      }
    }
  };

  const handleAddFinance = async (e) => {
    e.preventDefault();
    if (!newFinance.concept.trim() || !newFinance.amount) return;

    const parsedAmount = parseFloat(newFinance.amount);
    const isIngreso = newFinance.type === 'ingreso';

    const record = {
      tipo: isIngreso ? 'INGRESO' : 'EGRESO',
      type: isIngreso ? 'ingreso' : 'egreso',
      concepto: newFinance.concept.trim(),
      concept: newFinance.concept.trim(),
      clientName: newFinance.client || 'General',
      monto: parsedAmount,
      amount: parsedAmount,
      currency: newFinance.currency,
      categoria: newFinance.category,
      category: newFinance.category,
      fecha: newFinance.date,
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
    } else {
      setFinances((prev) => [{ id: `local-fin-${Date.now()}`, ...record }, ...prev]);
    }

    setNewFinance({
      concept: '',
      client: zendaClients[0]?.name || 'Dolciangel',
      amount: '',
      currency: 'PEN',
      type: 'ingreso',
      category: 'Retainer Cliente',
      date: getTodayDate(),
    });
    setFinanceModalOpen(false);
    showToast('Pago registrado en caja');
  };

  const handleDeleteFinance = async (id) => {
    setFinances((prev) => prev.filter((f) => f.id !== id));
    showToast('Movimiento eliminado');
    if (isFirebaseConfigured && db && !id.startsWith('local-fin-')) {
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
  const sprintProgressPercent =
    totalSprintsCount > 0 ? Math.round((completedSprintsCount / totalSprintsCount) * 100) : 0;

  const filteredSprints = sprints.filter((s) => {
    const matchesAssignee =
      sprintFilter === 'all' ||
      (sprintFilter === 'Angel' && s.assignee === 'Angel') ||
      (sprintFilter === 'Marco' && s.assignee === 'Marco') ||
      (sprintFilter === 'pending' && !s.completed);
    const matchesClient =
      sprintClientFilter === 'all' || s.client === sprintClientFilter;
    return matchesAssignee && matchesClient;
  });

  // Semáforo de salud sobre zendaClients
  const accountsInRhythm = zendaClients.filter((c) => (c.health || 'En ritmo') === 'En ritmo').length;
  const accountsAttention = zendaClients.filter((c) => c.health === 'Requiere atención').length;
  const accountsDelayed = zendaClients.filter((c) => c.health === 'Demorado').length;

  // Pipeline de Contenido
  const contentStages = ['Guion listo', 'Por grabar', 'En edición / Agente', 'Aprobado', 'Publicado'];
  const filteredContent = contentList.filter((c) => {
    const matchesStage = contentStageFilter === 'all' || c.stage === contentStageFilter;
    const matchesClient = contentClientFilter === 'all' || c.client === contentClientFilter;
    return matchesStage && matchesClient;
  });

  // Calendario
  const filteredCalendarEvents = calendarEvents.filter((ev) => {
    const matchesType = calendarTypeFilter === 'all' || ev.type === calendarTypeFilter;
    const matchesClient = calendarClientFilter === 'all' || ev.client === calendarClientFilter;
    const matchesDay = !selectedCalendarDay || ev.date === selectedCalendarDay;
    return matchesType && matchesClient && matchesDay;
  });

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
  const isIncomeRecord = (f) =>
    String(f.tipo || f.type || '').toUpperCase() === 'INGRESO';
  const getRecordAmount = (f) => Number(f.monto ?? f.amount ?? 0);
  const getRecordCurrency = (f) => f.currency || 'PEN';

  const filteredFinances = finances.filter((f) => {
    if (financeClientFilter === 'all') return true;
    const conceptText = (f.concepto || f.concept || '').toLowerCase();
    return (
      f.clientName === financeClientFilter ||
      conceptText.includes(financeClientFilter.toLowerCase())
    );
  });

  const totalIncomePEN = finances
    .filter((f) => isIncomeRecord(f) && getRecordCurrency(f) === 'PEN')
    .reduce((acc, f) => acc + getRecordAmount(f), 0);
  const totalExpensePEN = finances
    .filter((f) => !isIncomeRecord(f) && getRecordCurrency(f) === 'PEN')
    .reduce((acc, f) => acc + getRecordAmount(f), 0);
  const netPEN = totalIncomePEN - totalExpensePEN;
  const marginPEN = totalIncomePEN > 0 ? ((netPEN / totalIncomePEN) * 100).toFixed(1) : 0;

  const totalIncomeUSD = finances
    .filter((f) => isIncomeRecord(f) && getRecordCurrency(f) === 'USD')
    .reduce((acc, f) => acc + getRecordAmount(f), 0);
  const totalExpenseUSD = finances
    .filter((f) => !isIncomeRecord(f) && getRecordCurrency(f) === 'USD')
    .reduce((acc, f) => acc + getRecordAmount(f), 0);
  const netUSD = totalIncomeUSD - totalExpenseUSD;

  // Helpers de estilos Light Workspace
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
      case 'Revisado':
        return 'border-blue-200 bg-blue-50 text-blue-700 font-medium';
      case 'Por grabar':
      case 'Borrador':
        return 'border-amber-200 bg-amber-50 text-amber-800 font-medium';
      case 'En edición / Agente':
      case 'En Edición IA':
        return 'border-purple-200 bg-purple-50 text-purple-700 font-medium';
      case 'Aprobado':
      case 'Grabado':
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

  const scriptStatuses = ['Borrador', 'Revisado', 'Grabado', 'En Edición IA', 'Publicado'];

  const sidebarNavItems = [
    {
      id: 'command',
      label: 'Command Center',
      icon: LayoutDashboard,
      accent: 'text-zenda-cyan',
      badge: sprints.filter((s) => !s.completed).length,
    },
    {
      id: 'clients',
      label: 'Clientes 360°',
      icon: Building2,
      accent: 'text-zenda-cyan',
      badge: zendaClients.length,
    },
    {
      id: 'pipeline',
      label: 'Pipeline de Contenido',
      icon: Film,
      accent: 'text-purple-400',
      badge: contentList.length,
    },
    {
      id: 'calendar',
      label: 'Calendario & Rodajes',
      icon: CalendarIcon,
      accent: 'text-cyan-400',
      badge: calendarEvents.filter((e) => !e.completed).length,
    },
    {
      id: 'finances',
      label: 'Finanzas & Caja',
      icon: Wallet,
      accent: 'text-emerald-400',
      badge: finances.length,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] antialiased selection:bg-cyan-500 selection:text-white">
      {/* Toast flotante animado en esquina inferior derecha */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="zenda-toast"
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={SPRING_TRANSITION}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-zinc-800 bg-[#09090B] px-4 py-3 font-mono text-xs font-semibold text-white shadow-2xl"
          >
            <motion.span
              initial={{ scale: 0.6 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.35 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
            >
              <Check className="h-3.5 w-3.5" />
            </motion.span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* SIDEBAR DARK (#09090B) CON DESLIZAMIENTO 'layoutId'                   */}
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
            <span className="truncate">{isFirebaseConfigured ? 'Cloud Sync Activo' : 'Modo Local'}</span>
          </div>
        </div>

        {/* Navegación Lateral con layoutId */}
        <nav className="mt-7 flex-1 space-y-1.5" aria-label="Secciones del Command Center">
          {sidebarNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_TRANSITION}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveNavIndicator"
                    transition={SPRING_TRANSITION}
                    className="absolute inset-0 rounded-xl bg-white/10"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <IconComponent className={`h-4 w-4 ${isActive ? item.accent : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="relative z-10 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                  {item.badge}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Acceso rápido a las 3 cuentas reales en el Sidebar */}
        <div className="mb-4 border-t border-[#27272A] pt-4">
          <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Cuentas Oficiales ({zendaClients.length})
          </p>
          <div className="mt-2 space-y-1">
            {zendaClients.map((client) => (
              <motion.button
                key={client.id}
                type="button"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_TRANSITION}
                onClick={() => handleOpenClient360(client.id, 'finances')}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  activeTab === 'clients' && selectedClient360Id === client.id
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                    style={{ backgroundColor: client.brandColors?.[0] || '#06B6D4' }}
                  />
                  <span className="truncate">{client.name}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">
                  {client.videosPublicadosEstaSemana ?? 0}/{client.weeklyVideoGoal ?? 3}v
                </span>
              </motion.button>
            ))}
          </div>
        </div>

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
      {/* CONTENIDO PRINCIPAL: LIGHT WORKSPACE (#F8FAFC)                       */}
      {/* ==================================================================== */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header Superior Blanco (#FFFFFF) con botón discreto "Reiniciar Base Real" */}
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
                {activeTab === 'clients' &&
                  (selectedClient360
                    ? `Clientes 360° · ${selectedClient360.name}`
                    : 'Clientes 360° · Portafolio Oficial')}
                {activeTab === 'pipeline' && 'Pipeline Audiovisual · Reels & Contenido'}
                {activeTab === 'calendar' && 'Calendario Operativo · Rodajes, Publicaciones & Cobros'}
                {activeTab === 'finances' && 'Finanzas & Caja Neta · Sincronización Bidireccional'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[11px] text-slate-600 lg:flex">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{weekLabel}</span>
            </div>

            {/* Botón discreto en el header: "Reiniciar Base Real" */}
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_TRANSITION}
              onClick={() => setResetModalOpen(true)}
              title="Purgar registros de prueba y dejar únicamente Dolciangel, Lalanchita y King´s barber shop en 0"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] font-medium text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reiniciar Base Real</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_TRANSITION}
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </motion.button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-[#27272A] bg-[#09090B] p-4 text-white md:hidden"
            >
              <div className="space-y-1.5">
                {sidebarNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-mono text-xs font-semibold uppercase ${
                      activeTab === item.id ? 'bg-white/10 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px]">{item.badge}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content con transiciones suaves AnimatePresence */}
        <main className="flex-1 p-5 md:p-8">
          <AnimatePresence mode="wait">
            {/* ================================================================ */}
            {/* MÓDULO 1: COMMAND CENTER (FOCO SEMANAL & SEMÁFORO DE CUENTAS)     */}
            {/* ================================================================ */}
            {activeTab === 'command' && (
              <motion.div
                key="tab-command"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8"
              >
                {/* Tarjetas KPI Superiores */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* KPI 1: Sprint */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#64748B]">
                      <span>Sprint Semanal</span>
                      <Sparkles className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-[#0F172A]">
                        {completedSprintsCount} de {totalSprintsCount}
                      </span>
                      <span className="font-mono text-xs font-semibold text-cyan-700">({sprintProgressPercent}%)</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sprintProgressPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-slate-900 to-cyan-600"
                      />
                    </div>
                  </motion.div>

                  {/* KPI 2: Semáforo de Cuentas */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#64748B]">
                      <span>Cuentas Oficiales ({zendaClients.length})</span>
                      <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-xs font-bold text-emerald-800">{accountsInRhythm}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="font-mono text-xs font-bold text-amber-800">{accountsAttention}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="font-mono text-xs font-bold text-rose-800">{accountsDelayed}</span>
                      </div>
                    </div>
                    <p className="mt-3 truncate font-mono text-[11px] text-slate-500">
                      {zendaClients.map((c) => c.name).join(' · ')}
                    </p>
                  </motion.div>

                  {/* KPI 3: Videos Publicados esta Semana */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#64748B]">
                      <span>Meta Videos Semana</span>
                      <Film className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-[#0F172A]">
                        {zendaClients.reduce((acc, c) => acc + Number(c.videosPublicadosEstaSemana || 0), 0)} /{' '}
                        {zendaClients.reduce((acc, c) => acc + Number(c.weeklyVideoGoal || 0), 0)}
                      </span>
                      <span className="text-xs text-slate-500">publicados</span>
                    </div>
                    <p className="mt-3 font-mono text-[11px] text-slate-500">
                      {scriptsList.length} guiones en taller
                    </p>
                  </motion.div>

                  {/* KPI 4: Balance Neto Zenda */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#64748B]">
                      <span>Balance Neto Zenda</span>
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-[#0F172A]">
                      S/ {netPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="mt-2 font-mono text-[11px] font-semibold text-emerald-700">
                      Ingresos: S/ {totalIncomePEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })} · Margen {marginPEN}%
                    </p>
                  </motion.div>
                </div>

                {/* SECCIÓN 1: SPRINT DE LA SEMANA */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-600" />
                        <h2 className="text-lg font-bold text-[#0F172A]">Sprint de la Semana</h2>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Tareas operativas en colección Firestore: <code className="font-semibold text-slate-800">zenda_sprints</code>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Filtro dinámico por Cliente */}
                      <select
                        value={sprintClientFilter}
                        onChange={(e) => setSprintClientFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] font-medium text-slate-700 outline-none focus:border-slate-900"
                      >
                        <option value="all">Todas las cuentas</option>
                        {zendaClients.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* Filtro por Responsable con layoutId */}
                      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 font-mono text-[11px]">
                        {[
                          { id: 'all', label: `Todos (${sprints.length})` },
                          { id: 'Angel', label: 'Angel' },
                          { id: 'Marco', label: 'Marco' },
                          { id: 'pending', label: 'Pendientes' },
                        ].map((tab) => {
                          const active = sprintFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSprintFilter(tab.id)}
                              className={`relative rounded-lg px-2.5 py-1 transition-colors ${
                                active ? 'font-bold text-white' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {active && (
                                <motion.div
                                  layoutId="sprintFilterActivePill"
                                  transition={SPRING_TRANSITION}
                                  className="absolute inset-0 rounded-lg bg-[#0F172A]"
                                />
                              )}
                              <span className="relative z-10">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        transition={SPRING_TRANSITION}
                        onClick={() => setSprintModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        + NUEVA TAREA
                      </motion.button>
                    </div>
                  </div>

                  {/* Lista de tareas */}
                  <div className="mt-4 divide-y divide-slate-100">
                    {filteredSprints.length === 0 ? (
                      <div className="py-10 text-center font-mono text-xs text-slate-400">
                        No hay tareas registradas en el sprint actual. Pulsa &ldquo;+ NUEVA TAREA&rdquo; para comenzar.
                      </div>
                    ) : (
                      filteredSprints.map((sprint) => {
                        const deadlineInfo = getDeadlineStatus(sprint.deadline, todayDateStr);

                        return (
                          <motion.div
                            key={sprint.id}
                            layout
                            className={`group flex flex-col gap-3 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                              sprint.completed ? 'opacity-50' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.85 }}
                                animate={{ scale: sprint.completed ? [1, 1.25, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => handleToggleSprint(sprint.id, sprint.completed)}
                                className="mt-0.5 rounded-full text-slate-400 transition-colors hover:text-slate-900"
                                title={sprint.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                              >
                                {sprint.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-700" />
                                )}
                              </motion.button>

                              <div>
                                <p className={`text-sm ${sprint.completed ? 'line-through text-slate-400 font-normal' : 'font-medium text-slate-900'}`}>
                                  {sprint.title}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {sprint.client && (
                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                                      {sprint.client}
                                    </span>
                                  )}

                                  {sprint.assignee === 'Angel' ? (
                                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                                      @Angel
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-cyan-800/60 bg-[#0B2545] px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-200">
                                      @Marco
                                    </span>
                                  )}

                                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${getPriorityBadge(sprint.priority)}`}>
                                    {sprint.priority}
                                  </span>

                                  <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${deadlineInfo.colorClass}`}>
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
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* SECCIÓN 2: SEMÁFORO DE CUENTAS OFICIALES */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <h2 className="text-lg font-bold text-[#0F172A]">Semáforo de Cuentas Oficiales</h2>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Haz clic en cualquier cuenta para abrir su Vista 360° y editar retainer, abonos, guiones y avances en vivo.
                      </p>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING_TRANSITION}
                      onClick={() => {
                        setSelectedClient360Id(null);
                        setActiveTab('clients');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Ver Portafolio 360°
                    </motion.button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                    {zendaClients.map((client) => {
                      const health = client.health || 'En ritmo';
                      const retainer = Number(client.monthlyRetainer || 0);
                      const paid = Number(client.currentMonthPaid || 0);
                      const pending = Math.max(0, retainer - paid);

                      return (
                        <motion.div
                          key={client.id}
                          whileHover={{ y: -2 }}
                          transition={SPRING_TRANSITION}
                          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 shadow-sm"
                                  style={{ backgroundColor: client.brandColors?.[0] || '#0F172A' }}
                                />
                                <div>
                                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                                    {client.name}
                                  </h3>
                                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{client.category}</p>
                                </div>
                              </div>

                              <select
                                value={health}
                                onChange={(e) => handleUpdateClientField(client.id, { health: e.target.value })}
                                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold outline-none cursor-pointer ${getHealthBadge(
                                  health,
                                )}`}
                              >
                                <option value="En ritmo">🟢 En ritmo</option>
                                <option value="Requiere atención">🟡 Requiere atención</option>
                                <option value="Demorado">🔴 Demorado</option>
                              </select>
                            </div>

                            <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {client.story}
                            </p>

                            {/* Barras animadas de avance técnico */}
                            <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                              <div>
                                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                                  <span>Web</span>
                                  <span className="font-bold text-slate-900">{client.webProgress ?? 0}%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${client.webProgress ?? 0}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full bg-slate-900"
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                                  <span>Bots IA</span>
                                  <span className="font-bold text-cyan-700">{client.automationProgress ?? 0}%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${client.automationProgress ?? 0}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full bg-cyan-600"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Estado financiero y videos */}
                            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs">
                              <span className="font-mono text-[11px] text-slate-500">
                                Retainer: S/ {retainer.toFixed(0)} ·{' '}
                                {pending === 0 ? (
                                  <span className="font-bold text-emerald-700">Al día</span>
                                ) : (
                                  <span className="font-bold text-amber-700">Resta S/ {pending.toFixed(0)}</span>
                                )}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-800">
                                Videos: {client.videosPublicadosEstaSemana ?? 0}/{client.weeklyVideoGoal ?? 3}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="font-mono text-[11px] text-slate-500">
                              Lead: <span className="font-bold text-slate-900">{client.leadOwner || 'Angel'}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <motion.button
                                type="button"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.96 }}
                                transition={SPRING_TRANSITION}
                                onClick={() => handleOpenClient360(client.id, 'scripts')}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                              >
                                Guiones
                              </motion.button>
                              <motion.button
                                type="button"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.96 }}
                                transition={SPRING_TRANSITION}
                                onClick={() => handleOpenClient360(client.id, 'finances')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#0F172A] px-3 py-1.5 font-mono text-[11px] font-semibold text-white hover:bg-slate-800"
                              >
                                Vista 360°
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* MÓDULO 2: CLIENTES 360° & TALLER DE GUIONES TIPO NOTION          */}
            {/* ================================================================ */}
            {activeTab === 'clients' && (
              <motion.div
                key={selectedClient360 ? `client-360-${selectedClient360.id}` : 'clients-portfolio'}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8"
              >
                {!selectedClient360 ? (
                  /* VISTA A: GRID DE PORTAFOLIO DE LOS 3 CLIENTES OFICIALES */
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-cyan-600" />
                          <h2 className="text-xl font-bold text-[#0F172A]">Portafolio Oficial de Clientes 360°</h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Selecciona un cliente para abrir su centro de operaciones 360° (Finanzas en vivo, Taller de Guiones Notion, Infraestructura y Marca).
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        transition={SPRING_TRANSITION}
                        onClick={() => setNewClientModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        + NUEVO CLIENTE
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {zendaClients.map((client) => {
                        const retainer = Number(client.monthlyRetainer || 0);
                        const paid = Number(client.currentMonthPaid || 0);
                        const remaining = Math.max(0, retainer - paid);

                        return (
                          <motion.div
                            key={client.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.99 }}
                            transition={SPRING_TRANSITION}
                            onClick={() => handleOpenClient360(client.id, 'finances')}
                            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:border-slate-400 hover:shadow-md"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {(client.brandColors || []).map((hex, i) => (
                                    <span
                                      key={`${client.id}-color-${i}`}
                                      className="h-4 w-4 rounded-full border border-slate-300 shadow-sm"
                                      style={{ backgroundColor: hex }}
                                      title={`Color de marca: ${hex}`}
                                    />
                                  ))}
                                </div>

                                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getHealthBadge(client.health || 'En ritmo')}`}>
                                  {client.health || 'En ritmo'}
                                </span>
                              </div>

                              <h3 className="mt-4 text-xl font-bold text-[#0F172A] transition-colors group-hover:text-cyan-700">
                                {client.name}
                              </h3>
                              <p className="font-mono text-xs font-medium text-slate-500">
                                {client.category}
                              </p>

                              <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                                {client.story}
                              </p>

                              <div className="mt-5 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-mono text-[11px] text-slate-500">Retainer Mensual:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {client.currency === 'USD' ? 'US$' : 'S/'}{' '}
                                    {retainer.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-xs">
                                  <span className="font-mono text-[11px] text-slate-500">
                                    Cobro: Día {client.billingDay}
                                  </span>
                                  {remaining === 0 ? (
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                                      ✓ Al día
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800">
                                      Por cobrar: S/ {remaining.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2.5">
                                <div>
                                  <div className="flex justify-between font-mono text-[11px]">
                                    <span className="text-slate-600">Avance Web</span>
                                    <span className="font-bold text-slate-900">{client.webProgress ?? 0}%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${client.webProgress ?? 0}%` }}
                                      transition={{ duration: 0.6, ease: 'easeOut' }}
                                      className="h-full rounded-full bg-slate-900"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between font-mono text-[11px]">
                                    <span className="text-slate-600">Avance Automatizaciones</span>
                                    <span className="font-bold text-cyan-700">{client.automationProgress ?? 0}%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${client.automationProgress ?? 0}%` }}
                                      transition={{ duration: 0.6, ease: 'easeOut' }}
                                      className="h-full rounded-full bg-cyan-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                              <span className="font-mono text-xs font-semibold text-slate-700">
                                🎬 Videos sem: {client.videosPublicadosEstaSemana ?? 0} / {client.weeklyVideoGoal ?? 3}
                              </span>

                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-900 transition-transform group-hover:translate-x-0.5">
                                Abrir Vista 360° →
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* ============================================================ */
                  /* VISTA B: VISTA 360° DEL CLIENTE SELECCIONADO                 */
                  /* ============================================================ */
                  <div className="space-y-6">
                    {/* Cabecera Ejecutiva con Selector Rápido de Cuenta */}
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            transition={SPRING_TRANSITION}
                            onClick={() => setSelectedClient360Id(null)}
                            className="mt-0.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Clientes
                          </motion.button>

                          <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h2 className="text-2xl font-bold text-[#0F172A]">{selectedClient360.name}</h2>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-mono text-xs text-slate-600">
                                {selectedClient360.category}
                              </span>
                              <div className="flex items-center gap-1">
                                {(selectedClient360.brandColors || []).map((hex, idx) => (
                                  <span
                                    key={`hdr-color-${idx}`}
                                    className="h-3.5 w-3.5 rounded-full border border-slate-300"
                                    style={{ backgroundColor: hex }}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{selectedClient360.story}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Selector dinámico para cambiar entre Dolciangel, Lalanchita y King´s barber shop */}
                          <select
                            value={selectedClient360.id}
                            onChange={(e) => handleOpenClient360(e.target.value, client360Tab)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-900 outline-none focus:border-slate-900"
                          >
                            {zendaClients.map((c) => (
                              <option key={c.id} value={c.id}>
                                Cuenta: {c.name}
                              </option>
                            ))}
                          </select>

                          {selectedClient360.driveFolder && (
                            <a
                              href={selectedClient360.driveFolder}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                            >
                              <FolderGit2 className="h-3.5 w-3.5 text-cyan-600" />
                              Drive
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Navegación Interna de las 4 Pestañas 360° con layoutId */}
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {[
                          { id: 'finances', label: 'A. Finanzas & Estado de Pago', icon: CreditCard },
                          { id: 'scripts', label: `B. Taller de Guiones (${clientScripts.length})`, icon: FileText },
                          { id: 'infra', label: 'C. Infraestructura & Avance Técnico', icon: Code2 },
                          { id: 'dossier', label: 'D. Dossier & Marca', icon: Palette },
                        ].map((t) => {
                          const TabIcon = t.icon;
                          const isActive = client360Tab === t.id;
                          return (
                            <motion.button
                              key={t.id}
                              type="button"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              transition={SPRING_TRANSITION}
                              onClick={() => setClient360Tab(t.id)}
                              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="client360InternalTabIndicator"
                                  transition={SPRING_TRANSITION}
                                  className="absolute inset-0 rounded-xl bg-[#0F172A] shadow-sm"
                                />
                              )}
                              <TabIcon className="relative z-10 h-4 w-4" />
                              <span className="relative z-10">{t.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {/* ======================================================== */}
                      {/* PESTAÑA A: FINANZAS & ESTADO DE PAGO (EDICIÓN EN VIVO)    */}
                      {/* ======================================================== */}
                      {client360Tab === 'finances' && (
                        <motion.div
                          key="360-finances"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-6"
                        >
                          {(() => {
                            const retainer = Number(selectedClient360.monthlyRetainer || 0);
                            const paid = Number(selectedClient360.currentMonthPaid || 0);
                            const remaining = Math.max(0, retainer - paid);
                            const currencySymbol = selectedClient360.currency === 'USD' ? 'US$' : 'S/';
                            const clientPayments = finances.filter(
                              (f) =>
                                f.clientId === selectedClient360.id ||
                                (f.concepto || f.concept || '')
                                  .toLowerCase()
                                  .includes(selectedClient360.name.toLowerCase()),
                            );

                            return (
                              <>
                                {/* 3 Tarjetas con Edición Rápida en Vivo */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                  {/* 1. Retainer Mensual Acordado + Día de Cobro Editable en Vivo */}
                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#64748B]">
                                      1. Retainer Mensual Pactado
                                    </span>
                                    <div className="mt-3 flex items-center gap-2">
                                      <span className="font-mono text-xl font-bold text-slate-400">
                                        {currencySymbol}
                                      </span>
                                      <input
                                        type="number"
                                        step="10"
                                        min="0"
                                        value={selectedClient360.monthlyRetainer ?? 0}
                                        onChange={(e) =>
                                          handleUpdateClientField(
                                            selectedClient360.id,
                                            { monthlyRetainer: Number(e.target.value) },
                                            'Retainer actualizado en Zenda OS',
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 font-mono text-2xl font-bold text-[#0F172A] outline-none focus:border-slate-900 focus:bg-white"
                                      />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between font-mono text-xs text-slate-500">
                                      <span>Día de cobro mensual:</span>
                                      <input
                                        type="text"
                                        maxLength={2}
                                        value={selectedClient360.billingDay || '05'}
                                        onChange={(e) =>
                                          handleUpdateClientField(
                                            selectedClient360.id,
                                            { billingDay: e.target.value },
                                            'Día de cobro actualizado',
                                          )
                                        }
                                        className="w-14 rounded-lg border border-slate-200 bg-[#F8FAFC] px-2 py-1 text-center font-mono text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                                      />
                                    </div>
                                  </div>

                                  {/* 2. Cuánto adelantó este mes (Editable o vía botón de abono) */}
                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#64748B]">
                                      2. Adelantado / Abonado este mes
                                    </span>
                                    <div className="mt-3 flex items-center gap-2">
                                      <span className="font-mono text-xl font-bold text-emerald-600">
                                        {currencySymbol}
                                      </span>
                                      <input
                                        type="number"
                                        step="10"
                                        min="0"
                                        value={selectedClient360.currentMonthPaid ?? 0}
                                        onChange={(e) =>
                                          handleUpdateClientField(
                                            selectedClient360.id,
                                            { currentMonthPaid: Number(e.target.value) },
                                            'Abono actualizado en Zenda OS',
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 font-mono text-2xl font-bold text-emerald-600 outline-none focus:border-slate-900 focus:bg-white"
                                      />
                                    </div>
                                    <p className="mt-3 font-mono text-xs text-slate-500">
                                      Editable en vivo o mediante &ldquo;+ Registrar Pago&rdquo;
                                    </p>
                                  </div>

                                  {/* 3. Cuánto resta por pagar */}
                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#64748B]">
                                      3. Saldo Restante por Pagar
                                    </span>
                                    <div className="mt-3 flex items-center gap-3">
                                      {remaining === 0 && retainer > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 font-mono text-xl font-bold text-emerald-700">
                                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                          Al día (S/ 0.00)
                                        </span>
                                      ) : (
                                        <span className={`text-3xl font-bold ${remaining > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                          {currencySymbol} {remaining.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-3 font-mono text-xs text-slate-500">
                                      {retainer === 0
                                        ? 'Define el retainer mensual en la tarjeta 1'
                                        : remaining === 0
                                        ? 'Retainer del mes cubierto al 100%'
                                        : 'Saldo pendiente del mes actual'}
                                    </p>
                                  </div>
                                </div>

                                {/* Historial de Abonos del Cliente */}
                                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <h3 className="text-base font-bold text-[#0F172A]">
                                        Abonos & Pagos Registrados ({selectedClient360.name})
                                      </h3>
                                      <p className="mt-0.5 text-xs text-slate-500">
                                        Cada pago suma a <code>currentMonthPaid</code> y crea automáticamente un INGRESO en <code>zenda_finances</code>.
                                      </p>
                                    </div>

                                    <motion.button
                                      type="button"
                                      whileHover={{ y: -2 }}
                                      whileTap={{ scale: 0.96 }}
                                      transition={SPRING_TRANSITION}
                                      onClick={() => {
                                        setPaymentForm({
                                          amount: remaining > 0 ? String(remaining) : '',
                                          date: getTodayDate(),
                                          method: 'Transferencia Bancaria',
                                          note: `Abono retainer mensual - ${selectedClient360.name}`,
                                        });
                                        setPaymentModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-slate-800"
                                    >
                                      <Plus className="h-4 w-4" />
                                      + REGISTRAR PAGO / ABONO
                                    </motion.button>
                                  </div>

                                  <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase text-slate-500">
                                        <tr>
                                          <th className="px-4 py-3">Fecha</th>
                                          <th className="px-4 py-3">Concepto</th>
                                          <th className="px-4 py-3">Método / Nota</th>
                                          <th className="px-4 py-3 text-right">Monto</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {clientPayments.length === 0 ? (
                                          <tr>
                                            <td colSpan="4" className="p-6 text-center font-mono text-slate-400">
                                              Sin abonos registrados aún para {selectedClient360.name}.
                                            </td>
                                          </tr>
                                        ) : (
                                          clientPayments.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/70">
                                              <td className="px-4 py-3 font-mono text-slate-600">
                                                {p.fecha || p.date}
                                              </td>
                                              <td className="px-4 py-3 font-medium text-slate-900">
                                                {p.concepto || p.concept}
                                              </td>
                                              <td className="px-4 py-3 text-slate-500">
                                                {p.metodoPago ? `${p.metodoPago} · ` : ''}
                                                {p.nota || p.categoria || p.category}
                                              </td>
                                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                                + S/ {getRecordAmount(p).toFixed(2)}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </motion.div>
                      )}

                      {/* ======================================================== */}
                      {/* PESTAÑA B: TALLER DE GUIONES (ESTILO NOTION)             */}
                      {/* ======================================================== */}
                      {client360Tab === 'scripts' && (
                        <motion.div
                          key="360-scripts"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
                        >
                          {/* Lista lateral de guiones del cliente */}
                          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:col-span-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                              <div>
                                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                                  Guiones · {selectedClient360.name}
                                </h3>
                                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                                  Colección: <code>zenda_scripts</code>
                                </p>
                              </div>

                              <motion.button
                                type="button"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={SPRING_TRANSITION}
                                onClick={handleCreateScript}
                                className="inline-flex items-center gap-1 rounded-xl bg-[#0F172A] px-3 py-1.5 font-mono text-[11px] font-bold text-white hover:bg-slate-800"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Nuevo Guion
                              </motion.button>
                            </div>

                            <div className="mt-4 space-y-2">
                              {clientScripts.length === 0 ? (
                                <div className="py-10 text-center font-mono text-xs text-slate-400">
                                  No hay guiones para {selectedClient360.name}. Pulsa &ldquo;+ Nuevo Guion&rdquo;.
                                </div>
                              ) : (
                                clientScripts.map((sc) => {
                                  const isSelected = activeScript && activeScript.id === sc.id;
                                  return (
                                    <motion.button
                                      key={sc.id}
                                      type="button"
                                      whileHover={{ y: -1 }}
                                      whileTap={{ scale: 0.98 }}
                                      transition={SPRING_TRANSITION}
                                      onClick={() => setActiveScriptId(sc.id)}
                                      className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                                        isSelected
                                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span
                                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                                            isSelected
                                              ? 'border-white/20 bg-white/10 text-white'
                                              : getStageBadge(sc.status)
                                          }`}
                                        >
                                          {sc.status}
                                        </span>
                                        <span className={`font-mono text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                          {(sc.updatedAt || '').slice(0, 10)}
                                        </span>
                                      </div>
                                      <p className={`mt-2 text-xs font-semibold line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                        {sc.title}
                                      </p>
                                    </motion.button>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Editor central limpio estilo Notion */}
                          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-8">
                            {!activeScript ? (
                              <div className="flex h-80 flex-col items-center justify-center text-center">
                                <FileText className="h-10 w-10 text-slate-300" />
                                <p className="mt-3 font-mono text-xs text-slate-500">
                                  Crea o selecciona un guion para redactar el Hook, Escenas y CTA de {selectedClient360.name}.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-slate-500">Estado:</span>
                                    <select
                                      value={activeScript.status}
                                      onChange={(e) => {
                                        const nextSt = e.target.value;
                                        if (nextSt === 'Publicado' && activeScript.status !== 'Publicado') {
                                          handleToggleScriptPublished(activeScript);
                                        } else if (nextSt !== 'Publicado' && activeScript.status === 'Publicado') {
                                          handleUpdateScript(activeScript.id, { status: nextSt }, true);
                                          const curr = Number(selectedClient360.videosPublicadosEstaSemana || 0);
                                          handleUpdateClientField(
                                            selectedClient360.id,
                                            { videosPublicadosEstaSemana: Math.max(0, curr - 1) },
                                            'Guardado en Zenda OS',
                                          );
                                        } else {
                                          handleUpdateScript(activeScript.id, { status: nextSt }, true);
                                        }
                                      }}
                                      className={`rounded-full border px-3 py-1 font-mono text-xs font-semibold outline-none cursor-pointer ${getStageBadge(
                                        activeScript.status,
                                      )}`}
                                    >
                                      {scriptStatuses.map((st) => (
                                        <option key={st} value={st}>
                                          {st}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Switch con animación de rebote al marcar como Publicado */}
                                    <motion.button
                                      type="button"
                                      whileHover={{ y: -1 }}
                                      whileTap={{ scale: 0.95 }}
                                      animate={{
                                        scale: activeScript.status === 'Publicado' ? [1, 1.12, 1] : 1,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      onClick={() => handleToggleScriptPublished(activeScript)}
                                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
                                        activeScript.status === 'Publicado'
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <CheckCircle2
                                        className={`h-4 w-4 ${
                                          activeScript.status === 'Publicado' ? 'text-emerald-600' : 'text-slate-400'
                                        }`}
                                      />
                                      <span>
                                        {activeScript.status === 'Publicado'
                                          ? 'Publicado (+1 sumado)'
                                          : 'Marcar como Publicado'}
                                      </span>
                                    </motion.button>

                                    <motion.button
                                      type="button"
                                      whileHover={{ y: -1 }}
                                      whileTap={{ scale: 0.96 }}
                                      transition={SPRING_TRANSITION}
                                      onClick={() => handleCopyScriptForAgent(activeScript, selectedClient360)}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-3.5 py-2 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                      Copiar Guion para Agente de Antigravity
                                    </motion.button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteScript(activeScript.id)}
                                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                      title="Eliminar guion"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-5">
                                  <div>
                                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                      Título / Idea del Video
                                    </label>
                                    <input
                                      type="text"
                                      value={activeScript.title}
                                      onChange={(e) =>
                                        handleUpdateScript(activeScript.id, { title: e.target.value })
                                      }
                                      onBlur={() => showToast('Guardado en Zenda OS')}
                                      placeholder="Título del reel o pieza audiovisual..."
                                      className="w-full border-0 border-b border-slate-200 bg-transparent pb-2 text-xl font-bold text-[#0F172A] outline-none focus:border-slate-900"
                                    />
                                  </div>

                                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
                                    <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                      ⚡ Hook (Gancho de los primeros 3 segundos)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={activeScript.hook}
                                      onChange={(e) =>
                                        handleUpdateScript(activeScript.id, { hook: e.target.value })
                                      }
                                      onBlur={() => showToast('Guardado en Zenda OS')}
                                      placeholder="Frase o acción visual disruptiva para retener en los primeros 3 segundos..."
                                      className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      🎬 Cuerpo del Guion / Escenas Visuales (Estilo Notion)
                                    </label>
                                    <textarea
                                      rows={9}
                                      value={activeScript.body}
                                      onChange={(e) =>
                                        handleUpdateScript(activeScript.id, { body: e.target.value })
                                      }
                                      onBlur={() => showToast('Guardado en Zenda OS')}
                                      placeholder="Describe las escenas, ángulos de cámara, locución y textos en pantalla..."
                                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 font-sans text-sm leading-relaxed text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                                    />
                                  </div>

                                  <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/40 p-4">
                                    <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-900">
                                      🎯 Call to Action (CTA Final)
                                    </label>
                                    <input
                                      type="text"
                                      value={activeScript.cta}
                                      onChange={(e) =>
                                        handleUpdateScript(activeScript.id, { cta: e.target.value })
                                      }
                                      onBlur={() => showToast('Guardado en Zenda OS')}
                                      placeholder="Ej. Comenta la palabra clave o pide desde el link del perfil..."
                                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* ======================================================== */}
                      {/* PESTAÑA C: INFRAESTRUCTURA & AVANCE TÉCNICO              */}
                      {/* ======================================================== */}
                      {client360Tab === 'infra' && (
                        <motion.div
                          key="360-infra"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
                        >
                          <div className="space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-5">
                            <div>
                              <h3 className="text-base font-bold text-[#0F172A]">
                                Progreso de Implementación Técnica
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Ajusta en vivo el porcentaje de avance para {selectedClient360.name}.
                              </p>
                            </div>

                            {/* Avance Web con barra animada Framer Motion */}
                            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase text-slate-700">
                                  🌐 Avance de Web (%)
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={selectedClient360.webProgress ?? 0}
                                    onChange={(e) =>
                                      handleUpdateClientField(selectedClient360.id, {
                                        webProgress: Math.min(100, Math.max(0, Number(e.target.value))),
                                      })
                                    }
                                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-bold text-slate-900"
                                  />
                                  <span className="font-mono text-xs font-bold text-slate-700">%</span>
                                </div>
                              </div>
                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${selectedClient360.webProgress ?? 0}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-slate-900"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={selectedClient360.webProgress ?? 0}
                                onChange={(e) =>
                                  handleUpdateClientField(selectedClient360.id, {
                                    webProgress: Number(e.target.value),
                                  })
                                }
                                className="mt-2 w-full accent-slate-900 cursor-pointer"
                              />
                            </div>

                            {/* Avance Bots/Automatizaciones con barra animada Framer Motion */}
                            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase text-cyan-800">
                                  🤖 Bots / Automatizaciones WhatsApp (%)
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={selectedClient360.automationProgress ?? 0}
                                    onChange={(e) =>
                                      handleUpdateClientField(selectedClient360.id, {
                                        automationProgress: Math.min(100, Math.max(0, Number(e.target.value))),
                                      })
                                    }
                                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-bold text-cyan-800"
                                  />
                                  <span className="font-mono text-xs font-bold text-cyan-800">%</span>
                                </div>
                              </div>
                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${selectedClient360.automationProgress ?? 0}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-cyan-600"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={selectedClient360.automationProgress ?? 0}
                                onChange={(e) =>
                                  handleUpdateClientField(selectedClient360.id, {
                                    automationProgress: Number(e.target.value),
                                  })
                                }
                                className="mt-2 w-full accent-cyan-600 cursor-pointer"
                              />
                            </div>

                            {/* Meta de videos semanal y publicados */}
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                              <div>
                                <label className="block font-mono text-[10px] uppercase text-slate-500">
                                  Meta Videos Semanal
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={selectedClient360.weeklyVideoGoal ?? 3}
                                  onChange={(e) =>
                                    handleUpdateClientField(selectedClient360.id, {
                                      weeklyVideoGoal: Number(e.target.value),
                                    })
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-[10px] uppercase text-slate-500">
                                  Publicados esta Semana
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={selectedClient360.videosPublicadosEstaSemana ?? 0}
                                  onChange={(e) =>
                                    handleUpdateClientField(selectedClient360.id, {
                                      videosPublicadosEstaSemana: Number(e.target.value),
                                    })
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold text-emerald-700"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Notas técnicas en vivo */}
                          <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-7">
                            <div>
                              <h3 className="text-base font-bold text-[#0F172A]">
                                Notas Técnicas de Sistemas & Accesos
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Guardado instantáneo en Firestore al editar cualquier campo.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                  Repositorio GitHub del Cliente
                                </label>
                                <input
                                  type="text"
                                  value={selectedClient360.githubRepo || ''}
                                  onChange={(e) =>
                                    handleUpdateClientField(
                                      selectedClient360.id,
                                      { githubRepo: e.target.value },
                                      '',
                                    )
                                  }
                                  onBlur={() => showToast('Guardado en Zenda OS')}
                                  placeholder="https://github.com/zenda-os/..."
                                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 font-mono text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                  Firebase Project ID
                                </label>
                                <input
                                  type="text"
                                  value={selectedClient360.firebaseProjectId || ''}
                                  onChange={(e) =>
                                    handleUpdateClientField(
                                      selectedClient360.id,
                                      { firebaseProjectId: e.target.value },
                                      '',
                                    )
                                  }
                                  onBlur={() => showToast('Guardado en Zenda OS')}
                                  placeholder="ej. dolciangel-prod"
                                  className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 font-mono text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                Número de Bot WhatsApp / Workflow en n8n
                              </label>
                              <input
                                type="text"
                                value={selectedClient360.n8nBotNumber || ''}
                                onChange={(e) =>
                                  handleUpdateClientField(
                                    selectedClient360.id,
                                    { n8nBotNumber: e.target.value },
                                    '',
                                  )
                                }
                                onBlur={() => showToast('Guardado en Zenda OS')}
                                placeholder="+51 999 888 777 · Flujo n8n de atención y pedidos"
                                className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3 font-mono text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                Bitácora de Arquitectura & Notas Técnicas
                              </label>
                              <textarea
                                rows={6}
                                value={selectedClient360.techNotes || ''}
                                onChange={(e) =>
                                  handleUpdateClientField(
                                    selectedClient360.id,
                                    { techNotes: e.target.value },
                                    '',
                                  )
                                }
                                onBlur={() => showToast('Guardado en Zenda OS')}
                                placeholder="Documenta endpoints, webhooks, variables o integraciones de sistemas..."
                                className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ======================================================== */}
                      {/* PESTAÑA D: DOSSIER & MARCA (COLORES HEX EDITABLES)       */}
                      {/* ======================================================== */}
                      {client360Tab === 'dossier' && (
                        <motion.div
                          key="360-dossier"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
                        >
                          <div className="space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-5">
                            <div>
                              <h3 className="text-base font-bold text-[#0F172A]">
                                Paleta Cromática Oficial (Editable en Vivo)
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Haz clic en el círculo para copiar el código HEX o edítalo directamente abajo.
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              {(selectedClient360.brandColors || ['#0F172A', '#06B6D4', '#FFFFFF']).map(
                                (hex, index) => (
                                  <div
                                    key={`palette-${index}`}
                                    className="flex flex-col items-center rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3.5"
                                  >
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.06 }}
                                      whileTap={{ scale: 0.94 }}
                                      transition={SPRING_TRANSITION}
                                      onClick={() =>
                                        handleCopyText(hex, `Color HEX copiado: ${hex}`)
                                      }
                                      className="h-12 w-12 rounded-full border border-slate-300 shadow-inner"
                                      style={{ backgroundColor: hex }}
                                      title="Clic para copiar HEX"
                                    />
                                    <input
                                      type="text"
                                      value={hex}
                                      onChange={(e) =>
                                        handleUpdateClientBrandColor(
                                          selectedClient360,
                                          index,
                                          e.target.value,
                                        )
                                      }
                                      className="mt-2.5 w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-center font-mono text-[11px] font-bold text-slate-900 outline-none focus:border-slate-900"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyText(hex, `Color HEX copiado: ${hex}`)
                                      }
                                      className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 hover:text-slate-900"
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                      Copiar
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>

                            {/* Enlace directo a Carpeta de Drive con Recursos */}
                            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                URL de Carpeta de Google Drive
                              </label>
                              <input
                                type="url"
                                value={selectedClient360.driveFolder || ''}
                                onChange={(e) =>
                                  handleUpdateClientField(
                                    selectedClient360.id,
                                    { driveFolder: e.target.value },
                                    '',
                                  )
                                }
                                onBlur={() => showToast('Enlace de Drive guardado en Zenda OS')}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-900 outline-none focus:border-slate-900"
                              />

                              {selectedClient360.driveFolder && (
                                <a
                                  href={selectedClient360.driveFolder}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-3 font-mono text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800"
                                >
                                  <FolderGit2 className="h-4 w-4 text-zenda-cyan" />
                                  Abrir Carpeta de Drive con Recursos
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-7">
                            <div>
                              <h3 className="text-base font-bold text-[#0F172A]">
                                Dossier de Identidad & Estrategia Comercial
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Edita la historia, público objetivo y propuesta de valor de {selectedClient360.name}.
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                Historia / Esencia del Negocio
                              </label>
                              <textarea
                                rows={3}
                                value={selectedClient360.story || ''}
                                onChange={(e) =>
                                  handleUpdateClientField(
                                    selectedClient360.id,
                                    { story: e.target.value },
                                    '',
                                  )
                                }
                                onBlur={() => showToast('Guardado en Zenda OS')}
                                className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                Público Objetivo (Buyer Persona)
                              </label>
                              <textarea
                                rows={3}
                                value={selectedClient360.targetAudience || ''}
                                onChange={(e) =>
                                  handleUpdateClientField(
                                    selectedClient360.id,
                                    { targetAudience: e.target.value },
                                    '',
                                  )
                                }
                                onBlur={() => showToast('Guardado en Zenda OS')}
                                placeholder="Describe el cliente ideal de esta marca..."
                                className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                Propuesta de Valor Diferencial
                              </label>
                              <textarea
                                rows={3}
                                value={selectedClient360.valueProp || ''}
                                onChange={(e) =>
                                  handleUpdateClientField(
                                    selectedClient360.id,
                                    { valueProp: e.target.value },
                                    '',
                                  )
                                }
                                onBlur={() => showToast('Guardado en Zenda OS')}
                                placeholder="¿Por qué los clientes eligen esta marca?"
                                className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* MÓDULO 3: PIPELINE DE PRODUCCIÓN AUDIOVISUAL                     */}
            {/* ================================================================ */}
            {activeTab === 'pipeline' && (
              <motion.div
                key="tab-pipeline"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Film className="h-5 w-5 text-purple-600" />
                      <h2 className="text-lg font-bold text-[#0F172A]">Pipeline de Producción Audiovisual</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Seguimiento etapa por etapa sincronizado con <code className="font-semibold text-slate-800">zenda_content</code>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filtro dinámico por cliente desde zenda_clients */}
                    <select
                      value={contentClientFilter}
                      onChange={(e) => setContentClientFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-slate-900"
                    >
                      <option value="all">Todos los clientes</option>
                      {zendaClients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING_TRANSITION}
                      onClick={() => setContentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      + NUEVO REEL / VIDEO
                    </motion.button>
                  </div>
                </div>

                {/* Filtros por etapa */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
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
                              No hay piezas audiovisuales registradas en esta vista.
                            </td>
                          </tr>
                        ) : (
                          filteredContent.map((item) => (
                            <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                              <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                                  {item.client}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <p className="max-w-md font-medium text-slate-900 leading-snug">
                                  {item.title}
                                </p>
                              </td>

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

                              <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                  {item.publishDate}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {item.driveUrl ? (
                                    <a
                                      href={item.driveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100"
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
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* MÓDULO 4: CALENDARIO OPERATIVO INTEGRADO                         */}
            {/* ================================================================ */}
            {activeTab === 'calendar' && (
              <motion.div
                key="tab-calendar"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-cyan-600" />
                      <h2 className="text-lg font-bold text-[#0F172A]">Calendario & Rodajes Operativos</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Rodajes presenciales, entregas y cobros sincronizados con <code className="font-semibold text-slate-800">zenda_calendar</code>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={calendarClientFilter}
                      onChange={(e) => setCalendarClientFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-slate-900"
                    >
                      <option value="all">Todos los clientes</option>
                      {zendaClients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING_TRANSITION}
                      onClick={() => setCalendarModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      + NUEVO EVENTO
                    </motion.button>
                  </div>
                </div>

                {/* Filtro por tipo de evento */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                    <Filter className="h-3.5 w-3.5" /> Tipo:
                  </span>
                  {[
                    { id: 'all', label: `Todos (${calendarEvents.length})` },
                    { id: 'Rodaje presencial', label: '🎥 Rodajes' },
                    { id: 'Cobro / Facturación', label: '💰 Cobros' },
                    { id: 'Publicación / Entrega', label: '🚀 Publicaciones' },
                    { id: 'Reunión / Sync', label: '🤝 Reuniones' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCalendarTypeFilter(f.id)}
                      className={`rounded-xl px-3 py-1 font-mono text-xs transition-all ${
                        calendarTypeFilter === f.id
                          ? 'bg-slate-900 text-white font-semibold shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Cuadrícula mensual */}
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
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase text-slate-400">
                      <div>Lun</div>
                      <div>Mar</div>
                      <div>Mié</div>
                      <div>Jue</div>
                      <div>Vie</div>
                      <div>Sáb</div>
                      <div>Dom</div>
                    </div>

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
                                ? 'border-2 border-slate-900 bg-slate-50 font-bold text-slate-900'
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
                  </div>

                  {/* Lista de Agenda */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="font-mono text-sm font-bold text-slate-900">
                        Eventos Agendados
                      </h3>
                      <span className="font-mono text-xs text-slate-500">
                        {filteredCalendarEvents.length} eventos
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {filteredCalendarEvents.length === 0 ? (
                        <div className="py-12 text-center font-mono text-xs text-slate-400">
                          No hay eventos registrados. Pulsa &ldquo;+ NUEVO EVENTO&rdquo; para agendar.
                        </div>
                      ) : (
                        filteredCalendarEvents.map((ev) => (
                          <motion.div
                            key={ev.id}
                            layout
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
                                >
                                  {ev.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-slate-300" />
                                  )}
                                </button>

                                <div>
                                  <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getCalendarTypeBadge(ev.type)}`}>
                                    {ev.type}
                                  </span>
                                  <h4 className={`mt-1.5 text-sm font-bold text-slate-900 ${ev.completed ? 'line-through text-slate-400' : ''}`}>
                                    {ev.title}
                                  </h4>
                                  <p className="font-mono text-xs text-slate-600">
                                    Cuenta: <span className="font-semibold text-slate-900">{ev.client}</span>
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteCalendarEvent(ev.id)}
                                className="rounded p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {ev.notes && (
                              <p className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700">
                                {ev.notes}
                              </p>
                            )}

                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 font-mono text-[11px] text-slate-600">
                              <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                                <Clock className="h-3.5 w-3.5 text-cyan-600" />
                                {ev.date} · {ev.time} hrs
                              </span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                @{ev.assignee}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* MÓDULO 5: FINANZAS & CAJA NETA (CONECTADA CON CLIENTES 360°)     */}
            {/* ================================================================ */}
            {activeTab === 'finances' && (
              <motion.div
                key="tab-finances"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">Finanzas & Caja Central de Zenda</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Conectada bidireccionalmente con los abonos registrados en Dolciangel, Lalanchita y King´s barber shop.
                    </p>
                  </div>

                  <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 font-mono text-xs">
                    {[
                      { id: 'ledger', label: `Caja Neta & Movimientos (${finances.length})` },
                      { id: 'onboardings', label: `Respuestas Web / Onboardings (${inboundOnboardings.length})` },
                    ].map((st) => {
                      const active = financeSubTab === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFinanceSubTab(st.id)}
                          className={`relative rounded-lg px-4 py-2 transition-colors ${
                            active ? 'font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {active && (
                            <motion.div
                              layoutId="financeSubTabIndicator"
                              transition={SPRING_TRANSITION}
                              className="absolute inset-0 rounded-lg bg-white shadow-sm"
                            />
                          )}
                          <span className="relative z-10">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {financeSubTab === 'ledger' ? (
                  <div className="space-y-6">
                    {/* Tarjetas KPI Financieras */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-slate-500">
                          <span>Total Ingresos</span>
                          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-600">
                          S/ {totalIncomePEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-500">
                          + US$ {totalIncomeUSD.toLocaleString()} USD
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-slate-500">
                          <span>Total Egresos</span>
                          <ArrowDownRight className="h-4 w-4 text-rose-600" />
                        </div>
                        <div className="mt-3 text-2xl font-bold tracking-tight text-rose-600">
                          S/ {totalExpensePEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-500">
                          + US$ {totalExpenseUSD.toLocaleString()} USD
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-slate-500">
                          <span>Balance Neto Operativo</span>
                          <Percent className="h-4 w-4 text-slate-900" />
                        </div>
                        <div className={`mt-3 text-2xl font-bold tracking-tight ${netPEN >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                          S/ {netPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}{' '}
                          <span className="font-mono text-sm font-normal text-slate-500">({marginPEN}%)</span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-500">
                          Neto USD: + US$ {netUSD.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Libro Mayor de Movimientos</h3>
                        <p className="text-xs text-slate-500">Colección Firestore: <code>zenda_finances</code></p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={financeClientFilter}
                          onChange={(e) => setFinanceClientFilter(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-slate-900"
                        >
                          <option value="all">Todas las cuentas</option>
                          {zendaClients.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <motion.button
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          transition={SPRING_TRANSITION}
                          onClick={() => setFinanceModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" />
                          + NUEVO MOVIMIENTO
                        </motion.button>
                      </div>
                    </div>

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
                          {filteredFinances.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center font-mono text-slate-400">
                                La caja está en S/ 0.00 sin movimientos registrados. Registra un abono desde Clientes 360° o pulsa &ldquo;+ NUEVO MOVIMIENTO&rdquo;.
                              </td>
                            </tr>
                          ) : (
                            filteredFinances.map((f) => {
                              const ingreso = isIncomeRecord(f);
                              const montoVal = getRecordAmount(f);
                              const curr = getRecordCurrency(f);
                              return (
                                <tr key={f.id} className="transition-colors hover:bg-slate-50/70">
                                  <td className="px-5 py-3.5 font-mono text-slate-600">
                                    {f.fecha || f.date}
                                  </td>
                                  <td className="px-5 py-3.5 font-medium text-slate-900">
                                    {f.concepto || f.concept}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                                      {f.categoria || f.category}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span
                                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                                        ingreso
                                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                          : 'border border-rose-200 bg-rose-50 text-rose-800'
                                      }`}
                                    >
                                      {ingreso ? 'INGRESO' : 'EGRESO'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-mono font-bold">
                                    <span className={ingreso ? 'text-emerald-700' : 'text-rose-700'}>
                                      {ingreso ? '+' : '-'} {curr === 'PEN' ? 'S/' : '$'}{' '}
                                      {montoVal.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFinance(f.id)}
                                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative max-w-md">
                      <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar respuesta de formulario entrante..."
                        value={onboardingSearch}
                        onChange={(e) => setOnboardingSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] uppercase text-slate-500">
                          <tr>
                            <th className="px-5 py-3.5">Negocio</th>
                            <th className="px-5 py-3.5">Decisor & Contacto</th>
                            <th className="px-5 py-3.5">Origen</th>
                            <th className="px-5 py-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inboundOnboardings.filter((item) =>
                            (item.businessName || '').toLowerCase().includes(onboardingSearch.toLowerCase()),
                          ).length === 0 ? (
                            <tr>
                              <td colSpan="4" className="p-8 text-center font-mono text-slate-400">
                                No hay respuestas de formularios externos registradas aún.
                              </td>
                            </tr>
                          ) : (
                            inboundOnboardings
                              .filter((item) =>
                                (item.businessName || '').toLowerCase().includes(onboardingSearch.toLowerCase()),
                              )
                              .map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="px-5 py-3.5 font-semibold text-slate-900">{item.businessName}</td>
                                  <td className="px-5 py-3.5">
                                    <div>{item.decisionMaker}</div>
                                    <div className="font-mono text-[11px] text-slate-500">{item.contact}</div>
                                  </td>
                                  <td className="px-5 py-3.5 font-mono text-[11px]">
                                    {item.type === 'leads' ? 'Diagnóstico 60s' : 'Portal /onboarding'}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOnboardingDetail(item)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700 hover:bg-slate-50"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Ver Respuesta
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALES CON <AnimatePresence> (FONDO BLANCO #FFFFFF, BORDES #CBD5E1) */}
      {/* ==================================================================== */}

      {/* Modal 0: Confirmación para "Reiniciar Base Real" */}
      <AnimatePresence>
        {resetModalOpen && (
          <motion.div
            key="modal-reset-db"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => !isResettingBase && setResetModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                    Reiniciar Base Real
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isResettingBase}
                  onClick={() => setResetModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
                <p>
                  Esta acción eliminará de Firestore cualquier registro antiguo de prueba en{' '}
                  <code>zenda_clients</code>, <code>zenda_sprints</code>, <code>zenda_content</code>,{' '}
                  <code>zenda_calendar</code>, <code>zenda_finances</code> y <code>zenda_scripts</code>.
                </p>
                <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 font-mono text-[11px] text-slate-800">
                  <p className="font-bold text-slate-900">Se sembrarán únicamente los 3 clientes oficiales en 0:</p>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1">
                    <li>Dolciangel (Pastelería &amp; Cafetería de Especialidad)</li>
                    <li>Lalanchita (Cevichería &amp; Gastronomía Marina)</li>
                    <li>King´s barber shop (Barbería &amp; Estilismo Masculino)</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isResettingBase}
                  onClick={() => setResetModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-mono text-xs text-slate-500 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <motion.button
                  type="button"
                  disabled={isResettingBase}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_TRANSITION}
                  onClick={handleResetRealDatabase}
                  className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {isResettingBase ? 'Purificando Base...' : 'Confirmar y Reiniciar Base'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal A: Registrar Pago / Abono en Vista 360° */}
      <AnimatePresence>
        {paymentModalOpen && selectedClient360 && (
          <motion.div
            key="modal-payment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setPaymentModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Sincronización con Caja Zenda
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Registrar Pago · {selectedClient360.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRegisterClientPayment} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Monto Abonado ({selectedClient360.currency === 'USD' ? 'USD $' : 'Soles S/'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej. 500.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Fecha del Pago
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Método de Pago
                    </label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="Transferencia Bancaria">Transferencia</option>
                      <option value="Yape / Plin">Yape / Plin</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta / Link">Tarjeta / Link</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Comprobante / Nota
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Abono Retainer Mensual"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="rounded-xl px-4 py-2 font-mono text-slate-500 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Confirmar Pago &amp; Sumar a Caja
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal B: + Nuevo Cliente */}
      <AnimatePresence>
        {newClientModalOpen && (
          <motion.div
            key="modal-new-client"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setNewClientModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                  Registrar Nuevo Cliente 360°
                </h3>
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewClient} className="mt-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Nuevo Cliente"
                      value={newClientForm.name}
                      onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Categoría / Rubro
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gastronomía / Servicios"
                      value={newClientForm.category}
                      onChange={(e) => setNewClientForm({ ...newClientForm, category: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Retainer Mensual (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newClientForm.monthlyRetainer}
                      onChange={(e) =>
                        setNewClientForm({ ...newClientForm, monthlyRetainer: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Día de Cobro Mensual
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="05"
                      value={newClientForm.billingDay}
                      onChange={(e) =>
                        setNewClientForm({ ...newClientForm, billingDay: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Meta Videos Semanal
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={newClientForm.weeklyVideoGoal}
                      onChange={(e) =>
                        setNewClientForm({ ...newClientForm, weeklyVideoGoal: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Historia / Esencia de la Marca
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe la historia, sedes y esencia del negocio..."
                    value={newClientForm.story}
                    onChange={(e) => setNewClientForm({ ...newClientForm, story: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Color HEX 1
                    </label>
                    <input
                      type="text"
                      value={newClientForm.color1}
                      onChange={(e) => setNewClientForm({ ...newClientForm, color1: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Color HEX 2
                    </label>
                    <input
                      type="text"
                      value={newClientForm.color2}
                      onChange={(e) => setNewClientForm({ ...newClientForm, color2: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Color HEX 3
                    </label>
                    <input
                      type="text"
                      value={newClientForm.color3}
                      onChange={(e) => setNewClientForm({ ...newClientForm, color3: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Enlace a Carpeta de Drive con Recursos
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={newClientForm.driveFolder}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, driveFolder: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewClientModalOpen(false)}
                    className="rounded-xl px-4 py-2 font-mono text-slate-500 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Crear Cliente 360°
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 1: Nueva Tarea de Sprint */}
      <AnimatePresence>
        {sprintModalOpen && (
          <motion.div
            key="modal-sprint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setSprintModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
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
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Título de la Tarea / Entregable
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cierre de guiones semanales"
                    value={newSprint.title}
                    onChange={(e) => setNewSprint({ ...newSprint, title: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Cliente Asociado
                  </label>
                  <select
                    value={newSprint.client}
                    onChange={(e) => setNewSprint({ ...newSprint, client: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  >
                    {zendaClients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Asignado a
                    </label>
                    <select
                      value={newSprint.assignee}
                      onChange={(e) => setNewSprint({ ...newSprint, assignee: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="Angel">Angel</option>
                      <option value="Marco">Marco</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Prioridad
                    </label>
                    <select
                      value={newSprint.priority}
                      onChange={(e) => setNewSprint({ ...newSprint, priority: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="Urgente">Urgente</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Fecha Límite (Deadline)
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprint.deadline}
                    onChange={(e) => setNewSprint({ ...newSprint, deadline: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
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
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Guardar Tarea
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 2: Nuevo Reel / Contenido */}
      <AnimatePresence>
        {contentModalOpen && (
          <motion.div
            key="modal-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setContentModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
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
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Cliente / Cuenta
                  </label>
                  <select
                    value={newContent.client}
                    onChange={(e) => setNewContent({ ...newContent, client: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  >
                    {zendaClients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Hook o Título del Video
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ej. Idea o hook principal del reel..."
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Etapa Inicial
                    </label>
                    <select
                      value={newContent.stage}
                      onChange={(e) => setNewContent({ ...newContent, stage: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      {contentStages.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Responsable
                    </label>
                    <select
                      value={newContent.assignee}
                      onChange={(e) => setNewContent({ ...newContent, assignee: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="Angel">Angel</option>
                      <option value="Marco">Marco</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Fecha de Publicación
                    </label>
                    <input
                      type="date"
                      required
                      value={newContent.publishDate}
                      onChange={(e) => setNewContent({ ...newContent, publishDate: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      URL Drive (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newContent.driveUrl}
                      onChange={(e) => setNewContent({ ...newContent, driveUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
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
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Guardar Reel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 3: Nuevo Evento de Calendario */}
      <AnimatePresence>
        {calendarModalOpen && (
          <motion.div
            key="modal-calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setCalendarModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
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
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Título del Evento / Motivo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sesión de grabación presencial"
                    value={newCalendarEvent.title}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, title: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Cliente / Cuenta
                    </label>
                    <select
                      value={newCalendarEvent.client}
                      onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, client: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      {zendaClients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Tipo de Evento
                    </label>
                    <select
                      value={newCalendarEvent.type}
                      onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, type: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
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
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={newCalendarEvent.date}
                      onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, date: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={newCalendarEvent.time}
                      onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, time: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Responsable
                  </label>
                  <select
                    value={newCalendarEvent.assignee}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, assignee: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="Angel">Angel</option>
                    <option value="Marco">Marco</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Notas u Observaciones
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles técnicos o de locación..."
                    value={newCalendarEvent.notes}
                    onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, notes: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
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
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Agendar Evento
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 4: Nuevo Movimiento Financiero */}
      <AnimatePresence>
        {financeModalOpen && (
          <motion.div
            key="modal-finance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setFinanceModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                  Registrar Movimiento en Caja
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
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Tipo
                    </label>
                    <select
                      value={newFinance.type}
                      onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="ingreso">Ingreso (+)</option>
                      <option value="egreso">Egreso (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Cuenta Relacionada
                    </label>
                    <select
                      value={newFinance.client}
                      onChange={(e) => setNewFinance({ ...newFinance, client: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      {zendaClients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="General / Zenda">General / Zenda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Concepto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Abono Retainer o gasto operativo"
                    value={newFinance.concept}
                    onChange={(e) => setNewFinance({ ...newFinance, concept: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Monto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newFinance.amount}
                      onChange={(e) => setNewFinance({ ...newFinance, amount: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Moneda
                    </label>
                    <select
                      value={newFinance.currency}
                      onChange={(e) => setNewFinance({ ...newFinance, currency: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="PEN">PEN (S/)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Categoría
                    </label>
                    <select
                      value={newFinance.category}
                      onChange={(e) => setNewFinance({ ...newFinance, category: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    >
                      <option value="Retainer Cliente">Retainer Cliente</option>
                      <option value="Setup">Setup</option>
                      <option value="Pauta Ads">Pauta Ads</option>
                      <option value="Software/Herramientas">Software</option>
                      <option value="Operativo">Operativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={newFinance.date}
                    onChange={(e) => setNewFinance({ ...newFinance, date: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
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
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0F172A] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Guardar Movimiento
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 5: Detalle de Respuesta de Onboarding Entrante */}
      <AnimatePresence>
        {selectedOnboardingDetail && (
          <motion.div
            key="modal-onboarding-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedOnboardingDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-cyan-700">Respuesta Recibida</span>
                  <h3 className="text-xl font-bold text-slate-900">{selectedOnboardingDetail.businessName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOnboardingDetail(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <p><strong>Decisor:</strong> {selectedOnboardingDetail.decisionMaker}</p>
                <p><strong>Contacto:</strong> {selectedOnboardingDetail.contact}</p>
                <p><strong>Producto Estrella:</strong> {selectedOnboardingDetail.starProduct}</p>
                <p><strong>Ticket:</strong> {selectedOnboardingDetail.avgTicket}</p>
                <p><strong>Cuello de Botella:</strong> {selectedOnboardingDetail.bottleneckProcess}</p>
                <div className="pt-3">
                  <a
                    href={buildWhatsAppLink(
                      `Hola ${selectedOnboardingDetail.decisionMaker}, revisamos tu ficha de ${selectedOnboardingDetail.businessName} en Zenda.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-mono text-xs font-bold text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
