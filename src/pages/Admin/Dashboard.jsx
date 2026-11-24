import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Copy,
  CreditCard,
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
  Settings,
  Trash2,
  Trophy,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../firebase.js';
import usePageMeta from '../../lib/usePageMeta.js';
import { buildWhatsAppLink } from '../../lib/whatsapp.js';

const SPRING_TRANSITION = { type: 'spring', stiffness: 400, damping: 25 };
const MISSION_STAGES = ['Guion', 'Grabado', 'Editado', 'Publicado'];
const QUEST_STATES = ['Pendiente', 'En Curso', 'Completado'];
const WEEKLY_AGENCY_GOAL = 12;
const XP_PER_LEVEL = 500;
const CURRENT_SEASON_VERSION = 'official_zero_v1';
const QUICK_XP_PRESETS = [50, 100, 150, 250, 500];

const DEFAULT_SOCIAL_METRICS = {
  tiktokFollowers: 0,
  tiktokGoal: 0,
  tiktokWeeklyDelta: 0,
  instagramFollowers: 0,
  instagramGoal: 0,
  instagramWeeklyDelta: 0,
  facebookFollowers: 0,
  facebookGoal: 0,
  facebookWeeklyDelta: 0,
  reelViews: 0,
  avgReach: 0,
  engagementRate: 0,
  whatsappClicks: 0,
  bestReelTitle: '',
  bestReelViews: 0,
  bestReelUrl: '',
  updatedAt: '',
};

function getClientSocialMetrics(client) {
  return {
    ...DEFAULT_SOCIAL_METRICS,
    ...(client?.socialMetrics || {}),
  };
}

// Categorías adicionales para Misiones Personales, Hábitos y Operación Interna
const PERSONAL_QUEST_CATEGORIES = [
  'Personal / Hábito',
  'Estudio / Entreno',
  'Operación Interna',
];

const QUEST_DIFFICULTIES = [
  // Misiones de Clientes & Agencia
  {
    id: 'Guion',
    label: 'Guion',
    badgeLabel: '+100 XP · Guion',
    xp: 100,
    group: 'client',
    colorClass: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]',
  },
  {
    id: 'Grabación',
    label: 'Grabación',
    badgeLabel: '+150 XP · Grabación',
    xp: 150,
    group: 'client',
    colorClass: 'border-[#0066C5]/25 bg-[#0066C5]/10 text-[#0066C5]',
  },
  {
    id: 'Reel Publicado',
    label: 'Reel Publicado',
    badgeLabel: '+200 XP · Reel Publicado',
    xp: 200,
    group: 'client',
    colorClass: 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]',
  },
  // Misiones Personales y Hábitos
  {
    id: 'Hábito Diario',
    label: 'Hábito Diario',
    badgeLabel: '+50 XP · Hábito Diario',
    xp: 50,
    group: 'personal',
    colorClass: 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700',
  },
  {
    id: 'Tarea Personal / Estudio',
    label: 'Tarea Personal / Estudio',
    badgeLabel: '+100 XP · Tarea Personal / Estudio',
    xp: 100,
    group: 'personal',
    colorClass: 'border-[#0066C5]/20 bg-[#0066C5]/5 text-[#0066C5]',
  },
  {
    id: 'Entreno / Bloque Profundo',
    label: 'Entreno / Bloque Profundo',
    badgeLabel: '+150 XP · Entreno / Bloque Profundo',
    xp: 150,
    group: 'personal',
    colorClass: 'border-[#10B981]/25 bg-[#10B981]/10 text-[#10B981]',
  },
];

function isPersonalCategory(categoryName) {
  const s = String(categoryName || '').toLowerCase();
  return (
    s.includes('personal') ||
    s.includes('hábito') ||
    s.includes('habito') ||
    s.includes('estudio') ||
    s.includes('entreno') ||
    s.includes('operación interna') ||
    s.includes('operacion interna')
  );
}

function getDefaultDifficultyForCategory(categoryName) {
  const s = String(categoryName || '').toLowerCase();
  if (s.includes('hábito') || s.includes('habito') || s.includes('personal')) {
    return 'Hábito Diario';
  }
  if (s.includes('entreno') || s.includes('estudio')) {
    return 'Entreno / Bloque Profundo';
  }
  if (s.includes('operación') || s.includes('operacion')) {
    return 'Tarea Personal / Estudio';
  }
  return 'Guion';
}

function formatExactTime(dateInput = new Date()) {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  angle: (i / 24) * Math.PI * 2,
  distance: 90 + (i % 5) * 45,
  size: 6 + (i % 4) * 2,
  color: ['#0066C5', '#10B981', '#0F172A', '#38BDF8'][i % 4],
}));

/**
 * Sintetizador Web Audio API sutil (0 dependencias externas) para feedback táctico RPG
 */
function playRpgSound(type = 'xp', enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq, startOffset, duration, gainVal = 0.06, wave = 'triangle') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    if (type === 'advance') {
      playTone(440, 0, 0.09, 0.05, 'sine');
      playTone(554.37, 0.06, 0.12, 0.05, 'sine');
    } else if (type === 'heal') {
      playTone(440, 0, 0.14, 0.06, 'sine');
      playTone(554.37, 0.07, 0.16, 0.06, 'sine');
      playTone(659.25, 0.14, 0.24, 0.07, 'triangle');
    } else if (type === 'alert') {
      // Timbre sutil de recordatorio de calendario (15 min antes / 7:25 AM Despegue)
      playTone(659.25, 0, 0.12, 0.06, 'sine');
      playTone(880, 0.1, 0.18, 0.07, 'sine');
      playTone(1046.5, 0.22, 0.25, 0.06, 'triangle');
    } else if (type === 'fanfare') {
      playTone(523.25, 0, 0.13, 0.07, 'triangle');
      playTone(659.25, 0.1, 0.13, 0.07, 'triangle');
      playTone(783.99, 0.2, 0.15, 0.08, 'triangle');
      playTone(1046.5, 0.32, 0.38, 0.09, 'triangle');
    } else {
      // 'xp'
      playTone(587.33, 0, 0.11, 0.06, 'triangle');
      playTone(880, 0.08, 0.2, 0.07, 'triangle');
    }
  } catch {
    // Ignorar si el navegador bloquea autoplay de audio
  }
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Normaliza el nombre de cuenta o categoría personal para cruzar tareas
 * independientemente de tildes o variantes de escritura.
 */
function normalizeAccountKey(rawName) {
  const s = String(rawName || '')
    .toLowerCase()
    .trim();
  if (s.includes('zenda')) return 'zenda';
  if (s.includes('dolci')) return 'dolciangel';
  if (s.includes('lanchita')) return 'lalanchita';
  if (s.includes('king') || s.includes('barber')) return 'kings';
  if (s.includes('personal') || s.includes('hábito') || s.includes('habito')) return 'personal';
  if (s.includes('estudio') || s.includes('entreno')) return 'estudio';
  if (s.includes('operación') || s.includes('operacion')) return 'operacion';
  return s;
}

/**
 * Normaliza el responsable operativo diario: Kevin vs Marco
 * (Mapea registros históricos de 'Angel' a 'Kevin' para mantener continuidad total).
 */
function normalizeAssignee(rawAssignee) {
  const s = String(rawAssignee || '').trim().toLowerCase();
  if (s === 'marco') return 'Marco';
  return 'Kevin';
}

/**
 * Obtiene la dificultad y el XP RPG de una misión:
 * - Si la tarea tiene 'customXp' (XP libre asignado por Kevin o Marco), usa ese valor exacto.
 * - De lo contrario usa los presets de dificultad.
 */
function getQuestDifficultyInfo(task) {
  const exactMatch = QUEST_DIFFICULTIES.find((d) => d.id === task?.questDifficulty);
  const raw = String(task?.questDifficulty || task?.stage || '').toLowerCase();

  let basePreset = QUEST_DIFFICULTIES[0];
  if (exactMatch) {
    basePreset = exactMatch;
  } else if (raw.includes('hábito') || raw.includes('habito')) {
    basePreset = QUEST_DIFFICULTIES[3]; // +50 XP · Hábito Diario
  } else if (raw.includes('tarea personal') || raw.includes('estudio')) {
    basePreset = QUEST_DIFFICULTIES[4]; // +100 XP · Tarea Personal / Estudio
  } else if (raw.includes('entreno') || raw.includes('bloque profundo')) {
    basePreset = QUEST_DIFFICULTIES[5]; // +150 XP · Entreno / Bloque Profundo
  } else if (raw.includes('reel') || raw.includes('publicado')) {
    basePreset = QUEST_DIFFICULTIES[2]; // +200 XP · Reel Publicado
  } else if (raw.includes('grab')) {
    basePreset = QUEST_DIFFICULTIES[1]; // +150 XP · Grabación
  }

  const parsedCustomXp = Number(task?.customXp);
  if (!Number.isNaN(parsedCustomXp) && parsedCustomXp > 0) {
    const labelText = task?.questDifficulty || basePreset.label || 'Reto';
    return {
      ...basePreset,
      id: labelText,
      label: labelText,
      xp: parsedCustomXp,
      badgeLabel: `+${parsedCustomXp} XP`,
      colorClass:
        parsedCustomXp >= 200
          ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
          : parsedCustomXp >= 100
          ? 'border-[#0066C5]/25 bg-[#0066C5]/10 text-[#0066C5]'
          : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700',
    };
  }

  return basePreset;
}

/**
 * Normaliza el estado RPG de una Quest:
 * Pendiente → En Curso → Completado
 */
function getQuestRpgStatus(task) {
  if (!task) return 'Pendiente';
  if (task.questStatus && QUEST_STATES.includes(task.questStatus)) {
    return task.questStatus;
  }
  if (task.completed || task.stage === 'Publicado') return 'Completado';
  if (task.stage === 'Grabado' || task.stage === 'Editado') return 'En Curso';
  return 'Pendiente';
}

/**
 * Normaliza la etapa de cualquier tarea al flujo rápido de 1 clic:
 * Guion → Grabado → Editado → Publicado
 */
function getMissionStage(task) {
  if (!task) return 'Guion';
  if (task.questStatus === 'Completado') return 'Publicado';
  if (task.questStatus === 'En Curso' && (!task.stage || task.stage === 'Guion')) {
    return 'Grabado';
  }
  if (task.stage && MISSION_STAGES.includes(task.stage)) {
    return task.stage;
  }
  if (task.completed || task.stage === 'Publicado') return 'Publicado';
  if (
    task.stage === 'En edición / Agente' ||
    task.stage === 'En Edición IA' ||
    task.stage === 'Aprobado'
  ) {
    return 'Editado';
  }
  if (task.stage === 'Grabado') return 'Grabado';
  return 'Guion';
}

// ============================================================================
// 4 CUENTAS OFICIALES DE ZENDA (Zenda Agency, Dolciangel, La Lanchita, King's Barber Shop)
// ============================================================================

const OFFICIAL_INITIAL_CLIENTS = [
  {
    id: 'client-zenda-agency',
    order: 1,
    name: 'Zenda Agency',
    category: 'Growth Partner B2B & Marca Propia',
    brandColors: ['#09090B', '#06B6D4', '#FFFFFF'],
    story: 'Canal propio de autoridad, casos de éxito e ingeniería de contenido y automatización de Zenda.',
    targetAudience: 'Dueños de negocios y empresas en crecimiento',
    valueProp: 'Sistemas de adquisición, contenido audiovisual e IA aplicada a ventas.',
    monthlyRetainer: 0,
    currency: 'PEN',
    billingDay: '01',
    currentMonthPaid: 0,
    webProgress: 100,
    automationProgress: 100,
    weeklyVideoGoal: 3,
    videosPublicadosEstaSemana: 0,
    health: 'En ritmo',
    leadOwner: 'Kevin',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: 'zenda-db5d0',
    n8nBotNumber: '',
    techNotes: '',
    socialMetrics: DEFAULT_SOCIAL_METRICS,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'client-dolciangel',
    order: 2,
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
    weeklyVideoGoal: 3,
    videosPublicadosEstaSemana: 0,
    health: 'En ritmo',
    leadOwner: 'Marco',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: '',
    n8nBotNumber: '',
    techNotes: '',
    socialMetrics: DEFAULT_SOCIAL_METRICS,
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'client-lalanchita',
    order: 3,
    name: 'La Lanchita',
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
    leadOwner: 'Kevin',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: '',
    n8nBotNumber: '',
    techNotes: '',
    socialMetrics: DEFAULT_SOCIAL_METRICS,
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'client-kings-barber-shop',
    order: 4,
    name: "King's Barber Shop",
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
    leadOwner: 'Marco',
    contact: '',
    driveFolder: '',
    githubRepo: '',
    firebaseProjectId: '',
    n8nBotNumber: '',
    techNotes: '',
    socialMetrics: DEFAULT_SOCIAL_METRICS,
    createdAt: '2026-11-03T10:00:00.000Z',
  },
];

// Ordenador consistente para mantener las 4 cuentas oficiales en orden
function sortClientsOfficialOrder(list) {
  const priorityMap = {
    zenda: 1,
    dolciangel: 2,
    lalanchita: 3,
    kings: 4,
  };
  return [...list].sort((a, b) => {
    const ka = normalizeAccountKey(a.name || a.id);
    const kb = normalizeAccountKey(b.name || b.id);
    const oa = priorityMap[ka] ?? a.order ?? 99;
    const ob = priorityMap[kb] ?? b.order ?? 99;
    if (oa !== ob) return oa - ob;
    return (a.name || '').localeCompare(b.name || '');
  });
}

// Garantiza que las 4 cuentas oficiales siempre existan en el estado operativo
function ensureFourOfficialAccounts(liveClients) {
  const merged = [...liveClients];
  for (const official of OFFICIAL_INITIAL_CLIENTS) {
    const offKey = normalizeAccountKey(official.name);
    const exists = merged.some(
      (c) => c.id === official.id || normalizeAccountKey(c.name) === offKey,
    );
    if (!exists) {
      merged.push(official);
    }
  }
  return sortClientsOfficialOrder(merged);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminDashboard() {
  usePageMeta({
    title: 'Zenda OS · Centro de Control Operativo Diario',
    description: 'Centro de Control Operativo diario de Zenda: Semáforo de Salud, Top 3 Misiones de Hoy (Kevin vs Marco), Motor de Racha y Clientes 360°.',
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

  // Reloj en tiempo real (se actualiza cada 30 segundos) para el contador de 'Horas desde la última publicación'
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Estados de colecciones reales
  const [zendaClients, setZendaClients] = useState(OFFICIAL_INITIAL_CLIENTS);
  const [scriptsList, setScriptsList] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [finances, setFinances] = useState([]);
  const [inboundOnboardings, setInboundOnboardings] = useState([]);

  // Estados del Tablero RPG / Videojuego Táctico (Solo Leveling + Linear)
  const [quickMissionKevin, setQuickMissionKevin] = useState({
    title: '',
    client: 'Zenda Agency',
    questDifficulty: 'Guion',
    customXp: 100,
    priority: 'Urgente',
  });
  const [quickMissionMarco, setQuickMissionMarco] = useState({
    title: '',
    client: 'Dolciangel',
    questDifficulty: 'Grabación',
    customXp: 150,
    priority: 'Urgente',
  });
  const [addingCustomCategoryFor, setAddingCustomCategoryFor] = useState(null); // null | 'Kevin' | 'Marco' | 'modal'
  const [customCategoryDraft, setCustomCategoryDraft] = useState('');
  const [expandedBacklogClients, setExpandedBacklogClients] = useState({});
  const [backlogAssigneeFilter, setBacklogAssigneeFilter] = useState('all'); // 'all' | 'Kevin' | 'Marco'
  const [backlogSearchQuery, setBacklogSearchQuery] = useState('');
  const [backlogQuickInputs, setBacklogQuickInputs] = useState({});
  const [celebrationBurst, setCelebrationBurst] = useState(false);
  const [healedClientFlashId, setHealedClientFlashId] = useState(null);
  const [floatingXpPopup, setFloatingXpPopup] = useState(null); // { player: 'Kevin' | 'Marco', amount: 150, label: '+150 XP' }

  // Pestañas inferiores: 'active' (Misiones Activas) | 'history' (Historial de Victorias & Publicaciones)
  const [bottomSectionTab, setBottomSectionTab] = useState('active');
  const [historyPlayerFilter, setHistoryPlayerFilter] = useState('all'); // 'all' | 'Kevin' | 'Marco'
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // 'all' | 'reel' | 'quest'

  // Mini-modal Anti-Trampa para '+ Publicar' en las 4 cuentas
  const [publishModalClient, setPublishModalClient] = useState(null);
  const [publishForm, setPublishForm] = useState({
    player: 'Kevin',
    title: '',
    link: '',
  });

  // Mini-modal de Penalización Competitiva 1v1 (-100 XP)
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    player: 'Kevin',
    reason: 'Incumplimiento / Quedarse dormido',
  });

  // Modal de Perfil 360° & Métricas Reales de Redes (TikTok, IG, FB, Reels, WhatsApp)
  const [metricsModalClientId, setMetricsModalClientId] = useState(null);
  const [metricsDraft, setMetricsDraft] = useState(DEFAULT_SOCIAL_METRICS);

  // Estado RPG Oficial (Temporada 0 XP) sincronizado en tiempo real con Firestore ('zenda_system/rpg_state')
  // manteniendo localStorage ('zenda_rpg_os_v2') únicamente como caché rápida de arranque
  const [rpgSyncOnline, setRpgSyncOnline] = useState(() => Boolean(isFirebaseConfigured && db));
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [isResettingSeason, setIsResettingSeason] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const getOfficialZeroRpgDefaults = (overrides = {}) => {
    const defaultClientHp = {
      'client-zenda-agency': 100,
      'client-dolciangel': 100,
      'client-lalanchita': 100,
      'client-kings-barber-shop': 100,
    };
    return {
      seasonVersion: CURRENT_SEASON_VERSION,
      xp: { Kevin: 0, Marco: 0 },
      level: { Kevin: 1, Marco: 1 },
      streak: { Kevin: 0, Marco: 0 },
      clientsHp: defaultClientHp,
      clientLastPublishedMap: {},
      weeklyReels: 0,
      weeklyReward: 'Cena Libre + Tarde Libre de Socios',
      quests: [],
      activityLog: [],
      history: [],
      customCategories: [],
      webhookUrl: '',
      kevinBaseXP: 0,
      marcoBaseXP: 0,
      kevinLevel: 1,
      marcoLevel: 1,
      kevinEarlyStreak: 0,
      marcoEarlyStreak: 0,
      kevinLastCheckIn: '',
      marcoLastCheckIn: '',
      weeklyRewardText: 'Cena Libre + Tarde Libre de Socios',
      soundEnabled: true,
      manualHoursOverride: {},
      clientHpMap: defaultClientHp,
      manualBossReelsBonus: 0,
      bossChestReelsCount: 0,
      updatedAt: '',
      ...overrides,
    };
  };

  const [rpgState, setRpgState] = useState(() => {
    const defaults = getOfficialZeroRpgDefaults();
    try {
      localStorage.removeItem('zenda_rpg_os_v1');
      const raw = localStorage.getItem('zenda_rpg_os_v2');
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      if (parsed.seasonVersion !== CURRENT_SEASON_VERSION) {
        localStorage.removeItem('zenda_rpg_os_v2');
        return defaults;
      }
      const kevinXP = Number(parsed.kevinBaseXP ?? parsed.xp?.Kevin ?? 0);
      const marcoXP = Number(parsed.marcoBaseXP ?? parsed.xp?.Marco ?? 0);
      const kevinStrk = Number(parsed.kevinEarlyStreak ?? parsed.streak?.Kevin ?? 0);
      const marcoStrk = Number(parsed.marcoEarlyStreak ?? parsed.streak?.Marco ?? 0);
      return {
        ...defaults,
        ...parsed,
        kevinBaseXP: kevinXP,
        marcoBaseXP: marcoXP,
        kevinLevel: Math.floor(kevinXP / XP_PER_LEVEL) + 1,
        marcoLevel: Math.floor(marcoXP / XP_PER_LEVEL) + 1,
        kevinEarlyStreak: kevinStrk,
        marcoEarlyStreak: marcoStrk,
        xp: { Kevin: kevinXP, Marco: marcoXP },
        level: {
          Kevin: Math.floor(kevinXP / XP_PER_LEVEL) + 1,
          Marco: Math.floor(marcoXP / XP_PER_LEVEL) + 1,
        },
        streak: { Kevin: kevinStrk, Marco: marcoStrk },
        clientsHp: parsed.clientsHp || parsed.clientHpMap || defaults.clientsHp,
        clientLastPublishedMap: parsed.clientLastPublishedMap || {},
        weeklyReward: parsed.weeklyReward || parsed.weeklyRewardText || defaults.weeklyReward,
        activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
        webhookUrl: parsed.webhookUrl || '',
      };
    } catch {
      return defaults;
    }
  });

  const persistRpgToFirestore = async (payload) => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'zenda_system', 'rpg_state'), payload, { merge: true });
      setRpgSyncOnline(true);
    } catch (err) {
      console.warn('[Firestore] Error sincronizando zenda_system/rpg_state:', err);
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(
          doc(db, 'zenda_clients', 'client-zenda-agency'),
          { rpgStateMirror: payload },
          { merge: true },
        );
        setRpgSyncOnline(true);
      } catch {
        // ignore fallback error
      }
    }
  };

  const updateRpgState = (updater) => {
    setRpgState((prev) => {
      const partial = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const kevinXP = Math.max(
        0,
        Number(partial.kevinBaseXP ?? partial.xp?.Kevin ?? prev.kevinBaseXP ?? prev.xp?.Kevin ?? 0),
      );
      const marcoXP = Math.max(
        0,
        Number(partial.marcoBaseXP ?? partial.xp?.Marco ?? prev.marcoBaseXP ?? prev.xp?.Marco ?? 0),
      );
      const kevinLvl = Math.floor(kevinXP / XP_PER_LEVEL) + 1;
      const marcoLvl = Math.floor(marcoXP / XP_PER_LEVEL) + 1;
      const kevinStrk = Math.max(
        0,
        Number(partial.kevinEarlyStreak ?? partial.streak?.Kevin ?? prev.kevinEarlyStreak ?? 0),
      );
      const marcoStrk = Math.max(
        0,
        Number(partial.marcoEarlyStreak ?? partial.streak?.Marco ?? prev.marcoEarlyStreak ?? 0),
      );
      const rewardStr =
        partial.weeklyRewardText ??
        partial.weeklyReward ??
        prev.weeklyRewardText ??
        'Cena Libre + Tarde Libre de Socios';
      const mergedHp = {
        ...(prev.clientHpMap || {}),
        ...(prev.clientsHp || {}),
        ...(partial.clientHpMap || {}),
        ...(partial.clientsHp || {}),
      };
      const mergedLastPubMap = {
        ...(prev.clientLastPublishedMap || {}),
        ...(partial.clientLastPublishedMap || {}),
      };
      const reelsCount = Math.max(
        0,
        Number(partial.weeklyReels ?? partial.bossChestReelsCount ?? prev.bossChestReelsCount ?? 0),
      );
      const nextActivityLog = Array.isArray(partial.activityLog)
        ? partial.activityLog.slice(0, 15)
        : Array.isArray(prev.activityLog)
        ? prev.activityLog.slice(0, 15)
        : [];
      const nextHistory = Array.isArray(partial.history)
        ? partial.history.slice(0, 200)
        : Array.isArray(prev.history)
        ? prev.history.slice(0, 200)
        : [];
      const nextCustomCategories = Array.isArray(partial.customCategories)
        ? partial.customCategories
        : Array.isArray(prev.customCategories)
        ? prev.customCategories
        : [];
      const nextWebhookUrl =
        partial.webhookUrl !== undefined ? partial.webhookUrl : prev.webhookUrl || '';

      const next = {
        ...prev,
        ...partial,
        seasonVersion: CURRENT_SEASON_VERSION,
        kevinBaseXP: kevinXP,
        marcoBaseXP: marcoXP,
        kevinLevel: kevinLvl,
        marcoLevel: marcoLvl,
        kevinEarlyStreak: kevinStrk,
        marcoEarlyStreak: marcoStrk,
        weeklyRewardText: rewardStr,
        weeklyReward: rewardStr,
        clientHpMap: mergedHp,
        clientsHp: mergedHp,
        clientLastPublishedMap: mergedLastPubMap,
        weeklyReels: reelsCount,
        bossChestReelsCount: reelsCount,
        xp: { Kevin: kevinXP, Marco: marcoXP },
        level: { Kevin: kevinLvl, Marco: marcoLvl },
        streak: { Kevin: kevinStrk, Marco: marcoStrk },
        activityLog: nextActivityLog,
        history: nextHistory,
        customCategories: nextCustomCategories,
        webhookUrl: nextWebhookUrl,
        quests: Array.isArray(partial.quests)
          ? partial.quests
          : Array.isArray(prev.quests)
          ? prev.quests
          : [],
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem('zenda_rpg_os_v2', JSON.stringify(next));
      } catch {
        // ignore localStorage cache errors
      }
      persistRpgToFirestore(next);
      return next;
    });
  };

  // Estado de Clientes 360°
  const [selectedClient360Id, setSelectedClient360Id] = useState(null);
  const [client360Tab, setClient360Tab] = useState('metrics'); // 'metrics' | 'finances' | 'scripts' | 'infra' | 'dossier'
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
    leadOwner: 'Kevin',
    contact: '',
  });

  // Modales de otros módulos
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [newSprint, setNewSprint] = useState(() => ({
    title: '',
    client: 'Zenda Agency',
    assignee: 'Kevin',
    questDifficulty: 'Guion',
    customXp: 100,
    stage: 'Guion',
    priority: 'Alta',
    deadline: getTodayDate(),
  }));

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [newContent, setNewContent] = useState(() => ({
    title: '',
    client: 'Dolciangel',
    stage: 'Guion listo',
    assignee: 'Kevin',
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
    assignee: 'Kevin',
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

  // Filtros dinámicos
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
  const todayDateStr = useMemo(() => getTodayDate(), []);

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2600);
  };

  const triggerCelebration = () => {
    setCelebrationBurst(true);
    setTimeout(() => {
      setCelebrationBurst(false);
    }, 3800);
  };

  // ============================================================================
  // NOTIFICACIONES DE CALENDARIO (WEB PUSH + WEBHOOK OPCIONAL n8n/WhatsApp)
  // ============================================================================
  const sendCalendarWebhookPost = async ({
    title,
    time,
    assignedTo,
    client = 'Zenda Agency',
    type = 'Alerta Calendario',
    date = todayDateStr,
    trigger = 'calendar_alert',
  }) => {
    const targetUrl = String(rpgState.webhookUrl || '').trim();
    if (!targetUrl) return;
    try {
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          time,
          assignedTo,
          client,
          type,
          date,
          trigger,
          triggeredAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('[Webhook] Error enviando POST a Webhook URL:', err);
    }
  };

  const handleEnableBrowserAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Este navegador no soporta Web Notifications');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        playRpgSound('alert', rpgState.soundEnabled);
        try {
          new Notification('🔔 Alertas Zenda OS Activadas', {
            body: 'Recibirás avisos 15 min antes de cada evento y a las 7:25 AM para el Despegue.',
            icon: '/isotipo-zenda.png',
          });
        } catch {
          // ignore notification constructor error on mobile webviews
        }
        showToast('🔔 Alertas del navegador activadas');
      } else {
        showToast('Permiso de notificaciones denegado en el navegador');
      }
    } catch (err) {
      console.warn('[Notifications] Error solicitando permiso:', err);
    }
  };

  // Watcher cada 30 segundos para eventos de hoy en zenda_calendar (15 min antes) y 7:25 AM Despegue
  useEffect(() => {
    const checkCalendarAlerts = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      // 1. Alerta 7:25 AM para el Despegue (5 minutos antes de las 7:30 AM)
      if (currentH === 7 && currentM === 25) {
        let alreadyFiredDespegue = false;
        try {
          alreadyFiredDespegue =
            localStorage.getItem('zenda_despegue_alert_date') === todayStr;
        } catch {
          // ignore storage error
        }

        if (!alreadyFiredDespegue) {
          try {
            localStorage.setItem('zenda_despegue_alert_date', todayStr);
          } catch {
            // ignore storage error
          }
          playRpgSound('alert', rpgState.soundEnabled);
          showToast('🔔 7:25 AM · En 5 min: 7:30 AM Despegue (+50 XP)');
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification('🚀 7:25 AM · Despegue Zenda en 5 min', {
                body: 'Kevin y Marco: el check-in 7:30 AM Despegue (+50 XP) está habilitado.',
                icon: '/isotipo-zenda.png',
              });
            } catch {
              // ignore notification error
            }
          }
          sendCalendarWebhookPost({
            title: '7:30 AM Despegue Zenda (en 5 min)',
            time: '07:30',
            assignedTo: 'Kevin & Marco',
            client: 'Zenda Agency',
            type: 'Despegue Matutino',
            date: todayStr,
            trigger: 'despegue_725am',
          });
        }
      }

      // 2. Revisar eventos del día en zenda_calendar (15 minutos antes de cada evento)
      const todaysEvents = calendarEvents.filter(
        (ev) => ev.date === todayStr && !ev.completed && ev.time,
      );
      if (!todaysEvents.length) return;

      let notifiedMap = {};
      try {
        const rawMap = localStorage.getItem('zenda_calendar_notified_v1');
        if (rawMap) notifiedMap = JSON.parse(rawMap);
      } catch {
        notifiedMap = {};
      }

      let mapUpdated = false;
      for (const ev of todaysEvents) {
        const notifyKey = `${ev.id}_${todayStr}_${ev.time}`;
        if (notifiedMap[notifyKey]) continue;

        const [evHourStr, evMinStr] = String(ev.time).split(':');
        const evHour = Number(evHourStr);
        const evMin = Number(evMinStr);
        if (Number.isNaN(evHour) || Number.isNaN(evMin)) continue;

        const eventDateObj = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          evHour,
          evMin,
          0,
        );
        const diffMinutes = (eventDateObj.getTime() - now.getTime()) / 60000;

        // Dispara cuando faltan entre 1 y 15 minutos para el evento
        if (diffMinutes > 0 && diffMinutes <= 15) {
          notifiedMap[notifyKey] = true;
          mapUpdated = true;
          const minsLeft = Math.ceil(diffMinutes);
          const assignedTo = ev.assignee || 'Equipo';

          playRpgSound('alert', rpgState.soundEnabled);
          showToast(`🔔 En ${minsLeft} min: ${ev.title} (${ev.time} · @${assignedTo})`);

          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(`⏰ En ${minsLeft} min: ${ev.title}`, {
                body: `${ev.client || 'Zenda'} · ${ev.time} hrs · Asignado a @${assignedTo}`,
                icon: '/isotipo-zenda.png',
              });
            } catch {
              // ignore notification error
            }
          }

          sendCalendarWebhookPost({
            title: ev.title,
            time: ev.time,
            assignedTo,
            client: ev.client || 'Zenda Agency',
            type: ev.type || 'Evento Calendario',
            date: ev.date,
            trigger: 'alert_15m_before',
          });
        }
      }

      if (mapUpdated) {
        try {
          localStorage.setItem('zenda_calendar_notified_v1', JSON.stringify(notifiedMap));
        } catch {
          // ignore storage error
        }
      }
    };

    checkCalendarAlerts();
    const watcherId = setInterval(checkCalendarAlerts, 30000);
    return () => clearInterval(watcherId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarEvents, rpgState.soundEnabled, rpgState.webhookUrl]);

  // ============================================================================
  // SINCRONIZACIÓN EN TIEMPO REAL CON FIRESTORE (onSnapshot)
  // ============================================================================
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let unsubZendaClients;
    let unsubRpgState;
    let unsubScripts;
    let unsubSprints;
    let unsubContent;
    let unsubCalendar;
    let unsubFinances;
    let unsubOnboarding;
    let unsubLeads;

    import('firebase/firestore').then(
      ({ collection, onSnapshot, query, orderBy, doc, setDoc }) => {
        // 0. zenda_system/rpg_state (Sincronización RPG en tiempo real Kevin <-> Marco)
        try {
          const rpgDocRef = doc(db, 'zenda_system', 'rpg_state');
          unsubRpgState = onSnapshot(
            rpgDocRef,
            async (docSnap) => {
              setRpgSyncOnline(true);
              if (!docSnap.exists() || docSnap.data()?.seasonVersion !== CURRENT_SEASON_VERSION) {
                // Reinicio oficial a 0 XP, LVL 1, Racha 0d, 0/12 Reels al iniciar temporada oficial
                const zeroPayload = getOfficialZeroRpgDefaults({
                  webhookUrl: docSnap.exists() ? docSnap.data()?.webhookUrl || '' : '',
                  updatedAt: new Date().toISOString(),
                });
                setRpgState(zeroPayload);
                try {
                  localStorage.setItem('zenda_rpg_os_v2', JSON.stringify(zeroPayload));
                } catch {
                  // ignore cache write error
                }
                try {
                  await setDoc(rpgDocRef, zeroPayload);
                  await Promise.all(
                    OFFICIAL_INITIAL_CLIENTS.map((client) =>
                      setDoc(
                        doc(db, 'zenda_clients', client.id),
                        { videosPublicadosEstaSemana: 0 },
                        { merge: true },
                      ),
                    ),
                  );
                } catch (seedErr) {
                  console.warn('[Firestore] No se pudo inicializar temporada 0 en zenda_system/rpg_state:', seedErr);
                }
              } else {
                const cloudData = docSnap.data();
                setRpgState((prev) => {
                  const kevinXP = Math.max(
                    0,
                    Number(cloudData.kevinBaseXP ?? cloudData.xp?.Kevin ?? prev.kevinBaseXP ?? 0),
                  );
                  const marcoXP = Math.max(
                    0,
                    Number(cloudData.marcoBaseXP ?? cloudData.xp?.Marco ?? prev.marcoBaseXP ?? 0),
                  );
                  const kevinLvl = Math.floor(kevinXP / XP_PER_LEVEL) + 1;
                  const marcoLvl = Math.floor(marcoXP / XP_PER_LEVEL) + 1;
                  const kevinStrk = Math.max(
                    0,
                    Number(
                      cloudData.kevinEarlyStreak ??
                        cloudData.streak?.Kevin ??
                        prev.kevinEarlyStreak ??
                        0,
                    ),
                  );
                  const marcoStrk = Math.max(
                    0,
                    Number(
                      cloudData.marcoEarlyStreak ??
                        cloudData.streak?.Marco ??
                        prev.marcoEarlyStreak ??
                        0,
                    ),
                  );
                  const mergedHp = {
                    ...(prev.clientHpMap || {}),
                    ...(prev.clientsHp || {}),
                    ...(cloudData.clientHpMap || {}),
                    ...(cloudData.clientsHp || {}),
                  };
                  const rewardStr =
                    cloudData.weeklyRewardText ??
                    cloudData.weeklyReward ??
                    prev.weeklyRewardText ??
                    'Cena Libre + Tarde Libre de Socios';
                  const merged = {
                    ...prev,
                    ...cloudData,
                    seasonVersion: CURRENT_SEASON_VERSION,
                    kevinBaseXP: kevinXP,
                    marcoBaseXP: marcoXP,
                    kevinLevel: kevinLvl,
                    marcoLevel: marcoLvl,
                    kevinEarlyStreak: kevinStrk,
                    marcoEarlyStreak: marcoStrk,
                    weeklyRewardText: rewardStr,
                    weeklyReward: rewardStr,
                    xp: { Kevin: kevinXP, Marco: marcoXP },
                    level: { Kevin: kevinLvl, Marco: marcoLvl },
                    streak: { Kevin: kevinStrk, Marco: marcoStrk },
                    activityLog: Array.isArray(cloudData.activityLog)
                      ? cloudData.activityLog
                      : prev.activityLog || [],
                    history: Array.isArray(cloudData.history)
                      ? cloudData.history
                      : prev.history || [],
                    customCategories: Array.isArray(cloudData.customCategories)
                      ? cloudData.customCategories
                      : prev.customCategories || [],
                    clientLastPublishedMap: {
                      ...(prev.clientLastPublishedMap || {}),
                      ...(cloudData.clientLastPublishedMap || {}),
                    },
                    webhookUrl:
                      cloudData.webhookUrl !== undefined
                        ? cloudData.webhookUrl
                        : prev.webhookUrl || '',
                    manualHoursOverride: {
                      ...(prev.manualHoursOverride || {}),
                      ...(cloudData.manualHoursOverride || {}),
                    },
                    clientHpMap: mergedHp,
                    clientsHp: mergedHp,
                  };
                  try {
                    localStorage.setItem('zenda_rpg_os_v2', JSON.stringify(merged));
                  } catch {
                    // ignore localStorage cache write error
                  }
                  return merged;
                });
              }
            },
            (err) => {
              console.warn('[Firestore] zenda_system/rpg_state listener:', err);
            },
          );
        } catch (e) {
          console.warn('[Firestore] Error suscribiendo zenda_system/rpg_state:', e);
        }

        // 1. zenda_clients (Asegura las 4 cuentas oficiales: Zenda Agency, Dolciangel, La Lanchita, King's Barber Shop)
        try {
          const colClients = collection(db, 'zenda_clients');
          unsubZendaClients = onSnapshot(
            colClients,
            async (snapshot) => {
              setRpgSyncOnline(true);
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
                const completeClients = ensureFourOfficialAccounts(liveClients);
                setZendaClients(completeClients);

                const zendaDoc = liveClients.find((c) => c.id === 'client-zenda-agency');
                if (
                  zendaDoc?.rpgStateMirror &&
                  zendaDoc.rpgStateMirror.seasonVersion === CURRENT_SEASON_VERSION
                ) {
                  setRpgState((prev) => ({
                    ...prev,
                    ...zendaDoc.rpgStateMirror,
                  }));
                }

                // Si faltaba alguna de las 4 cuentas oficiales (ej. Zenda Agency), la sincroniza en Firestore
                for (const official of OFFICIAL_INITIAL_CLIENTS) {
                  const offKey = normalizeAccountKey(official.name);
                  const found = liveClients.some(
                    (c) => c.id === official.id || normalizeAccountKey(c.name) === offKey,
                  );
                  if (!found) {
                    setDoc(doc(db, 'zenda_clients', official.id), official).catch(() => {});
                  }
                }
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
              setRpgSyncOnline(true);
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
              setSprints(live);
              setRpgState((prev) => {
                const next = { ...prev, quests: live };
                try {
                  localStorage.setItem('zenda_rpg_os_v2', JSON.stringify(next));
                } catch {
                  // ignore localStorage error
                }
                return next;
              });
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
      if (unsubRpgState) unsubRpgState();
      if (unsubScripts) unsubScripts();
      if (unsubSprints) unsubSprints();
      if (unsubContent) unsubContent();
      if (unsubCalendar) unsubCalendar();
      if (unsubFinances) unsubFinances();
      if (unsubOnboarding) unsubOnboarding();
      if (unsubLeads) unsubLeads();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // REINICIAR TEMPORADA A 0 (0 XP, LVL 1, Racha 0d, 0/12 Reels) & REINICIO BASE
  // ============================================================================

  const handleResetSeasonToZero = async () => {
    setIsResettingSeason(true);
    try {
      const zeroSeasonPayload = getOfficialZeroRpgDefaults({
        weeklyRewardText: rpgState.weeklyRewardText || 'Cena Libre + Tarde Libre de Socios',
        weeklyReward: rpgState.weeklyRewardText || 'Cena Libre + Tarde Libre de Socios',
        webhookUrl: rpgState.webhookUrl || '',
        soundEnabled: rpgState.soundEnabled ?? true,
        quests: sprints,
        updatedAt: new Date().toISOString(),
      });

      setRpgState(zeroSeasonPayload);
      setZendaClients((prev) =>
        prev.map((c) => ({ ...c, videosPublicadosEstaSemana: 0 })),
      );
      try {
        localStorage.setItem('zenda_rpg_os_v2', JSON.stringify(zeroSeasonPayload));
      } catch {
        // ignore localStorage error
      }

      if (isFirebaseConfigured && db) {
        const { doc, setDoc } = await import('firebase/firestore');
        await Promise.all([
          setDoc(doc(db, 'zenda_system', 'rpg_state'), zeroSeasonPayload),
          ...zendaClients.map((client) =>
            setDoc(
              doc(db, 'zenda_clients', client.id),
              { videosPublicadosEstaSemana: 0 },
              { merge: true },
            ),
          ),
        ]);
      }

      showToast('Temporada reiniciada a 0 XP · LVL 1 · Racha 0d · 0/12 Reels');
    } catch (err) {
      console.warn('[Firestore] Error reiniciando temporada a 0:', err);
      showToast('Error al reiniciar temporada');
    } finally {
      setIsResettingSeason(false);
    }
  };

  const handleResetRealDatabase = async () => {
    setIsResettingBase(true);
    try {
      const resetRpgPayload = getOfficialZeroRpgDefaults({
        webhookUrl: rpgState.webhookUrl || '',
        updatedAt: new Date().toISOString(),
      });

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

        // Sembrar las 4 cuentas oficiales con contadores en 0 y reiniciar zenda_system/rpg_state en 0 XP
        await Promise.all([
          ...OFFICIAL_INITIAL_CLIENTS.map((client) =>
            setDoc(doc(db, 'zenda_clients', client.id), client),
          ),
          setDoc(doc(db, 'zenda_system', 'rpg_state'), resetRpgPayload),
        ]);
      }

      setRpgState(resetRpgPayload);
      try {
        localStorage.setItem('zenda_rpg_os_v2', JSON.stringify(resetRpgPayload));
      } catch {
        // ignore localStorage error
      }
      setZendaClients(OFFICIAL_INITIAL_CLIENTS);
      setSprints([]);
      setContentList([]);
      setCalendarEvents([]);
      setFinances([]);
      setScriptsList([]);
      setSelectedClient360Id(null);
      setResetModalOpen(false);
      showToast('Base real y temporada RPG reiniciadas a 0 en Firestore');
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
      leadOwner: newClientForm.leadOwner || 'Kevin',
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
      leadOwner: 'Kevin',
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
    const nowIso = new Date().toISOString();

    await handleUpdateScript(script.id, {
      status: nextStatus,
      ...(nextStatus === 'Publicado' ? { publishedAt: nowIso } : {}),
    });

    const currentCount = Number(selectedClient360.videosPublicadosEstaSemana || 0);
    const nextCount = wasPublished ? Math.max(0, currentCount - 1) : currentCount + 1;

    await handleUpdateClientField(
      selectedClient360.id,
      {
        videosPublicadosEstaSemana: nextCount,
        ...(nextStatus === 'Publicado' ? { lastPublishedAt: nowIso, health: 'En ritmo' } : {}),
      },
      wasPublished ? 'Guion desmarcado como publicado' : 'Guardado en Zenda OS (+1 video publicado)',
    );
    setNowMs(Date.now());
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
  // ACCIONES OPERATIVAS DIARIAS DE 1 CLIC (Guion → Grabado → Editado → Publicado)
  // ============================================================================

  const showFloatingXp = (player, amount, customLabel = null) => {
    setFloatingXpPopup({
      id: Date.now(),
      player,
      amount,
      label: customLabel || `+${amount} XP`,
    });
    setTimeout(() => {
      setFloatingXpPopup(null);
    }, 2200);
  };

  /**
   * Avanza una Quest del Día en 1 clic:
   * Pendiente → En Curso → Completado
   * Suma el XP asignado (libre o preset), registra en el Log de Actividad en Vivo y en la Bóveda (history),
   * restaura HP del cliente al 100% si es cuenta de cliente y dispara confeti al cerrar las 3 misiones diarias.
   */
  const handleAdvanceQuestRpgState = async (task, explicitRpgStatus = null) => {
    if (!task) return;
    const currentRpg = getQuestRpgStatus(task);
    const currentIdx = QUEST_STATES.indexOf(currentRpg);
    const assignee = normalizeAssignee(task.assignee);
    const diffInfo = getQuestDifficultyInfo(task);

    let nextRpg = explicitRpgStatus;
    if (!nextRpg) {
      if (currentRpg === 'Completado') {
        nextRpg = 'En Curso';
      } else {
        nextRpg = QUEST_STATES[Math.min(currentIdx + 1, QUEST_STATES.length - 1)];
      }
    }

    if (nextRpg === currentRpg) return;

    const isNowCompleted = nextRpg === 'Completado';
    const wasCompleted = currentRpg === 'Completado';
    const nextStage =
      nextRpg === 'Completado'
        ? 'Publicado'
        : nextRpg === 'En Curso'
        ? 'Grabado'
        : 'Guion';
    const nowIso = new Date().toISOString();

    const updates = {
      questStatus: nextRpg,
      stage: nextStage,
      completed: isNowCompleted,
      updatedAt: nowIso,
      ...(isNowCompleted
        ? { publishedAt: nowIso, completedDate: todayDateStr }
        : { publishedAt: null, completedDate: null }),
    };

    const playerCompletedBefore = sprints.filter(
      (s) =>
        s.id !== task.id &&
        normalizeAssignee(s.assignee) === assignee &&
        getQuestRpgStatus(s) === 'Completado',
    ).length;

    const nextQuestsList = sprints.map((s) => (s.id === task.id ? { ...s, ...updates } : s));
    setSprints(nextQuestsList);
    setNowMs(Date.now());

    // Actualizar XP del jugador en vivo, registrar en Log de Actividad + Historial permanente en zenda_system/rpg_state
    if (isNowCompleted && !wasCompleted) {
      const xpKey = assignee === 'Kevin' ? 'kevinBaseXP' : 'marcoBaseXP';
      const exactTimeStr = formatExactTime(new Date());
      const newLogEntry = {
        id: `act-${Date.now()}`,
        player: assignee,
        action: task.title,
        category: task.client || 'Zenda Agency',
        difficulty: diffInfo.label,
        xp: diffInfo.xp,
        time: exactTimeStr,
        createdAt: nowIso,
      };
      const newHistoryEntry = {
        id: `hist-${Date.now()}`,
        questId: task.id,
        type: diffInfo.id === 'Reel Publicado' ? 'reel' : 'quest',
        player: assignee,
        account: task.client || 'Zenda Agency',
        title: task.title,
        link: task.link || '',
        xp: diffInfo.xp,
        date: todayDateStr,
        time: exactTimeStr,
        createdAt: nowIso,
      };
      updateRpgState((prev) => ({
        ...prev,
        [xpKey]: Math.max(0, Number(prev[xpKey] ?? 0)) + diffInfo.xp,
        quests: nextQuestsList,
        activityLog: [newLogEntry, ...(prev.activityLog || [])].slice(0, 15),
        history: [newHistoryEntry, ...(prev.history || [])].slice(0, 200),
      }));
      showFloatingXp(assignee, diffInfo.xp, `+${diffInfo.xp} XP · ${task.client || diffInfo.label}`);

      const newDoneCount = playerCompletedBefore + 1;
      if (newDoneCount >= 3) {
        playRpgSound('fanfare', rpgState.soundEnabled);
        triggerCelebration();
        showToast(`¡${assignee} completó sus 3 Quests del Día! (+${diffInfo.xp} XP)`);
      } else {
        playRpgSound('xp', rpgState.soundEnabled);
        showToast(`Quest Completada por ${assignee}: +${diffInfo.xp} XP`);
      }
    } else if (!isNowCompleted && wasCompleted) {
      const xpKey = assignee === 'Kevin' ? 'kevinBaseXP' : 'marcoBaseXP';
      updateRpgState((prev) => ({
        ...prev,
        [xpKey]: Math.max(0, Number(prev[xpKey] ?? 0) - diffInfo.xp),
        quests: nextQuestsList,
      }));
      showToast(`Quest reabierta: En Curso (${task.client})`);
    } else if (nextRpg === 'En Curso') {
      updateRpgState((prev) => ({ ...prev, quests: nextQuestsList }));
      playRpgSound('advance', rpgState.soundEnabled);
      showToast(`Quest En Curso: ${task.title} (${task.client})`);
    } else {
      updateRpgState((prev) => ({ ...prev, quests: nextQuestsList }));
    }

    // Si es una misión de cliente (no personal) y se completa, restaurar HP y actualizar reels si es Reel Publicado
    if (!isPersonalCategory(task.client)) {
      const accountKey = normalizeAccountKey(task.client);
      const matchingClient = zendaClients.find(
        (c) => normalizeAccountKey(c.name) === accountKey,
      );

      if (matchingClient && (isNowCompleted || wasCompleted)) {
        const isReelPub = diffInfo.id === 'Reel Publicado';
        const currentVidCount = Number(matchingClient.videosPublicadosEstaSemana || 0);
        const nextVidCount = isNowCompleted
          ? currentVidCount + 1
          : Math.max(0, currentVidCount - 1);

        if (isNowCompleted) {
          setHealedClientFlashId(matchingClient.id);
          setTimeout(() => setHealedClientFlashId(null), 2400);
          updateRpgState((prev) => ({
            ...prev,
            manualHoursOverride: {
              ...(prev.manualHoursOverride || {}),
              [matchingClient.id]: 0,
            },
            clientLastPublishedMap: {
              ...(prev.clientLastPublishedMap || {}),
              [matchingClient.id]: nowIso,
            },
            clientHpMap: {
              ...(prev.clientHpMap || {}),
              [matchingClient.id]: 100,
            },
            ...(isReelPub
              ? {
                  bossChestReelsCount: Math.min(
                    12,
                    Number(prev.bossChestReelsCount || 0) + 1,
                  ),
                }
              : {}),
          }));
        }

        if (isReelPub) {
          await handleUpdateClientField(
            matchingClient.id,
            {
              videosPublicadosEstaSemana: nextVidCount,
              ...(isNowCompleted ? { lastPublishedAt: nowIso, health: 'En ritmo' } : {}),
            },
            '',
          );
        }
      }
    }

    if (isFirebaseConfigured && db && !task.id.startsWith('local-sp-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_sprints', task.id), updates);
      } catch (err) {
        console.warn('[Firestore] Error avanzando estado RPG de quest:', err);
      }
    }
  };

  /**
   * Cambia el XP libre (customXp) de una Quest activa
   */
  const handleChangeQuestCustomXp = async (task, newXpValue) => {
    if (!task) return;
    const parsedXp = Math.max(10, Number(newXpValue) || 100);
    const nextList = sprints.map((s) =>
      s.id === task.id ? { ...s, customXp: parsedXp } : s,
    );
    setSprints(nextList);
    updateRpgState((prev) => ({ ...prev, quests: nextList }));
    showToast(`Recompensa de Quest actualizada: +${parsedXp} XP`);

    if (isFirebaseConfigured && db && !task.id.startsWith('local-sp-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_sprints', task.id), { customXp: parsedXp });
      } catch (err) {
        console.warn('[Firestore] Error actualizando customXp de quest:', err);
      }
    }
  };

  /**
   * Crea una nueva categoría personalizada y la guarda en zenda_system/rpg_state
   */
  const handleCreateCustomCategory = (targetContext) => {
    const cleanName = customCategoryDraft.trim();
    if (!cleanName) return;

    const existingList = Array.isArray(rpgState.customCategories)
      ? rpgState.customCategories
      : [];
    const nextCustomList = existingList.includes(cleanName)
      ? existingList
      : [...existingList, cleanName];

    updateRpgState({ customCategories: nextCustomList });

    if (targetContext === 'Kevin') {
      setQuickMissionKevin((prev) => ({ ...prev, client: cleanName }));
    } else if (targetContext === 'Marco') {
      setQuickMissionMarco((prev) => ({ ...prev, client: cleanName }));
    } else if (targetContext === 'modal') {
      setNewSprint((prev) => ({ ...prev, client: cleanName }));
    }

    setCustomCategoryDraft('');
    setAddingCustomCategoryFor(null);
    showToast(`Categoría "${cleanName}" creada en Zenda OS`);
  };

  /**
   * Abre el mini-modal Anti-Trampa al pulsar '+ Publicar' en una de las 4 cuentas
   */
  const handleOpenPublishModal = (client) => {
    if (!client) return;
    setPublishModalClient(client);
    setPublishForm({
      player: normalizeAssignee(client.leadOwner || 'Kevin'),
      title: '',
      link: '',
    });
  };

  /**
   * Confirmar Publicación Anti-Trampa:
   * Restaura HP al 100%, suma +200 XP al jugador elegido, sube la Meta Semanal (X/12)
   * y guarda el registro permanente en Firestore (zenda_system/rpg_state.history).
   */
  const handleConfirmAntiCheatPublish = async (e) => {
    e.preventDefault();
    if (!publishModalClient || !publishForm.title.trim()) return;

    const client = publishModalClient;
    const chosenPlayer = normalizeAssignee(publishForm.player);
    const reelTitle = publishForm.title.trim();
    const reelLink = publishForm.link.trim();
    const nowIso = new Date().toISOString();
    const exactTimeStr = formatExactTime(new Date());
    const nextVidCount = Number(client.videosPublicadosEstaSemana || 0) + 1;
    const xpKey = chosenPlayer === 'Kevin' ? 'kevinBaseXP' : 'marcoBaseXP';

    setHealedClientFlashId(client.id);
    setTimeout(() => setHealedClientFlashId(null), 2600);
    playRpgSound('heal', rpgState.soundEnabled);

    const newLogEntry = {
      id: `act-${Date.now()}`,
      player: chosenPlayer,
      action: `Reel: ${reelTitle}`,
      category: client.name,
      difficulty: 'Reel Publicado',
      link: reelLink,
      xp: 200,
      time: exactTimeStr,
      createdAt: nowIso,
    };

    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      type: 'reel',
      player: chosenPlayer,
      account: client.name,
      title: reelTitle,
      link: reelLink,
      xp: 200,
      date: todayDateStr,
      time: exactTimeStr,
      createdAt: nowIso,
    };

    updateRpgState((prev) => ({
      ...prev,
      [xpKey]: Math.max(0, Number(prev[xpKey] ?? 0)) + 200,
      manualHoursOverride: {
        ...(prev.manualHoursOverride || {}),
        [client.id]: 0,
      },
      clientLastPublishedMap: {
        ...(prev.clientLastPublishedMap || {}),
        [client.id]: nowIso,
      },
      clientHpMap: {
        ...(prev.clientHpMap || {}),
        [client.id]: 100,
      },
      bossChestReelsCount: Math.min(12, Number(prev.bossChestReelsCount || 0) + 1),
      activityLog: [newLogEntry, ...(prev.activityLog || [])].slice(0, 15),
      history: [newHistoryEntry, ...(prev.history || [])].slice(0, 200),
    }));

    showFloatingXp(chosenPlayer, 200, `+200 XP · Reel Publicado (${client.name})`);

    await handleUpdateClientField(
      client.id,
      {
        lastPublishedAt: nowIso,
        videosPublicadosEstaSemana: nextVidCount,
        health: 'En ritmo',
      },
      `${client.name} al 100% HP · +200 XP para ${chosenPlayer}`,
    );

    setPublishModalClient(null);
    setPublishForm({ player: 'Kevin', title: '', link: '' });
    setNowMs(Date.now());
  };

  /**
   * Psicología Competitiva 1v1: Aplicar Penalización (-100 XP) por incumplimiento o quedarse dormido
   */
  const handleApplyPenalty = (e) => {
    e.preventDefault();
    const targetPlayer = normalizeAssignee(penaltyForm.player);
    const reasonText = penaltyForm.reason.trim() || 'Incumplimiento / Quedarse dormido';
    const xpKey = targetPlayer === 'Kevin' ? 'kevinBaseXP' : 'marcoBaseXP';
    const nowIso = new Date().toISOString();
    const exactTimeStr = formatExactTime(new Date());

    const penaltyLogEntry = {
      id: `act-pen-${Date.now()}`,
      player: targetPlayer,
      action: `Penalización: ${reasonText}`,
      category: 'Penalización',
      difficulty: 'Penalización',
      xp: -100,
      time: exactTimeStr,
      createdAt: nowIso,
    };

    const penaltyHistoryEntry = {
      id: `hist-pen-${Date.now()}`,
      type: 'quest',
      player: targetPlayer,
      account: 'Penalización 1v1',
      title: `Penalización: ${reasonText}`,
      link: '',
      xp: -100,
      date: todayDateStr,
      time: exactTimeStr,
      createdAt: nowIso,
    };

    updateRpgState((prev) => ({
      ...prev,
      [xpKey]: Math.max(0, Number(prev[xpKey] ?? 0) - 100),
      activityLog: [penaltyLogEntry, ...(prev.activityLog || [])].slice(0, 15),
      history: [penaltyHistoryEntry, ...(prev.history || [])].slice(0, 200),
    }));

    playRpgSound('advance', rpgState.soundEnabled);
    showToast(`Penalización aplicada a ${targetPlayer}: -100 XP (${reasonText})`);
    setPenaltyModalOpen(false);
  };

  /**
   * Abrir Modal de Perfil 360° & Métricas Reales de un Negocio (TikTok, IG, FB, Vistas, Engagement, WhatsApp)
   */
  const handleOpenMetricsModal = (client) => {
    if (!client) return;
    setMetricsModalClientId(client.id);
    setMetricsDraft(getClientSocialMetrics(client));
  };

  /**
   * Guardar Métricas Reales de Redes Sociales de un Negocio en Firestore (zenda_clients)
   */
  const handleSaveClientSocialMetrics = async (e, explicitClient = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetClient =
      explicitClient ||
      zendaClients.find((c) => c.id === metricsModalClientId) ||
      selectedClient360;
    if (!targetClient) return;

    const prevMetrics = getClientSocialMetrics(targetClient);
    const nextTiktok = Number(metricsDraft.tiktokFollowers) || 0;
    const nextIg = Number(metricsDraft.instagramFollowers) || 0;
    const nextFb = Number(metricsDraft.facebookFollowers) || 0;

    // Si el usuario modificó los seguidores actuales y no cambió manualmente la variación, calcula +X automáticamente
    const computedTiktokDelta =
      Number(metricsDraft.tiktokWeeklyDelta) !== Number(prevMetrics.tiktokWeeklyDelta)
        ? Number(metricsDraft.tiktokWeeklyDelta) || 0
        : prevMetrics.tiktokFollowers > 0 && nextTiktok !== prevMetrics.tiktokFollowers
        ? nextTiktok - prevMetrics.tiktokFollowers
        : Number(metricsDraft.tiktokWeeklyDelta) || 0;

    const computedIgDelta =
      Number(metricsDraft.instagramWeeklyDelta) !== Number(prevMetrics.instagramWeeklyDelta)
        ? Number(metricsDraft.instagramWeeklyDelta) || 0
        : prevMetrics.instagramFollowers > 0 && nextIg !== prevMetrics.instagramFollowers
        ? nextIg - prevMetrics.instagramFollowers
        : Number(metricsDraft.instagramWeeklyDelta) || 0;

    const computedFbDelta =
      Number(metricsDraft.facebookWeeklyDelta) !== Number(prevMetrics.facebookWeeklyDelta)
        ? Number(metricsDraft.facebookWeeklyDelta) || 0
        : prevMetrics.facebookFollowers > 0 && nextFb !== prevMetrics.facebookFollowers
        ? nextFb - prevMetrics.facebookFollowers
        : Number(metricsDraft.facebookWeeklyDelta) || 0;

    const updatedSocialMetrics = {
      tiktokFollowers: nextTiktok,
      tiktokGoal: Number(metricsDraft.tiktokGoal) || 0,
      tiktokWeeklyDelta: computedTiktokDelta,
      instagramFollowers: nextIg,
      instagramGoal: Number(metricsDraft.instagramGoal) || 0,
      instagramWeeklyDelta: computedIgDelta,
      facebookFollowers: nextFb,
      facebookGoal: Number(metricsDraft.facebookGoal) || 0,
      facebookWeeklyDelta: computedFbDelta,
      reelViews: Number(metricsDraft.reelViews) || 0,
      avgReach: Number(metricsDraft.avgReach) || 0,
      engagementRate: Number(metricsDraft.engagementRate) || 0,
      whatsappClicks: Number(metricsDraft.whatsappClicks) || 0,
      bestReelTitle: String(metricsDraft.bestReelTitle || '').trim(),
      bestReelViews: Number(metricsDraft.bestReelViews) || 0,
      bestReelUrl: String(metricsDraft.bestReelUrl || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    setMetricsDraft(updatedSocialMetrics);
    await handleUpdateClientField(
      targetClient.id,
      { socialMetrics: updatedSocialMetrics },
      `Métricas reales de ${targetClient.name} guardadas en Firestore`,
    );
    if (metricsModalClientId === targetClient.id) {
      setMetricsModalClientId(null);
    }
  };

  /**
   * Botón '7:30 AM Despegue (+50 XP)' habilitado entre 7:00 AM y 8:00 AM
   */
  const handleMorningCheckIn = (player) => {
    const currentHour = new Date(nowMs).getHours();
    const isWindowOpen = currentHour === 7;
    if (!isWindowOpen) {
      showToast('7:30 AM Despegue habilitado entre 7:00 AM y 8:00 AM');
      return;
    }

    const lastKey = player === 'Kevin' ? 'kevinLastCheckIn' : 'marcoLastCheckIn';
    const streakKey = player === 'Kevin' ? 'kevinEarlyStreak' : 'marcoEarlyStreak';
    const xpKey = player === 'Kevin' ? 'kevinBaseXP' : 'marcoBaseXP';

    if (rpgState[lastKey] === todayDateStr) {
      showToast(`${player} ya registró su 7:30 AM Despegue hoy`);
      return;
    }

    const nowIso = new Date().toISOString();
    const exactTimeStr = formatExactTime(new Date());

    const newLogEntry = {
      id: `act-${Date.now()}`,
      player,
      action: 'Check-in 7:30 AM Despegue',
      category: 'Personal / Hábito',
      difficulty: 'Hábito Diario',
      xp: 50,
      time: exactTimeStr,
      createdAt: nowIso,
    };

    const newHistoryEntry = {
      id: `hist-chk-${Date.now()}`,
      type: 'quest',
      player,
      account: 'Personal / Hábito',
      title: 'Check-in 7:30 AM Despegue',
      link: '',
      xp: 50,
      date: todayDateStr,
      time: exactTimeStr,
      createdAt: nowIso,
    };

    updateRpgState((prev) => ({
      ...prev,
      [lastKey]: todayDateStr,
      [streakKey]: Math.max(0, Number(prev[streakKey] ?? 0)) + 1,
      [xpKey]: Math.max(0, Number(prev[xpKey] ?? 0)) + 50,
      activityLog: [newLogEntry, ...(prev.activityLog || [])].slice(0, 15),
      history: [newHistoryEntry, ...(prev.history || [])].slice(0, 200),
    }));

    playRpgSound('xp', rpgState.soundEnabled);
    showFloatingXp(player, 50, '+50 XP · 7:30 AM Despegue');
    showToast(`7:30 AM Despegue de ${player}: +50 XP y +1 día de racha`);
  };

  /**
   * Creación rápida inline de Quest (con XP libre customXp y categoría) para Kevin, Marco o Backlog
   */
  const handleQuickCreateMissionInline = async ({
    title,
    client,
    assignee,
    questDifficulty = 'Guion',
    customXp = 100,
    priority = 'Urgente',
    deadline = todayDateStr,
    isTodayPinned = true,
  }) => {
    if (!title || !title.trim()) return;
    const nowIso = new Date().toISOString();
    const resolvedXp = Math.max(10, Number(customXp) || 100);

    const record = {
      title: title.trim(),
      client: client || 'Zenda Agency',
      assignee: normalizeAssignee(assignee),
      questDifficulty: questDifficulty || 'Reto',
      customXp: resolvedXp,
      questStatus: 'Pendiente',
      stage: 'Guion',
      priority,
      deadline,
      isTodayPinned,
      completed: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isFirebaseConfigured && db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'zenda_sprints'), {
          ...record,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Firestore] Error quick create mission:', err);
      }
    } else {
      setSprints((prev) => [{ id: `local-sp-${Date.now()}`, ...record }, ...prev]);
    }

    playRpgSound('advance', rpgState.soundEnabled);
    showToast(`Nueva Quest (+${resolvedXp} XP) asignada a ${record.assignee} (${record.client})`);
  };

  /**
   * Promueve en 1 clic un pendiente del Backlog a las 3 Quests del Día
   */
  const handlePromoteBacklogToToday = async (task) => {
    if (!task) return;
    const updates = {
      deadline: todayDateStr,
      priority: 'Urgente',
      isTodayPinned: true,
      updatedAt: new Date().toISOString(),
    };

    setSprints((prev) =>
      prev.map((s) => (s.id === task.id ? { ...s, ...updates } : s)),
    );
    playRpgSound('advance', rpgState.soundEnabled);
    showToast(`Subida a Quests del Día (${normalizeAssignee(task.assignee)})`);

    if (isFirebaseConfigured && db && !task.id.startsWith('local-sp-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_sprints', task.id), updates);
      } catch (err) {
        console.warn('[Firestore] Error promoviendo misión a hoy:', err);
      }
    }
  };

  /**
   * Cambia en 1 clic el jugador responsable de una Quest entre Kevin y Marco
   */
  const handleSwitchMissionAssignee = async (task) => {
    if (!task) return;
    const current = normalizeAssignee(task.assignee);
    const nextAssignee = current === 'Kevin' ? 'Marco' : 'Kevin';
    setSprints((prev) =>
      prev.map((s) => (s.id === task.id ? { ...s, assignee: nextAssignee } : s)),
    );
    showToast(`Quest transferida a @${nextAssignee}`);

    if (isFirebaseConfigured && db && !task.id.startsWith('local-sp-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_sprints', task.id), { assignee: nextAssignee });
      } catch (err) {
        console.warn('[Firestore] Error cambiando responsable:', err);
      }
    }
  };

  const handleAddSprint = async (e) => {
    e.preventDefault();
    if (!newSprint.title.trim()) return;

    const isPub = newSprint.stage === 'Publicado';
    const nowIso = new Date().toISOString();
    const resolvedXp = Math.max(10, Number(newSprint.customXp) || 100);

    const record = {
      title: newSprint.title.trim(),
      client: newSprint.client || zendaClients[0]?.name || 'Zenda Agency',
      assignee: normalizeAssignee(newSprint.assignee),
      questDifficulty:
        newSprint.questDifficulty ||
        (newSprint.stage === 'Publicado'
          ? 'Reel Publicado'
          : newSprint.stage === 'Grabado'
          ? 'Grabación'
          : getDefaultDifficultyForCategory(newSprint.client)),
      customXp: resolvedXp,
      questStatus: isPub ? 'Completado' : newSprint.stage === 'Grabado' ? 'En Curso' : 'Pendiente',
      stage: newSprint.stage || 'Guion',
      priority: newSprint.priority,
      deadline: newSprint.deadline,
      isTodayPinned: newSprint.deadline === todayDateStr,
      completed: isPub,
      ...(isPub ? { publishedAt: nowIso, completedDate: todayDateStr } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
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
      client: zendaClients[0]?.name || 'Zenda Agency',
      assignee: 'Kevin',
      questDifficulty: 'Guion',
      customXp: 100,
      stage: 'Guion',
      priority: 'Alta',
      deadline: getTodayDate(),
    });
    setSprintModalOpen(false);
    showToast(`Quest (+${resolvedXp} XP) guardada en Zenda OS`);
  };

  const handleDeleteSprint = async (id) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
    showToast('Quest eliminada');
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
    const nowIso = new Date().toISOString();

    const record = {
      title: newContent.title.trim(),
      client: newContent.client.trim(),
      stage: newContent.stage,
      assignee: normalizeAssignee(newContent.assignee),
      publishDate: newContent.publishDate,
      driveUrl: newContent.driveUrl.trim() || '',
      ...(newContent.stage === 'Publicado' ? { publishedAt: nowIso } : {}),
      createdAt: nowIso,
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
      assignee: 'Kevin',
      publishDate: getTodayDate(),
      driveUrl: '',
    });
    setContentModalOpen(false);
    showToast('Guardado en Zenda OS');
  };

  const handleUpdateContentStage = async (id, newStage) => {
    const nowIso = new Date().toISOString();
    const targetItem = contentList.find((c) => c.id === id);
    const updates = {
      stage: newStage,
      ...(newStage === 'Publicado' ? { publishedAt: nowIso } : {}),
    };

    setContentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
    setNowMs(Date.now());

    if (newStage === 'Publicado' && targetItem) {
      const accountKey = normalizeAccountKey(targetItem.client);
      const matchingClient = zendaClients.find(
        (c) => normalizeAccountKey(c.name) === accountKey,
      );
      if (matchingClient) {
        await handleUpdateClientField(
          matchingClient.id,
          {
            lastPublishedAt: nowIso,
            videosPublicadosEstaSemana: Number(matchingClient.videosPublicadosEstaSemana || 0) + 1,
            health: 'En ritmo',
          },
          '',
        );
      }
    }

    showToast('Guardado en Zenda OS');
    if (isFirebaseConfigured && db && !id.startsWith('local-cnt-')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'zenda_content', id), updates);
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

    sendCalendarWebhookPost({
      title: record.title,
      time: record.time,
      assignedTo: record.assignee,
      client: record.client,
      type: record.type,
      date: record.date,
      trigger: 'event_scheduled',
    });

    setNewCalendarEvent({
      title: '',
      client: zendaClients[0]?.name || 'Dolciangel',
      type: 'Rodaje presencial',
      date: getTodayDate(),
      time: '10:00',
      assignee: 'Kevin',
      notes: '',
    });
    setCalendarModalOpen(false);
    showToast('Evento agendado en Zenda OS');
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
  // CÁLCULOS RPG: BARRA DE SALUD (HP -25%/24H), DUELO 1v1, PERFILES & QUESTS
  // ============================================================================

  // Lista unificada de Categorías de Quest (4 Clientes Oficiales + Categorías Personales + Personalizadas)
  const allQuestCategoryOptions = useMemo(() => {
    const clientNames = zendaClients.map((c) => c.name);
    const customList = Array.isArray(rpgState.customCategories) ? rpgState.customCategories : [];
    const fromSprints = sprints
      .map((s) => String(s.client || '').trim())
      .filter(Boolean);
    const seen = new Set();
    const combined = [];
    for (const item of [...clientNames, ...PERSONAL_QUEST_CATEGORIES, ...customList, ...fromSprints]) {
      const k = item.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        combined.push(item);
      }
    }
    return combined;
  }, [zendaClients, rpgState.customCategories, sprints]);

  // 1. BARRA DE SALUD (HP) DE LOS 4 CLIENTES:
  // Empieza con 100% HP al publicar y pierde -25% HP por cada 24h sin publicación nueva.
  // Sincronizado entre las 4 tarjetas principales, el menú lateral (CUENTAS (4)) y zenda_system/rpg_state.
  const accountHealthCards = useMemo(() => {
    return zendaClients.map((client) => {
      const accountKey = normalizeAccountKey(client.name);
      const timestamps = [];

      const syncedLastPub =
        rpgState.clientLastPublishedMap?.[client.id] || client.lastPublishedAt;
      if (syncedLastPub) {
        const t = Date.parse(syncedLastPub);
        if (!Number.isNaN(t)) timestamps.push(t);
      }

      for (const sp of sprints) {
        if (
          normalizeAccountKey(sp.client) === accountKey &&
          getQuestRpgStatus(sp) === 'Completado' &&
          getQuestDifficultyInfo(sp).id === 'Reel Publicado'
        ) {
          const rawTs = sp.publishedAt || sp.updatedAt || sp.createdAt || sp.deadline;
          const t = rawTs ? Date.parse(rawTs) : NaN;
          if (!Number.isNaN(t)) timestamps.push(t);
        }
      }

      for (const cnt of contentList) {
        if (normalizeAccountKey(cnt.client) === accountKey && cnt.stage === 'Publicado') {
          const rawTs = cnt.publishedAt || cnt.updatedAt || cnt.publishDate || cnt.createdAt;
          const t = rawTs ? Date.parse(rawTs) : NaN;
          if (!Number.isNaN(t)) timestamps.push(t);
        }
      }

      for (const sc of scriptsList) {
        if (
          (sc.clientId === client.id || normalizeAccountKey(sc.clientName) === accountKey) &&
          sc.status === 'Publicado'
        ) {
          const rawTs = sc.publishedAt || sc.updatedAt;
          const t = rawTs ? Date.parse(rawTs) : NaN;
          if (!Number.isNaN(t)) timestamps.push(t);
        }
      }

      for (const hItem of rpgState.history || []) {
        if (hItem.type === 'reel' && normalizeAccountKey(hItem.account) === accountKey) {
          const t = hItem.createdAt ? Date.parse(hItem.createdAt) : NaN;
          if (!Number.isNaN(t)) timestamps.push(t);
        }
      }

      const overrideHours = rpgState.manualHoursOverride?.[client.id];
      const latestPublishedMs = timestamps.length > 0 ? Math.max(...timestamps) : null;
      const diffMs = latestPublishedMs !== null ? Math.max(0, nowMs - latestPublishedMs) : null;
      const computedHours =
        diffMs !== null ? Math.floor(diffMs / (1000 * 60 * 60)) : null;

      const hasPublishedThisWeek = Number(client.videosPublicadosEstaSemana || 0) > 0;
      const hoursSincePublish =
        overrideHours !== undefined && overrideHours !== null
          ? Number(overrideHours)
          : computedHours !== null
          ? computedHours
          : hasPublishedThisWeek
          ? 4
          : 76;

      const rawDecay = (hoursSincePublish / 24) * 25;
      const hpPercent = Math.max(0, Math.min(100, Math.round(100 - rawDecay)));

      let statusKey = 'red';
      let statusLabel = 'CUENTA EN PELIGRO';
      if (hpPercent > 60) {
        statusKey = 'green';
        statusLabel = 'ESCUDO ÓPTIMO';
      } else if (hpPercent >= 30) {
        statusKey = 'amber';
        statusLabel = 'DESGASTE ACTIVO';
      }

      const publishedPieceCount = Math.max(0, Number(client.videosPublicadosEstaSemana || 0));

      return {
        client,
        accountKey,
        hoursSincePublish,
        hpPercent,
        statusKey,
        statusLabel,
        publishedPieceCount,
        weeklyGoal: Number(client.weeklyVideoGoal || 3),
        isHealedFlashing: healedClientFlashId === client.id,
      };
    });
  }, [
    zendaClients,
    sprints,
    contentList,
    scriptsList,
    nowMs,
    rpgState.manualHoursOverride,
    rpgState.clientLastPublishedMap,
    rpgState.history,
    healedClientFlashId,
  ]);

  // Mantiene sincronizado el mapa clientsHp en Firestore (zenda_system/rpg_state) con el HP real de las 4 tarjetas
  useEffect(() => {
    if (!accountHealthCards.length) return;
    const currentMap = rpgState.clientsHp || rpgState.clientHpMap || {};
    let hasDiff = false;
    const nextHpMap = { ...currentMap };
    for (const card of accountHealthCards) {
      if (currentMap[card.client.id] !== card.hpPercent) {
        nextHpMap[card.client.id] = card.hpPercent;
        hasDiff = true;
      }
    }
    if (hasDiff) {
      updateRpgState({
        clientsHp: nextHpMap,
        clientHpMap: nextHpMap,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountHealthCards]);

  // 2. QUESTS DEL DÍA (Máximo 3 misiones visibles por jugador: Kevin vs Marco)
  const priorityWeight = (priority) => {
    switch (priority) {
      case 'Urgente':
        return 1;
      case 'Alta':
        return 2;
      case 'Media':
        return 3;
      default:
        return 4;
    }
  };

  const isCompletedToday = (task) => {
    if (getQuestRpgStatus(task) !== 'Completado') return false;
    if (task.completedDate === todayDateStr) return true;
    if (task.publishedAt && String(task.publishedAt).startsWith(todayDateStr)) return true;
    if (task.updatedAt && String(task.updatedAt).startsWith(todayDateStr)) return true;
    if (task.deadline === todayDateStr) return true;
    return false;
  };

  const buildAssigneeMissions = (targetAssignee) => {
    const mine = sprints.filter((s) => normalizeAssignee(s.assignee) === targetAssignee);
    const completedTodayList = mine.filter((s) => isCompletedToday(s));

    const pendingList = mine
      .filter((s) => getQuestRpgStatus(s) !== 'Completado')
      .sort((a, b) => {
        const aInCourse = getQuestRpgStatus(a) === 'En Curso' ? 0 : 1;
        const bInCourse = getQuestRpgStatus(b) === 'En Curso' ? 0 : 1;
        if (aInCourse !== bInCourse) return aInCourse - bInCourse;

        const aToday = a.isTodayPinned || a.deadline <= todayDateStr ? 0 : 1;
        const bToday = b.isTodayPinned || b.deadline <= todayDateStr ? 0 : 1;
        if (aToday !== bToday) return aToday - bToday;

        const pa = priorityWeight(a.priority);
        const pb = priorityWeight(b.priority);
        if (pa !== pb) return pa - pb;
        return String(a.deadline || '').localeCompare(String(b.deadline || ''));
      });

    const top3 = [...pendingList, ...completedTodayList].slice(0, 3);
    const top3Ids = new Set(top3.map((t) => t.id));
    const remainingBacklog = mine.filter((t) => !top3Ids.has(t.id));

    return {
      top3,
      top3Ids,
      completedTodayCount: completedTodayList.length,
      pendingCount: pendingList.length,
      remainingBacklog,
    };
  };

  const kevinMissionsData = useMemo(
    () => buildAssigneeMissions('Kevin'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sprints, todayDateStr],
  );

  const marcoMissionsData = useMemo(
    () => buildAssigneeMissions('Marco'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sprints, todayDateStr],
  );

  const activeTop3IdsSet = useMemo(() => {
    const s = new Set();
    kevinMissionsData.top3.forEach((t) => s.add(t.id));
    marcoMissionsData.top3.forEach((t) => s.add(t.id));
    return s;
  }, [kevinMissionsData.top3, marcoMissionsData.top3]);

  // 3. PERFILES DE JUGADOR & MOTOR COMPETITIVO 1v1 (0 XP Base Oficial)
  const currentLocalHour = new Date(nowMs).getHours();
  const isMorningDespegueWindow = currentLocalHour === 7;

  const kevinTotalXP = Math.max(0, Number(rpgState.kevinBaseXP ?? rpgState.xp?.Kevin ?? 0));
  const kevinLevel = Math.floor(kevinTotalXP / XP_PER_LEVEL) + 1;
  const kevinLevelXP = kevinTotalXP % XP_PER_LEVEL;
  const kevinLevelPercent = Math.round((kevinLevelXP / XP_PER_LEVEL) * 100);
  const kevinCheckedInToday = rpgState.kevinLastCheckIn === todayDateStr;

  const marcoTotalXP = Math.max(0, Number(rpgState.marcoBaseXP ?? rpgState.xp?.Marco ?? 0));
  const marcoLevel = Math.floor(marcoTotalXP / XP_PER_LEVEL) + 1;
  const marcoLevelXP = marcoTotalXP % XP_PER_LEVEL;
  const marcoLevelPercent = Math.round((marcoLevelXP / XP_PER_LEVEL) * 100);
  const marcoCheckedInToday = rpgState.marcoLastCheckIn === todayDateStr;

  // Duelo 1v1 Semanal (Kevin vs Marco) + Psicología Competitiva de Brecha
  const totalDuelXP = kevinTotalXP + marcoTotalXP;
  const kevinDuelPercent = totalDuelXP > 0 ? Math.round((kevinTotalXP / totalDuelXP) * 100) : 50;
  const marcoDuelPercent = totalDuelXP > 0 ? 100 - kevinDuelPercent : 50;
  const duelLeader =
    kevinTotalXP > marcoTotalXP
      ? 'Kevin'
      : marcoTotalXP > kevinTotalXP
      ? 'Marco'
      : null;
  const duelDiffXP = Math.abs(kevinTotalXP - marcoTotalXP);
  const duelGapPsychologyMessage =
    duelLeader === 'Kevin'
      ? `Marco está a +${duelDiffXP} XP de quitarle la corona a Kevin`
      : duelLeader === 'Marco'
      ? `Kevin está a +${duelDiffXP} XP de quitarle la corona a Marco`
      : 'Empate en vivo · La siguiente misión define quién toma la corona';

  const recentActivityLog = useMemo(
    () => (Array.isArray(rpgState.activityLog) ? rpgState.activityLog.slice(0, 5) : []),
    [rpgState.activityLog],
  );

  // Bóveda / Historial Completo de Victorias & Publicaciones (zenda_system/rpg_state.history)
  const filteredVictoryHistory = useMemo(() => {
    const rawHistory = Array.isArray(rpgState.history) ? [...rpgState.history] : [];
    const seenQuestIds = new Set(rawHistory.map((h) => h.questId).filter(Boolean));

    // Incluir también cualquier misión ya completada en zenda_sprints que no estuviera en history
    for (const sp of sprints) {
      if (getQuestRpgStatus(sp) === 'Completado' && !seenQuestIds.has(sp.id)) {
        const diff = getQuestDifficultyInfo(sp);
        rawHistory.push({
          id: `hist-sp-${sp.id}`,
          questId: sp.id,
          type: diff.id === 'Reel Publicado' ? 'reel' : 'quest',
          player: normalizeAssignee(sp.assignee),
          account: sp.client || 'Zenda Agency',
          title: sp.title,
          link: sp.link || '',
          xp: diff.xp,
          date: sp.completedDate || sp.deadline || todayDateStr,
          time: sp.publishedAt ? formatExactTime(sp.publishedAt) : '',
          createdAt: sp.publishedAt || sp.updatedAt || sp.createdAt || '',
        });
      }
    }

    return rawHistory.filter((item) => {
      const matchesPlayer =
        historyPlayerFilter === 'all' || normalizeAssignee(item.player) === historyPlayerFilter;
      const matchesType =
        historyTypeFilter === 'all' ||
        (historyTypeFilter === 'reel' && item.type === 'reel') ||
        (historyTypeFilter === 'quest' && item.type !== 'reel');
      return matchesPlayer && matchesType;
    });
  }, [rpgState.history, sprints, historyPlayerFilter, historyTypeFilter, todayDateStr]);

  // 4. META SEMANAL (X / 12 Reels Publicados esta semana - Arranca en 0/12 real)
  const weeklyPublishedCount = useMemo(() => {
    const sumByAccounts = accountHealthCards.reduce(
      (acc, card) => acc + card.publishedPieceCount,
      0,
    );
    const baseCount = Math.max(sumByAccounts, Number(rpgState.bossChestReelsCount || 0));
    return Math.max(
      0,
      Math.min(12, baseCount + Number(rpgState.manualBossReelsBonus || 0)),
    );
  }, [accountHealthCards, rpgState.bossChestReelsCount, rpgState.manualBossReelsBonus]);

  const weeklyGoalPercent = Math.min(
    100,
    Math.round((weeklyPublishedCount / WEEKLY_AGENCY_GOAL) * 100),
  );
  const isBossChestUnlocked = weeklyPublishedCount >= WEEKLY_AGENCY_GOAL;

  // 5. BACKLOG POR CUENTA Y CATEGORÍAS (Calcula dinámicamente TODAS las tareas con estado != Completado)
  const backlogByClient = useMemo(() => {
    const customCats = Array.isArray(rpgState.customCategories) ? rpgState.customCategories : [];
    const categoryEntries = [
      ...zendaClients.map((c) => ({ id: c.id, name: c.name, leadOwner: c.leadOwner || 'Kevin' })),
      ...PERSONAL_QUEST_CATEGORIES.map((catName, idx) => ({
        id: `personal-cat-${idx}`,
        name: catName,
        leadOwner: 'Kevin',
      })),
      ...customCats.map((catName, idx) => ({
        id: `custom-cat-${idx}`,
        name: catName,
        leadOwner: 'Kevin',
      })),
    ];

    return categoryEntries.map((client) => {
      const accountKey = normalizeAccountKey(client.name);
      const allClientTasks = sprints.filter(
        (s) => normalizeAccountKey(s.client) === accountKey,
      );

      const filteredTasks = allClientTasks.filter((task) => {
        const assignee = normalizeAssignee(task.assignee);
        const matchesAssignee =
          backlogAssigneeFilter === 'all' || assignee === backlogAssigneeFilter;
        const matchesQuery =
          !backlogSearchQuery.trim() ||
          String(task.title || '')
            .toLowerCase()
            .includes(backlogSearchQuery.toLowerCase());
        return matchesAssignee && matchesQuery;
      });

      // Cuenta dinámicamente todas las tareas cuyo estado es distinto a 'Completado'
      const pendingTasksForAccount = filteredTasks.filter(
        (t) => getQuestRpgStatus(t) !== 'Completado',
      );

      return {
        client,
        accountKey,
        allClientTasks,
        filteredTasks,
        pendingBacklogCount: pendingTasksForAccount.length,
      };
    });
  }, [
    zendaClients,
    sprints,
    rpgState.customCategories,
    backlogAssigneeFilter,
    backlogSearchQuery,
  ]);

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
      badge: sprints.filter((s) => !s.completed).length,
    },
    {
      id: 'clients',
      label: 'Clientes 360°',
      icon: Building2,
      badge: zendaClients.length,
    },
    {
      id: 'pipeline',
      label: 'Pipeline de Contenido',
      icon: Film,
      badge: contentList.length,
    },
    {
      id: 'calendar',
      label: 'Calendario & Rodajes',
      icon: CalendarIcon,
      badge: calendarEvents.filter((e) => !e.completed).length,
    },
    {
      id: 'finances',
      label: 'Finanzas & Caja',
      icon: Wallet,
      badge: finances.length,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] antialiased selection:bg-[#0066C5] selection:text-white">
      {/* Confeti limpio al cerrar las 3 Quests del Día o Meta 12/12 */}
      <AnimatePresence>
        {celebrationBurst && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {CONFETTI_PARTICLES.map((p) => (
              <motion.span
                key={`confetti-${p.id}`}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: Math.cos(p.angle) * p.distance * 1.9,
                  y: Math.sin(p.angle) * p.distance * 1.6 - 40,
                  scale: [0.6, 1.35, 0.8],
                  rotate: p.id * 45 + 180,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.35, ease: 'easeOut' }}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
                className="absolute rounded-sm"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Popup flotante de +XP ganado en vivo */}
      <AnimatePresence>
        {floatingXpPopup && (
          <motion.div
            key={`xp-pop-${floatingXpPopup.id}`}
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={SPRING_TRANSITION}
            className="pointer-events-none fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#0066C5]/30 bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#0066C5] shadow-md"
          >
            <Zap className="h-3.5 w-3.5 text-[#0066C5]" />
            <span>
              [{floatingXpPopup.player}] {floatingXpPopup.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast flotante en esquina inferior derecha */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="zenda-toast"
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={SPRING_TRANSITION}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#0F172A] px-4 py-2.5 font-mono text-xs font-medium text-white shadow-lg"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981]/20 text-[#10B981]">
              <Check className="h-3 w-3" />
            </span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* SIDEBAR MINIMALISTA (#09090B)                                        */}
      {/* ==================================================================== */}
      <aside className="hidden w-60 flex-col border-r border-[#27272A] bg-[#09090B] p-4 md:flex select-none">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src="/isotipo-zenda.png" alt="Zenda" className="h-5 w-auto object-contain brightness-110" />
            <span className="text-base font-bold tracking-tight text-white">zenda</span>
            <span className="rounded bg-[#0066C5] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
              OS
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
              rpgSyncOnline && isFirebaseConfigured
                ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                rpgSyncOnline && isFirebaseConfigured ? 'bg-[#10B981]' : 'bg-zinc-400'
              }`}
            />
            {rpgSyncOnline && isFirebaseConfigured ? 'SYNC LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Navegación Lateral con layoutId */}
        <nav className="mt-6 flex-1 space-y-1" aria-label="Secciones de Zenda OS">
          {sidebarNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                transition={SPRING_TRANSITION}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
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
                <div className="relative z-10 flex items-center gap-2.5">
                  <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#A1A1AA]'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="relative z-10 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                  {item.badge}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Acceso rápido a las 4 cuentas oficiales con indicador de HP sincronizado con Firestore */}
        <div className="mb-4 border-t border-[#27272A] pt-4">
          <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Cuentas ({accountHealthCards.length})
          </p>
          <div className="mt-2 space-y-1">
            {accountHealthCards.map(({ client, hpPercent }) => {
              const syncedHp =
                typeof rpgState.clientsHp?.[client.id] === 'number'
                  ? rpgState.clientsHp[client.id]
                  : hpPercent;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleOpenClient360(client.id, 'metrics')}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    activeTab === 'clients' && selectedClient360Id === client.id
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{client.name}</span>
                  <span
                    className={`font-mono text-[10px] font-semibold ${
                      syncedHp < 30
                        ? 'text-[#EF4444]'
                        : syncedHp > 60
                        ? 'text-[#10B981]'
                        : 'text-zinc-300'
                    }`}
                  >
                    {syncedHp}% HP
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="space-y-2 border-t border-[#27272A] pt-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-white/5 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              wearezenda.com
            </span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-center justify-between rounded-xl border border-[#27272A] bg-zinc-900/60 p-2.5 text-xs">
            <div className="truncate">
              <p className="font-semibold text-white">{currentUser?.displayName || 'Kevin & Marco'}</p>
              <p className="truncate font-mono text-[10px] text-[#A1A1AA]">{currentUser?.email || 'admin@wearezenda.com'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="rounded-lg p-1.5 text-[#A1A1AA] transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* CONTENIDO PRINCIPAL + HEADER MINIMALISTA (#FFFFFF / #E2E8F0)         */}
      {/* ==================================================================== */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-[#0F172A] sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Izquierda: Título + SYNC LIVE */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="rounded-lg border border-[#E2E8F0] bg-white p-2 text-[#0F172A] md:hidden"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-sm font-bold tracking-tight text-[#0F172A] sm:text-base">
                    {activeTab === 'command' && 'Centro de Control'}
                    {activeTab === 'clients' &&
                      (selectedClient360
                        ? `Clientes 360° · ${selectedClient360.name}`
                        : 'Clientes 360°')}
                    {activeTab === 'pipeline' && 'Pipeline de Contenido'}
                    {activeTab === 'calendar' && 'Calendario & Rodajes'}
                    {activeTab === 'finances' && 'Finanzas & Caja'}
                  </h1>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                      rpgSyncOnline && isFirebaseConfigured
                        ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-500'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        rpgSyncOnline && isFirebaseConfigured ? 'bg-[#10B981]' : 'bg-slate-400'
                      }`}
                    />
                    {rpgSyncOnline && isFirebaseConfigured ? 'SYNC LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSprintModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0066C5] px-2.5 py-1.5 text-xs font-semibold text-white lg:hidden"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Quest</span>
              </button>
            </div>

            {/* Centro: Meta Semanal 12/12 compacta */}
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 lg:max-w-xl">
              <Trophy
                className={`h-4 w-4 shrink-0 ${
                  isBossChestUnlocked ? 'text-[#10B981]' : 'text-[#0066C5]'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-[#0F172A]">Meta Semanal:</span>
                    <input
                      type="text"
                      value={rpgState.weeklyRewardText}
                      onChange={(e) =>
                        updateRpgState({ weeklyRewardText: e.target.value })
                      }
                      aria-label="Recompensa semanal"
                      className="w-40 sm:w-52 truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium text-slate-600 outline-none hover:border-[#E2E8F0] focus:border-[#0066C5] focus:bg-white"
                    />
                  </div>
                  <span
                    className={`shrink-0 font-mono text-xs font-bold ${
                      isBossChestUnlocked ? 'text-[#10B981]' : 'text-[#0066C5]'
                    }`}
                  >
                    {weeklyPublishedCount}/{WEEKLY_AGENCY_GOAL}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyGoalPercent}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isBossChestUnlocked ? 'bg-[#10B981]' : 'bg-[#0066C5]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Derecha: Acciones discretas + Alertas + Configuración */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEnableBrowserAlerts}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  notificationPermission === 'granted'
                    ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                    : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0066C5] hover:text-[#0066C5]'
                }`}
                title="Notificaciones Web Push 15 min antes de eventos y 7:25 AM Despegue"
              >
                <span>
                  {notificationPermission === 'granted'
                    ? '🔔 Alertas Activas'
                    : '🔔 Activar Alertas'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSprintModalOpen(true)}
                className="hidden items-center gap-1.5 rounded-lg bg-[#0066C5] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0052A3] lg:inline-flex"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nueva Quest</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsPanelOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  settingsPanelOpen
                    ? 'border-[#0066C5] bg-[#0066C5]/10 text-[#0066C5]'
                    : 'border-[#E2E8F0] bg-white text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
                title="Configuración: Webhook URL, Sonido y Reiniciar Temporada a 0"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Configuración</span>
              </button>
            </div>
          </div>

          {/* Panel de Configuración Discreto (Webhook n8n/WhatsApp, Reiniciar Temporada a 0, Sonido y Base) */}
          <AnimatePresence>
            {settingsPanelOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Webhook URL opcional (n8n / WhatsApp) */}
                  <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
                    <label className="shrink-0 font-mono text-[11px] font-semibold text-[#0F172A]">
                      Webhook URL (n8n / WhatsApp):
                    </label>
                    <div className="flex flex-1 gap-2">
                      <input
                        type="url"
                        value={rpgState.webhookUrl || ''}
                        onChange={(e) =>
                          updateRpgState({ webhookUrl: e.target.value })
                        }
                        placeholder="https://n8n.wearezenda.com/webhook/calendario..."
                        className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 font-mono text-xs text-[#0F172A] placeholder-slate-400 outline-none focus:border-[#0066C5]"
                      />
                      {rpgState.webhookUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            sendCalendarWebhookPost({
                              title: 'Prueba de Alerta Zenda OS',
                              time: formatExactTime(new Date()),
                              assignedTo: 'Kevin & Marco',
                              trigger: 'manual_test',
                            });
                            showToast('POST JSON enviado al Webhook configurado');
                          }}
                          className="shrink-0 rounded-lg border border-[#0066C5] bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#0066C5] hover:bg-[#0066C5] hover:text-white"
                        >
                          Probar POST
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Controles de Temporada y Sistema */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateRpgState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                      }
                      className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 font-mono text-[11px] font-medium text-slate-600 hover:text-[#0F172A]"
                    >
                      {rpgState.soundEnabled ? 'SFX: ON' : 'SFX: OFF'}
                    </button>

                    <button
                      type="button"
                      disabled={isResettingSeason}
                      onClick={handleResetSeasonToZero}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 font-mono text-[11px] font-semibold text-[#0F172A] transition-colors hover:border-[#0066C5] hover:text-[#0066C5] disabled:opacity-50"
                      title="Reinicia XP a 0, LVL 1, Racha 0d y 0/12 Reels en Firestore"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>
                        {isResettingSeason
                          ? 'Reiniciando...'
                          : 'Reiniciar Temporada a 0'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 font-mono text-[11px] font-medium text-slate-500 hover:border-[#EF4444]/40 hover:text-[#EF4444]"
                      title="Purgar colecciones de Firestore"
                    >
                      <span>Purgar Base</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-[#E2E8F0] bg-white p-3 text-[#0F172A] md:hidden"
            >
              <div className="space-y-1">
                {sidebarNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${
                      activeTab === item.id
                        ? 'bg-[#0066C5]/10 text-[#0066C5]'
                        : 'text-slate-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 font-mono text-[10px]">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-10">
          <AnimatePresence mode="wait">
            {/* ================================================================ */}
            {/* VISTA PRINCIPAL: DASHBOARD RPG MINIMALISTA                       */}
            {/* ================================================================ */}
            {activeTab === 'command' && (
              <motion.div
                key="tab-command-rpg"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* ============================================================ */}
                {/* 1. FILA SUPERIOR: 4 CUENTAS COMPACTAS                        */}
                {/* (Nombre, barra fina de HP %, horas sin publicar, Métricas y + Publicar Anti-Trampa) */}
                {/* ============================================================ */}
                <section aria-label="Estado de Cuentas">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {accountHealthCards.map((item) => {
                      const {
                        client,
                        hoursSincePublish,
                        hpPercent,
                        statusKey,
                        isHealedFlashing,
                      } = item;

                      const isOptimal = statusKey === 'green';
                      const isCritical = statusKey === 'red';
                      const socialMetrics = getClientSocialMetrics(client);
                      const totalFollowers =
                        socialMetrics.tiktokFollowers +
                        socialMetrics.instagramFollowers +
                        socialMetrics.facebookFollowers;

                      const barColor = isOptimal
                        ? 'bg-[#10B981]'
                        : isCritical
                        ? 'bg-[#EF4444]'
                        : 'bg-[#0066C5]';

                      return (
                        <div
                          key={client.id}
                          className={`flex flex-col justify-between rounded-xl border bg-[#FFFFFF] p-3.5 shadow-sm transition-colors ${
                            isHealedFlashing
                              ? 'border-[#10B981]'
                              : 'border-[#E2E8F0]'
                          }`}
                        >
                          {/* Fila 1: Nombre + HP (%) */}
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenClient360(client.id, 'metrics')}
                              className="truncate text-left text-sm font-bold text-[#0F172A] hover:text-[#0066C5]"
                            >
                              {client.name}
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCritical && (
                                <span className="rounded bg-[#EF4444]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#EF4444]">
                                  Alerta
                                </span>
                              )}
                              <span
                                className={`font-mono text-xs font-bold ${
                                  isCritical
                                    ? 'text-[#EF4444]'
                                    : isOptimal
                                    ? 'text-[#10B981]'
                                    : 'text-[#0F172A]'
                                }`}
                              >
                                {hpPercent}% HP
                              </span>
                            </div>
                          </div>

                          {/* Fila 2: Barra fina de HP */}
                          <div className="my-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${hpPercent}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>

                          {/* Fila 3: Horas sin publicar + Ver Perfil/Métricas + Botón + Publicar Anti-Trampa */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex flex-col">
                              <span className="font-mono text-[11px] text-slate-500">
                                {hoursSincePublish}h sin publicar
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenMetricsModal(client)}
                                className="text-left font-mono text-[10px] font-semibold text-[#0066C5] hover:underline"
                              >
                                Ver Perfil / Métricas
                                {totalFollowers > 0 ? ` (${totalFollowers.toLocaleString()} seg)` : ''}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenPublishModal(client)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#0066C5] hover:bg-[#0066C5] hover:text-white"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Publicar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ============================================================ */}
                {/* 2. MOTOR COMPETITIVO 1v1 (DUELO SEMANAL KEVIN VS MARCO)      */}
                {/* Barra comparativa de XP, 👑 Líder Actual, Psicología y Log   */}
                {/* ============================================================ */}
                <section
                  aria-label="Duelo Semanal 1v1 Kevin vs Marco y Log de Actividad"
                  className="rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                    {/* Izquierda: Marcador 1v1 + Barra Comparativa de XP + Psicología */}
                    <div className="space-y-2.5 lg:col-span-7 lg:border-r lg:border-[#E2E8F0] lg:pr-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                            Duelo Semanal 1v1
                          </span>
                          {duelLeader ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#10B981]">
                              <span>👑 Líder Actual: {duelLeader} (+{duelDiffXP} XP)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                              <span>Empate ({kevinTotalXP} - {marcoTotalXP} XP)</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPenaltyModalOpen(true)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#EF4444] transition-colors hover:bg-[#EF4444] hover:text-white"
                            title="Registrar penalización de -100 XP por incumplimiento o quedarse dormido"
                          >
                            <span>⚠️ Penalización (-100 XP)</span>
                          </button>

                          <button
                            type="button"
                            disabled={isResettingSeason}
                            onClick={handleResetSeasonToZero}
                            className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 transition-colors hover:border-[#0066C5] hover:text-[#0066C5]"
                            title="Reiniciar temporada competitiva a 0 XP"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            <span>Reiniciar a 0</span>
                          </button>
                        </div>
                      </div>

                      {/* Marcadores Jugadores */}
                      <div className="flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#0066C5]" />
                          <span className="font-bold text-[#0F172A]">Kevin</span>
                          <span className="font-semibold text-[#0066C5]">
                            {kevinTotalXP.toLocaleString()} XP
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (LVL {kevinLevel} · {kevinDuelPercent}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            ({marcoDuelPercent}% · LVL {marcoLevel})
                          </span>
                          <span className="font-semibold text-[#0F172A]">
                            {marcoTotalXP.toLocaleString()} XP
                          </span>
                          <span className="font-bold text-[#0F172A]">Marco</span>
                          <span className="h-2 w-2 rounded-full bg-[#0F172A]" />
                        </div>
                      </div>

                      {/* Barra Comparativa 1v1 en tiempo real */}
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
                        <motion.div
                          initial={{ width: '50%' }}
                          animate={{ width: `${kevinDuelPercent}%` }}
                          transition={{ duration: 0.45, ease: 'easeOut' }}
                          className="h-full bg-[#0066C5]"
                          title={`Kevin: ${kevinTotalXP} XP (${kevinDuelPercent}%)`}
                        />
                        <motion.div
                          initial={{ width: '50%' }}
                          animate={{ width: `${marcoDuelPercent}%` }}
                          transition={{ duration: 0.45, ease: 'easeOut' }}
                          className="h-full bg-[#0F172A]"
                          title={`Marco: ${marcoTotalXP} XP (${marcoDuelPercent}%)`}
                        />
                      </div>

                      {/* Mensaje Psicológico de Brecha en Tiempo Real */}
                      <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5">
                        <span className="font-mono text-[11px] font-semibold text-[#0F172A]">
                          ⚡ {duelGapPsychologyMessage}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBottomSectionTab('history')}
                          className="shrink-0 font-mono text-[10px] font-bold text-[#0066C5] hover:underline"
                        >
                          Ver Historial ({filteredVictoryHistory.length}) →
                        </button>
                      </div>
                    </div>

                    {/* Derecha: Log de Actividad en Vivo (Últimas 5 acciones completadas con hora exacta) */}
                    <div className="lg:col-span-5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Log de Actividad en Vivo (Últimas 5)
                        </span>
                        <span className="font-mono text-[10px] text-[#10B981]">
                          ● Tiempo Real
                        </span>
                      </div>

                      {recentActivityLog.length === 0 ? (
                        <p className="mt-2 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-center font-mono text-[11px] text-slate-400">
                          Temporada en 0 XP. Completa la primera Quest para inaugurar el marcador.
                        </p>
                      ) : (
                        <div className="mt-1.5 space-y-1">
                          {recentActivityLog.map((entry) => {
                            const isPenalty = Number(entry.xp) < 0;
                            return (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="shrink-0 font-mono text-[10px] text-slate-400">
                                    {entry.time}
                                  </span>
                                  <span
                                    className={`shrink-0 font-mono font-bold ${
                                      entry.player === 'Kevin'
                                        ? 'text-[#0066C5]'
                                        : 'text-[#0F172A]'
                                    }`}
                                  >
                                    {entry.player}
                                  </span>
                                  <span className="truncate font-medium text-[#0F172A]">
                                    {entry.action}
                                  </span>
                                  {entry.category && (
                                    <span className="hidden shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500 ring-1 ring-[#E2E8F0] sm:inline">
                                      {entry.category}
                                    </span>
                                  )}
                                  {entry.link && (
                                    <a
                                      href={entry.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="shrink-0 text-[#0066C5] hover:underline"
                                      title="Abrir Reel publicado"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                <span
                                  className={`shrink-0 font-mono text-[10px] font-bold ${
                                    isPenalty ? 'text-[#EF4444]' : 'text-[#10B981]'
                                  }`}
                                >
                                  {isPenalty ? `${entry.xp} XP` : `+${entry.xp} XP`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* ============================================================ */}
                {/* 3. PERFILES (KEVIN VS MARCO) & CREADOR DE MISIONES XP LIBRE  */}
                {/* ============================================================ */}
                <section aria-label="Jugadores y Quests del Día">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {[
                      {
                        player: 'Kevin',
                        classTitle: 'Kevin · Arquitecto IA',
                        avatarText: 'KV',
                        level: kevinLevel,
                        totalXP: kevinTotalXP,
                        levelXP: kevinLevelXP,
                        levelPercent: kevinLevelPercent,
                        earlyStreak: Number(rpgState.kevinEarlyStreak || 0),
                        checkedInToday: kevinCheckedInToday,
                        missionsData: kevinMissionsData,
                        quickForm: quickMissionKevin,
                        setQuickForm: setQuickMissionKevin,
                      },
                      {
                        player: 'Marco',
                        classTitle: 'Marco · Director de Campo',
                        avatarText: 'MC',
                        level: marcoLevel,
                        totalXP: marcoTotalXP,
                        levelXP: marcoLevelXP,
                        levelPercent: marcoLevelPercent,
                        earlyStreak: Number(rpgState.marcoEarlyStreak || 0),
                        checkedInToday: marcoCheckedInToday,
                        missionsData: marcoMissionsData,
                        quickForm: quickMissionMarco,
                        setQuickForm: setQuickMissionMarco,
                      },
                    ].map((hunter) => {
                      const doneToday = Math.min(3, hunter.missionsData.completedTodayCount);
                      const all3Cleared = doneToday >= 3;

                      return (
                        <div
                          key={hunter.player}
                          className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 sm:p-5 shadow-sm"
                        >
                          <div>
                            {/* Perfil compacto */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066C5] font-mono text-sm font-bold text-white">
                                  {hunter.avatarText}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#0F172A]">
                                      {hunter.classTitle}
                                    </h2>
                                    <span className="rounded-md bg-[#0066C5]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#0066C5]">
                                      LVL {hunter.level}
                                    </span>
                                  </div>
                                  <p className="font-mono text-xs text-slate-500">
                                    {hunter.totalXP.toLocaleString()} XP · Racha 7:30 AM:{' '}
                                    <strong className="text-[#0F172A]">{hunter.earlyStreak}d</strong>
                                  </p>
                                </div>
                              </div>

                              {/* Botón 7:30 AM Despegue (habilitado entre 7:00 AM y 8:00 AM) */}
                              <button
                                type="button"
                                disabled={!isMorningDespegueWindow || hunter.checkedInToday}
                                onClick={() => handleMorningCheckIn(hunter.player)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                                  hunter.checkedInToday
                                    ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                                    : isMorningDespegueWindow
                                    ? 'border-[#0066C5] bg-[#0066C5] text-white hover:bg-[#0052A3]'
                                    : 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-slate-400'
                                }`}
                                title="Habilitado entre 7:00 AM y 8:00 AM"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  {hunter.checkedInToday
                                    ? '7:30 AM Despegue ✓'
                                    : '7:30 AM Despegue (+50 XP)'}
                                </span>
                              </button>
                            </div>

                            {/* Barra fina de XP */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                                <span>Progreso LVL {hunter.level + 1}</span>
                                <span className="font-semibold text-[#0F172A]">
                                  {hunter.levelXP} / {XP_PER_LEVEL} XP
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${hunter.levelPercent}%` }}
                                  transition={{ duration: 0.45, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-[#0066C5]"
                                />
                              </div>
                            </div>

                            {/* Cabecera Quests del Día */}
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Quests de Hoy ({hunter.missionsData.top3.length}/3)
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                                  all3Cleared
                                    ? 'bg-[#10B981]/10 text-[#10B981]'
                                    : 'bg-[#F8FAFC] text-slate-600'
                                }`}
                              >
                                {doneToday}/3 completadas
                              </span>
                            </div>

                            {/* Creador de Misiones Personalizadas con XP Libre (50, 100, 150, 250, 500 + input numérico) y Categorías */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!hunter.quickForm.title.trim()) return;
                                handleQuickCreateMissionInline({
                                  title: hunter.quickForm.title,
                                  client: hunter.quickForm.client,
                                  assignee: hunter.player,
                                  questDifficulty: hunter.quickForm.questDifficulty,
                                  customXp: hunter.quickForm.customXp,
                                  priority: 'Urgente',
                                  deadline: todayDateStr,
                                  isTodayPinned: true,
                                });
                                hunter.setQuickForm({ ...hunter.quickForm, title: '' });
                              }}
                              className="mt-2.5 flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
                            >
                              {/* Fila 1: Selector de Categoría + Botón Crear Categoría */}
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={hunter.quickForm.client}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '__create_new__') {
                                      setAddingCustomCategoryFor(hunter.player);
                                      return;
                                    }
                                    hunter.setQuickForm({
                                      ...hunter.quickForm,
                                      client: val,
                                      questDifficulty: getDefaultDifficultyForCategory(val),
                                    });
                                  }}
                                  className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#0066C5]"
                                >
                                  <optgroup label="Clientes Oficiales">
                                    {zendaClients.map((c) => (
                                      <option key={c.id} value={c.name}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Personal & Hábitos">
                                    {PERSONAL_QUEST_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </optgroup>
                                  {(rpgState.customCategories || []).length > 0 && (
                                    <optgroup label="Categorías Personalizadas">
                                      {(rpgState.customCategories || []).map((cat) => (
                                        <option key={cat} value={cat}>
                                          {cat}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  <option value="__create_new__">+ Crear nueva categoría...</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddingCustomCategoryFor(
                                      addingCustomCategoryFor === hunter.player
                                        ? null
                                        : hunter.player,
                                    )
                                  }
                                  className="shrink-0 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 font-mono text-[10px] font-semibold text-slate-600 hover:border-[#0066C5] hover:text-[#0066C5]"
                                  title="Crear nueva categoría"
                                >
                                  + Categoría
                                </button>
                              </div>

                              {/* Input inline si está creando una categoría nueva */}
                              {addingCustomCategoryFor === hunter.player && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-[#0066C5]/40 bg-white p-1.5">
                                  <input
                                    type="text"
                                    value={customCategoryDraft}
                                    onChange={(e) => setCustomCategoryDraft(e.target.value)}
                                    placeholder="Nombre de categoría (ej. Prospección B2B)..."
                                    className="flex-1 px-2 py-1 text-xs text-[#0F172A] outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCreateCustomCategory(hunter.player)}
                                    className="rounded-md bg-[#0066C5] px-2.5 py-1 font-mono text-[10px] font-bold text-white"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAddingCustomCategoryFor(null)}
                                    className="rounded-md px-1.5 py-1 text-xs text-slate-400 hover:text-slate-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}

                              {/* Fila 2: Botones rápidos de XP Libre (50, 100, 150, 250, 500 XP) + Input Numérico Editable */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="font-mono text-[10px] font-semibold text-slate-500">
                                    XP:
                                  </span>
                                  {QUICK_XP_PRESETS.map((xpPreset) => {
                                    const isSelectedXp =
                                      Number(hunter.quickForm.customXp) === xpPreset;
                                    return (
                                      <button
                                        key={xpPreset}
                                        type="button"
                                        onClick={() =>
                                          hunter.setQuickForm({
                                            ...hunter.quickForm,
                                            customXp: xpPreset,
                                          })
                                        }
                                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                                          isSelectedXp
                                            ? 'bg-[#0066C5] text-white'
                                            : 'border border-[#E2E8F0] bg-white text-slate-600 hover:border-[#0066C5] hover:text-[#0066C5]'
                                        }`}
                                      >
                                        +{xpPreset}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="10"
                                    max="5000"
                                    step="10"
                                    value={hunter.quickForm.customXp}
                                    onChange={(e) =>
                                      hunter.setQuickForm({
                                        ...hunter.quickForm,
                                        customXp: e.target.value,
                                      })
                                    }
                                    aria-label="XP Libre"
                                    className="w-16 rounded-md border border-[#E2E8F0] bg-white px-2 py-0.5 text-right font-mono text-xs font-bold text-[#0066C5] outline-none focus:border-[#0066C5]"
                                  />
                                  <span className="font-mono text-[10px] font-bold text-[#0066C5]">
                                    XP
                                  </span>
                                </div>
                              </div>

                              {/* Fila 3: Título de la misión + Botón Crear */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={hunter.quickForm.title}
                                  onChange={(e) =>
                                    hunter.setQuickForm({
                                      ...hunter.quickForm,
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder={`Título de la misión para ${hunter.player}...`}
                                  className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none focus:border-[#0066C5]"
                                />
                                <button
                                  type="submit"
                                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#0066C5] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0052A3]"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Crear</span>
                                </button>
                              </div>
                            </form>

                            {/* Lista de máximo 3 Quests diarias */}
                            <div className="mt-3 space-y-2.5">
                              {hunter.missionsData.top3.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center text-xs text-slate-400">
                                  Sin quests activas para hoy.
                                </div>
                              ) : (
                                hunter.missionsData.top3.map((quest) => {
                                  const rpgStatus = getQuestRpgStatus(quest);
                                  const diffInfo = getQuestDifficultyInfo(quest);
                                  const isPending = rpgStatus === 'Pendiente';
                                  const isInCourse = rpgStatus === 'En Curso';
                                  const isCompleted = rpgStatus === 'Completado';

                                  return (
                                    <div
                                      key={quest.id}
                                      className={`rounded-xl border p-3 transition-colors ${
                                        isCompleted
                                          ? 'border-[#10B981]/30 bg-[#10B981]/[0.03]'
                                          : isInCourse
                                          ? 'border-[#0066C5]/40 bg-[#0066C5]/[0.03]'
                                          : 'border-[#E2E8F0] bg-white'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="rounded-md bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-semibold text-[#0F172A] ring-1 ring-[#E2E8F0]">
                                            {quest.client || 'Zenda Agency'}
                                          </span>

                                          {/* Selector rápido de XP libre en la tarjeta */}
                                          <div className="inline-flex items-center gap-1 rounded-md border border-[#0066C5]/30 bg-[#0066C5]/5 px-1.5 py-0.5">
                                            <span className="font-mono text-[10px] font-bold text-[#0066C5]">
                                              +
                                            </span>
                                            <input
                                              type="number"
                                              min="10"
                                              max="5000"
                                              step="10"
                                              defaultValue={diffInfo.xp}
                                              key={`${quest.id}-${diffInfo.xp}`}
                                              onBlur={(e) => {
                                                const nextVal = Number(e.target.value);
                                                if (nextVal > 0 && nextVal !== diffInfo.xp) {
                                                  handleChangeQuestCustomXp(quest, nextVal);
                                                }
                                              }}
                                              className="w-11 bg-transparent font-mono text-[10px] font-bold text-[#0066C5] outline-none"
                                              title="Editar XP libre de esta misión"
                                            />
                                            <span className="font-mono text-[10px] font-bold text-[#0066C5]">
                                              XP
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleSwitchMissionAssignee(quest)}
                                            className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 hover:text-[#0F172A]"
                                            title="Cambiar responsable"
                                          >
                                            @{normalizeAssignee(quest.assignee)}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSprint(quest.id)}
                                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#EF4444]"
                                            title="Eliminar"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <p
                                        className={`mt-2 text-sm font-semibold ${
                                          isCompleted
                                            ? 'line-through text-slate-400'
                                            : 'text-[#0F172A]'
                                        }`}
                                      >
                                        {quest.title}
                                      </p>

                                      <div className="mt-2.5 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                          {QUEST_STATES.map((st) => {
                                            const active = rpgStatus === st;
                                            return (
                                              <button
                                                key={st}
                                                type="button"
                                                onClick={() =>
                                                  handleAdvanceQuestRpgState(quest, st)
                                                }
                                                className={`rounded-md px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${
                                                  active
                                                    ? st === 'Completado'
                                                      ? 'bg-[#10B981] text-white'
                                                      : 'bg-[#0066C5] text-white'
                                                    : 'bg-[#F8FAFC] text-slate-500 hover:text-[#0F172A]'
                                                }`}
                                              >
                                                {st}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleAdvanceQuestRpgState(quest)}
                                          className={`rounded-lg px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                                            isPending
                                              ? 'border border-[#0066C5] text-[#0066C5] hover:bg-[#0066C5] hover:text-white'
                                              : isInCourse
                                              ? 'bg-[#0066C5] text-white hover:bg-[#0052A3]'
                                              : 'bg-[#10B981]/15 text-[#10B981]'
                                          }`}
                                        >
                                          {isPending
                                            ? 'Iniciar →'
                                            : isInCourse
                                            ? `Completar (+${diffInfo.xp} XP)`
                                            : 'Completado ✓'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ============================================================ */}
                {/* 4. SECCIÓN INFERIOR CON PESTAÑAS CLARAS:                     */}
                {/*    Misiones Activas | Historial de Victorias & Publicaciones */}
                {/* ============================================================ */}
                <section
                  aria-label="Misiones Activas e Historial de Victorias"
                  className="rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-3.5 sm:flex-row sm:items-center sm:justify-between">
                    {/* Pestañas: Misiones Activas | Historial de Victorias & Publicaciones */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBottomSectionTab('active')}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                          bottomSectionTab === 'active'
                            ? 'bg-[#0066C5] text-white shadow-sm'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        <Filter className="h-3.5 w-3.5" />
                        <span>Misiones Activas (Backlog por Cuenta)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBottomSectionTab('history')}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                          bottomSectionTab === 'history'
                            ? 'bg-[#0066C5] text-white shadow-sm'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span>Historial de Victorias &amp; Publicaciones</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            bottomSectionTab === 'history'
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-slate-600 ring-1 ring-[#E2E8F0]'
                          }`}
                        >
                          {filteredVictoryHistory.length}
                        </span>
                      </button>
                    </div>

                    {/* Filtros contextuales según la pestaña activa */}
                    {bottomSectionTab === 'active' ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={backlogSearchQuery}
                            onChange={(e) => setBacklogSearchQuery(e.target.value)}
                            placeholder="Buscar tarea..."
                            className="w-36 sm:w-44 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1 pl-8 pr-2.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none focus:border-[#0066C5] focus:bg-white"
                          />
                        </div>

                        <div className="flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
                          {['all', 'Kevin', 'Marco'].map((who) => (
                            <button
                              key={who}
                              type="button"
                              onClick={() => setBacklogAssigneeFilter(who)}
                              className={`rounded-md px-2.5 py-0.5 font-medium transition-colors ${
                                backlogAssigneeFilter === who
                                  ? 'bg-[#0066C5] text-white'
                                  : 'text-slate-600 hover:text-[#0F172A]'
                              }`}
                            >
                              {who === 'all' ? 'Todos' : who}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Filtro Jugador */}
                        <div className="flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
                          {[
                            { id: 'all', label: 'Todos' },
                            { id: 'Kevin', label: 'Kevin' },
                            { id: 'Marco', label: 'Marco' },
                          ].map((who) => (
                            <button
                              key={who.id}
                              type="button"
                              onClick={() => setHistoryPlayerFilter(who.id)}
                              className={`rounded-md px-2.5 py-0.5 font-medium transition-colors ${
                                historyPlayerFilter === who.id
                                  ? 'bg-[#0066C5] text-white'
                                  : 'text-slate-600 hover:text-[#0F172A]'
                              }`}
                            >
                              {who.label}
                            </button>
                          ))}
                        </div>

                        {/* Filtro Tipo: Reels Publicados vs Misiones Completadas */}
                        <div className="flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
                          {[
                            { id: 'all', label: 'Todo' },
                            { id: 'reel', label: '🎬 Reels Publicados' },
                            { id: 'quest', label: '✓ Misiones Completadas' },
                          ].map((tp) => (
                            <button
                              key={tp.id}
                              type="button"
                              onClick={() => setHistoryTypeFilter(tp.id)}
                              className={`rounded-md px-2.5 py-0.5 font-medium transition-colors ${
                                historyTypeFilter === tp.id
                                  ? 'bg-[#0F172A] text-white'
                                  : 'text-slate-600 hover:text-[#0F172A]'
                              }`}
                            >
                              {tp.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONTENIDO PESTAÑA 1: MISIONES ACTIVAS (BACKLOG POR CUENTA CON PENDIENTES DINÁMICOS) */}
                  {bottomSectionTab === 'active' ? (
                    <div className="mt-3 space-y-2">
                      {backlogByClient.map((group) => {
                        const { client, filteredTasks, pendingBacklogCount } = group;
                        const isExpanded = !!expandedBacklogClients[client.id];
                        const quickVal = backlogQuickInputs[client.id] || '';

                        return (
                          <div
                            key={`backlog-acc-${client.id}`}
                            className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBacklogClients((prev) => ({
                                  ...prev,
                                  [client.id]: !prev[client.id],
                                }))
                              }
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-100/70"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold text-[#0F172A]">
                                  {client.name}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ring-1 ${
                                    pendingBacklogCount > 0
                                      ? 'bg-[#0066C5]/10 text-[#0066C5] ring-[#0066C5]/30'
                                      : 'bg-white text-slate-500 ring-[#E2E8F0]'
                                  }`}
                                >
                                  {pendingBacklogCount} pendientes
                                </span>
                              </div>

                              <ChevronDown
                                className={`h-4 w-4 text-slate-400 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  key={`content-${client.id}`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-[#E2E8F0] bg-white p-3.5"
                                >
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!quickVal.trim()) return;
                                      handleQuickCreateMissionInline({
                                        title: quickVal,
                                        client: client.name,
                                        assignee: client.leadOwner || 'Kevin',
                                        questDifficulty: 'Guion',
                                        customXp: 100,
                                        priority: 'Media',
                                        deadline: todayDateStr,
                                        isTodayPinned: false,
                                      });
                                      setBacklogQuickInputs((prev) => ({
                                        ...prev,
                                        [client.id]: '',
                                      }));
                                    }}
                                    className="mb-3 flex gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={quickVal}
                                      onChange={(e) =>
                                        setBacklogQuickInputs((prev) => ({
                                          ...prev,
                                          [client.id]: e.target.value,
                                        }))
                                      }
                                      placeholder={`Añadir tarea a ${client.name} (+100 XP)...`}
                                      className="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none focus:border-[#0066C5] focus:bg-white"
                                    />
                                    <button
                                      type="submit"
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#0066C5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0052A3]"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Guardar
                                    </button>
                                  </form>

                                  {filteredTasks.length === 0 ? (
                                    <p className="py-2 text-center text-xs text-slate-400">
                                      Sin tareas en reserva.
                                    </p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {filteredTasks.map((task) => {
                                        const rpgSt = getQuestRpgStatus(task);
                                        const diffInfo = getQuestDifficultyInfo(task);
                                        const inTop3 = activeTop3IdsSet.has(task.id);
                                        const assignee = normalizeAssignee(task.assignee);

                                        return (
                                          <div
                                            key={task.id}
                                            className="flex flex-col gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 sm:flex-row sm:items-center sm:justify-between"
                                          >
                                            <div className="flex flex-wrap items-center gap-2">
                                              {inTop3 && (
                                                <span className="rounded bg-[#0066C5]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0066C5]">
                                                  Hoy
                                                </span>
                                              )}
                                              <span className="font-mono text-[11px] font-semibold text-slate-500">
                                                @{assignee}
                                              </span>
                                              <span
                                                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${diffInfo.colorClass}`}
                                              >
                                                {diffInfo.badgeLabel}
                                              </span>
                                              <span
                                                className={`text-xs font-semibold ${
                                                  rpgSt === 'Completado'
                                                    ? 'line-through text-slate-400'
                                                    : 'text-[#0F172A]'
                                                }`}
                                              >
                                                {task.title}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => handleAdvanceQuestRpgState(task)}
                                                className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold ${
                                                  rpgSt === 'Completado'
                                                    ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                                                    : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0066C5] hover:text-[#0066C5]'
                                                }`}
                                              >
                                                {rpgSt} →
                                              </button>

                                              {!inTop3 && rpgSt !== 'Completado' && (
                                                <button
                                                  type="button"
                                                  onClick={() => handlePromoteBacklogToToday(task)}
                                                  className="rounded-md bg-[#0066C5]/10 px-2 py-1 font-mono text-[10px] font-bold text-[#0066C5] hover:bg-[#0066C5] hover:text-white"
                                                >
                                                  Subir a Hoy
                                                </button>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() => handleDeleteSprint(task.id)}
                                                className="rounded p-1 text-slate-400 hover:text-[#EF4444]"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* CONTENIDO PESTAÑA 2: BÓVEDA / HISTORIAL DE VICTORIAS & PUBLICACIONES */
                    <div className="mt-3">
                      {filteredVictoryHistory.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center">
                          <p className="font-mono text-xs font-semibold text-slate-500">
                            Aún no hay victorias o publicaciones registradas con este filtro.
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Cada Quest completada o Reel publicado con el botón + Publicar quedará guardado permanentemente aquí.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-mono text-[10px] uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="px-3.5 py-2.5">Fecha &amp; Hora</th>
                                <th className="px-3.5 py-2.5">Jugador</th>
                                <th className="px-3.5 py-2.5">Tipo</th>
                                <th className="px-3.5 py-2.5">Cuenta / Categoría</th>
                                <th className="px-3.5 py-2.5">Título / Victoria</th>
                                <th className="px-3.5 py-2.5 text-right">XP</th>
                                <th className="px-3.5 py-2.5 text-right">Enlace</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                              {filteredVictoryHistory.map((item) => {
                                const isReel = item.type === 'reel';
                                const isNegative = Number(item.xp) < 0;
                                return (
                                  <tr
                                    key={item.id}
                                    className="transition-colors hover:bg-[#F8FAFC]"
                                  >
                                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                                      {item.date || todayDateStr} · {item.time || '--:--'}
                                    </td>
                                    <td className="whitespace-nowrap px-3.5 py-2.5">
                                      <span
                                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                                          item.player === 'Kevin'
                                            ? 'bg-[#0066C5]/10 text-[#0066C5]'
                                            : 'bg-slate-900 text-white'
                                        }`}
                                      >
                                        {item.player}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3.5 py-2.5">
                                      <span
                                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                          isReel
                                            ? 'bg-[#10B981]/10 text-[#10B981]'
                                            : isNegative
                                            ? 'bg-[#EF4444]/10 text-[#EF4444]'
                                            : 'bg-[#F8FAFC] text-slate-600 ring-1 ring-[#E2E8F0]'
                                        }`}
                                      >
                                        {isReel ? '🎬 Reel Publicado' : isNegative ? '⚠️ Penalización' : '✓ Quest'}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-[#0F172A]">
                                      {item.account}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-medium text-[#0F172A]">
                                      {item.title}
                                    </td>
                                    <td
                                      className={`whitespace-nowrap px-3.5 py-2.5 text-right font-mono text-xs font-bold ${
                                        isNegative ? 'text-[#EF4444]' : 'text-[#10B981]'
                                      }`}
                                    >
                                      {isNegative ? `${item.xp} XP` : `+${item.xp} XP`}
                                    </td>
                                    <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                                      {item.link ? (
                                        <a
                                          href={item.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 rounded-md border border-[#0066C5]/30 bg-[#0066C5]/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#0066C5] hover:bg-[#0066C5] hover:text-white"
                                        >
                                          <span>Ver Reel</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className="font-mono text-[10px] text-slate-400">
                                          —
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </section>
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
                        const sm = getClientSocialMetrics(client);

                        return (
                          <motion.div
                            key={client.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.99 }}
                            transition={SPRING_TRANSITION}
                            onClick={() => handleOpenClient360(client.id, 'metrics')}
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

                              <h3 className="mt-4 text-xl font-bold text-[#0F172A] transition-colors group-hover:text-[#0066C5]">
                                {client.name}
                              </h3>
                              <p className="font-mono text-xs font-medium text-slate-500">
                                {client.category}
                              </p>

                              <p className="mt-2.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                                {client.story}
                              </p>

                              {/* Resumen de Seguidores y Métricas Reales */}
                              <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Redes &amp; Métricas Reales
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenMetricsModal(client);
                                    }}
                                    className="rounded-md bg-[#0066C5]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0066C5] hover:bg-[#0066C5] hover:text-white"
                                  >
                                    Actualizar Métricas
                                  </button>
                                </div>

                                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                                  <div className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5">
                                    <div className="text-[9px] text-slate-400">TikTok</div>
                                    <div className="font-bold text-[#0F172A]">
                                      {sm.tiktokFollowers.toLocaleString()}
                                    </div>
                                    {sm.tiktokWeeklyDelta !== 0 && (
                                      <div
                                        className={`text-[9px] font-semibold ${
                                          sm.tiktokWeeklyDelta > 0
                                            ? 'text-[#10B981]'
                                            : 'text-[#EF4444]'
                                        }`}
                                      >
                                        {sm.tiktokWeeklyDelta > 0
                                          ? `+${sm.tiktokWeeklyDelta}`
                                          : sm.tiktokWeeklyDelta}
                                      </div>
                                    )}
                                  </div>

                                  <div className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5">
                                    <div className="text-[9px] text-slate-400">Instagram</div>
                                    <div className="font-bold text-[#0F172A]">
                                      {sm.instagramFollowers.toLocaleString()}
                                    </div>
                                    {sm.instagramWeeklyDelta !== 0 && (
                                      <div
                                        className={`text-[9px] font-semibold ${
                                          sm.instagramWeeklyDelta > 0
                                            ? 'text-[#10B981]'
                                            : 'text-[#EF4444]'
                                        }`}
                                      >
                                        {sm.instagramWeeklyDelta > 0
                                          ? `+${sm.instagramWeeklyDelta}`
                                          : sm.instagramWeeklyDelta}
                                      </div>
                                    )}
                                  </div>

                                  <div className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5">
                                    <div className="text-[9px] text-slate-400">Facebook</div>
                                    <div className="font-bold text-[#0F172A]">
                                      {sm.facebookFollowers.toLocaleString()}
                                    </div>
                                    {sm.facebookWeeklyDelta !== 0 && (
                                      <div
                                        className={`text-[9px] font-semibold ${
                                          sm.facebookWeeklyDelta > 0
                                            ? 'text-[#10B981]'
                                            : 'text-[#EF4444]'
                                        }`}
                                      >
                                        {sm.facebookWeeklyDelta > 0
                                          ? `+${sm.facebookWeeklyDelta}`
                                          : sm.facebookWeeklyDelta}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
                                  <span>
                                    Vistas Reels: <strong className="text-[#0F172A]">{sm.reelViews.toLocaleString()}</strong>
                                  </span>
                                  <span>
                                    Eng: <strong className="text-[#0F172A]">{sm.engagementRate}%</strong>
                                  </span>
                                  <span>
                                    Clics WA: <strong className="text-[#0F172A]">{sm.whatsappClicks}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
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

                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#0066C5] transition-transform group-hover:translate-x-0.5">
                                Ver Perfil / Métricas →
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
                          <button
                            type="button"
                            onClick={() => handleOpenMetricsModal(selectedClient360)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066C5] px-3.5 py-2 font-mono text-xs font-bold text-white shadow-sm hover:bg-[#0052A3]"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            Actualizar Métricas
                          </button>

                          {/* Selector dinámico para cambiar entre Zenda Agency, Dolciangel, La Lanchita y King's Barber Shop */}
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

                      {/* Navegación Interna de las 5 Pestañas 360° con layoutId */}
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {[
                          { id: 'metrics', label: 'Métricas & Redes Sociales', icon: Globe },
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
                      {/* PESTAÑA 0: PERFIL 360° DE REDES Y MÉTRICAS REALES        */}
                      {/* ======================================================== */}
                      {client360Tab === 'metrics' && (
                        <motion.div
                          key="360-metrics"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-6"
                        >
                          {(() => {
                            const sm = getClientSocialMetrics(selectedClient360);
                            const updateInlineMetric = (partial) => {
                              const nextMetrics = {
                                ...sm,
                                ...partial,
                                updatedAt: new Date().toISOString(),
                              };
                              handleUpdateClientField(
                                selectedClient360.id,
                                { socialMetrics: nextMetrics },
                                '',
                              );
                            };

                            return (
                              <>
                                <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <h3 className="text-base font-bold text-[#0F172A]">
                                      Perfil 360° de Redes Sociales &amp; Indicadores Reales · {selectedClient360.name}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                      Edita directamente cualquier indicador o usa el botón &ldquo;Actualizar Métricas&rdquo; cada domingo. Guardado en tiempo real en Firestore (<code>zenda_clients</code>).
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenMetricsModal(selectedClient360)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0066C5] px-4 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-[#0052A3]"
                                  >
                                    <Zap className="h-3.5 w-3.5" />
                                    Actualizar Métricas (Modal Rápido)
                                  </button>
                                </div>

                                {/* Seguidores Actuales, Meta y Variación Semanal (+X seguidores) en TikTok, Instagram y Facebook */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                  {[
                                    {
                                      network: 'TikTok',
                                      followersKey: 'tiktokFollowers',
                                      goalKey: 'tiktokGoal',
                                      deltaKey: 'tiktokWeeklyDelta',
                                    },
                                    {
                                      network: 'Instagram',
                                      followersKey: 'instagramFollowers',
                                      goalKey: 'instagramGoal',
                                      deltaKey: 'instagramWeeklyDelta',
                                    },
                                    {
                                      network: 'Facebook',
                                      followersKey: 'facebookFollowers',
                                      goalKey: 'facebookGoal',
                                      deltaKey: 'facebookWeeklyDelta',
                                    },
                                  ].map((net) => {
                                    const currentVal = Number(sm[net.followersKey] || 0);
                                    const goalVal = Number(sm[net.goalKey] || 0);
                                    const deltaVal = Number(sm[net.deltaKey] || 0);
                                    const progressPct =
                                      goalVal > 0
                                        ? Math.min(100, Math.round((currentVal / goalVal) * 100))
                                        : 0;

                                    return (
                                      <div
                                        key={net.network}
                                        className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                            {net.network}
                                          </span>
                                          <span
                                            className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                                              deltaVal > 0
                                                ? 'bg-[#10B981]/10 text-[#10B981]'
                                                : deltaVal < 0
                                                ? 'bg-[#EF4444]/10 text-[#EF4444]'
                                                : 'bg-[#F8FAFC] text-slate-500 ring-1 ring-[#E2E8F0]'
                                            }`}
                                          >
                                            {deltaVal > 0
                                              ? `+${deltaVal} esta sem`
                                              : deltaVal < 0
                                              ? `${deltaVal} esta sem`
                                              : '0 var. sem'}
                                          </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                          <div>
                                            <label className="block font-mono text-[10px] text-slate-500">
                                              Seguidores
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={currentVal}
                                              onChange={(e) =>
                                                updateInlineMetric({
                                                  [net.followersKey]: Number(e.target.value) || 0,
                                                })
                                              }
                                              onBlur={() => showToast('Seguidores actualizados en Zenda OS')}
                                              className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-sm font-bold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                                            />
                                          </div>

                                          <div>
                                            <label className="block font-mono text-[10px] text-slate-500">
                                              Meta
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={goalVal}
                                              onChange={(e) =>
                                                updateInlineMetric({
                                                  [net.goalKey]: Number(e.target.value) || 0,
                                                })
                                              }
                                              onBlur={() => showToast('Meta actualizada en Zenda OS')}
                                              className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-700 outline-none focus:border-[#0066C5] focus:bg-white"
                                            />
                                          </div>

                                          <div>
                                            <label className="block font-mono text-[10px] text-slate-500">
                                              Var. (+X)
                                            </label>
                                            <input
                                              type="number"
                                              value={deltaVal}
                                              onChange={(e) =>
                                                updateInlineMetric({
                                                  [net.deltaKey]: Number(e.target.value) || 0,
                                                })
                                              }
                                              onBlur={() => showToast('Variación semanal guardada')}
                                              className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-sm font-semibold text-[#10B981] outline-none focus:border-[#0066C5] focus:bg-white"
                                            />
                                          </div>
                                        </div>

                                        <div className="mt-3">
                                          <div className="flex justify-between font-mono text-[10px] text-slate-500">
                                            <span>Progreso hacia la meta</span>
                                            <span className="font-bold text-[#0F172A]">{progressPct}%</span>
                                          </div>
                                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${progressPct}%` }}
                                              transition={{ duration: 0.45 }}
                                              className="h-full rounded-full bg-[#0066C5]"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Métricas Clave del Mes / Semana */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Vistas Totales de Reels
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={sm.reelViews}
                                      onChange={(e) =>
                                        updateInlineMetric({
                                          reelViews: Number(e.target.value) || 0,
                                        })
                                      }
                                      onBlur={() => showToast('Vistas totales actualizadas')}
                                      className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-mono text-lg font-bold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                                    />
                                  </div>

                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Alcance Promedio
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={sm.avgReach}
                                      onChange={(e) =>
                                        updateInlineMetric({
                                          avgReach: Number(e.target.value) || 0,
                                        })
                                      }
                                      onBlur={() => showToast('Alcance promedio actualizado')}
                                      className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-mono text-lg font-bold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                                    />
                                  </div>

                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Tasa de Interacción (Engagement %)
                                    </label>
                                    <div className="mt-2 flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={sm.engagementRate}
                                        onChange={(e) =>
                                          updateInlineMetric({
                                            engagementRate: Number(e.target.value) || 0,
                                          })
                                        }
                                        onBlur={() => showToast('Engagement % actualizado')}
                                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-mono text-lg font-bold text-[#0066C5] outline-none focus:border-[#0066C5] focus:bg-white"
                                      />
                                      <span className="font-mono text-sm font-bold text-slate-500">%</span>
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Clics a WhatsApp / Reservas
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={sm.whatsappClicks}
                                      onChange={(e) =>
                                        updateInlineMetric({
                                          whatsappClicks: Number(e.target.value) || 0,
                                        })
                                      }
                                      onBlur={() => showToast('Clics a WhatsApp actualizados')}
                                      className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-mono text-lg font-bold text-[#10B981] outline-none focus:border-[#0066C5] focus:bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Mejor Reel de la Semana (Título + Vistas + Link) */}
                                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                    🏆 Mejor Reel de la Semana (Título + Vistas)
                                  </span>
                                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="sm:col-span-2">
                                      <label className="mb-1 block font-mono text-[10px] text-slate-500">
                                        Título / Hook del Mejor Reel
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Ej. Cómo preparamos el tiramisú artesanal en Dolciangel..."
                                        value={sm.bestReelTitle}
                                        onChange={(e) =>
                                          updateInlineMetric({
                                            bestReelTitle: e.target.value,
                                          })
                                        }
                                        onBlur={() => showToast('Mejor Reel actualizado')}
                                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-1 block font-mono text-[10px] text-slate-500">
                                        Vistas del Mejor Reel
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={sm.bestReelViews}
                                        onChange={(e) =>
                                          updateInlineMetric({
                                            bestReelViews: Number(e.target.value) || 0,
                                          })
                                        }
                                        onBlur={() => showToast('Vistas del Mejor Reel actualizadas')}
                                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-mono text-xs font-bold text-[#0066C5] outline-none focus:border-[#0066C5] focus:bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </motion.div>
                      )}

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
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-[#0066C5]" />
                      <h2 className="text-lg font-bold text-[#0F172A]">Calendario & Rodajes Operativos</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Alertas nativas 15 min antes de cada evento y a las 7:25 AM para el Despegue.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEnableBrowserAlerts}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs font-semibold transition-colors ${
                        notificationPermission === 'granted'
                          ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0066C5] hover:text-[#0066C5]'
                      }`}
                    >
                      <span>
                        {notificationPermission === 'granted'
                          ? '🔔 Alertas Activas (15m / 7:25 AM)'
                          : '🔔 Activar Alertas'}
                      </span>
                    </button>

                    <select
                      value={calendarClientFilter}
                      onChange={(e) => setCalendarClientFilter(e.target.value)}
                      className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 font-mono text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-[#0066C5]"
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
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066C5] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white shadow-sm hover:bg-[#0052A3]"
                    >
                      <Plus className="h-4 w-4" />
                      + NUEVO EVENTO
                    </motion.button>
                  </div>
                </div>

                {/* Barra compacta de Webhook URL (n8n / WhatsApp) para alertas de calendario */}
                <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="shrink-0 font-mono text-xs font-semibold text-[#0F172A]">
                      Webhook URL (n8n / WhatsApp):
                    </span>
                    <input
                      type="url"
                      value={rpgState.webhookUrl || ''}
                      onChange={(e) => updateRpgState({ webhookUrl: e.target.value })}
                      placeholder="https://n8n.wearezenda.com/webhook/calendario (POST JSON: { title, time, assignedTo })"
                      className="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 font-mono text-xs text-[#0F172A] placeholder-slate-400 outline-none focus:border-[#0066C5] focus:bg-white"
                    />
                  </div>
                  {rpgState.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        sendCalendarWebhookPost({
                          title: 'Test de Alerta Calendario Zenda',
                          time: formatExactTime(new Date()),
                          assignedTo: 'Kevin & Marco',
                          trigger: 'calendar_test',
                        });
                        showToast('POST JSON enviado al Webhook');
                      }}
                      className="shrink-0 rounded-lg border border-[#0066C5] bg-white px-3 py-1.5 font-mono text-xs font-semibold text-[#0066C5] hover:bg-[#0066C5] hover:text-white"
                    >
                      Probar Webhook
                    </button>
                  )}
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
                  <p className="font-bold text-slate-900">Se sembrarán las 4 cuentas oficiales en 0:</p>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1">
                    <li>Zenda Agency (Growth Partner B2B &amp; Marca Propia)</li>
                    <li>Dolciangel (Pastelería &amp; Cafetería de Especialidad)</li>
                    <li>La Lanchita (Cevichería &amp; Gastronomía Marina)</li>
                    <li>King&apos;s Barber Shop (Barbería &amp; Estilismo Masculino)</li>
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

      {/* Modal 1: + Nueva Quest Personalizada con XP Libre y Categorías */}
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
                  + Nueva Quest Personalizada (XP Libre)
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
                    Título de la Misión / Reto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Reel autoridad IA para negocios o Bloque profundo de programación"
                    value={newSprint.title}
                    onChange={(e) => setNewSprint({ ...newSprint, title: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-slate-900 outline-none focus:border-[#0066C5] focus:bg-white"
                  />
                </div>

                {/* Categoría (4 Clientes, Personal/Hábito, Estudio/Entreno, o Crear Nueva) */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Categoría / Cuenta
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAddingCustomCategoryFor(
                          addingCustomCategoryFor === 'modal' ? null : 'modal',
                        )
                      }
                      className="font-mono text-[10px] font-bold text-[#0066C5] hover:underline"
                    >
                      + Crear nueva categoría
                    </button>
                  </div>
                  <select
                    value={newSprint.client}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      if (nextCat === '__create_new__') {
                        setAddingCustomCategoryFor('modal');
                        return;
                      }
                      setNewSprint({
                        ...newSprint,
                        client: nextCat,
                        questDifficulty: getDefaultDifficultyForCategory(nextCat),
                      });
                    }}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-[#0066C5] focus:bg-white"
                  >
                    {allQuestCategoryOptions.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                    <option value="__create_new__">+ Crear nueva categoría...</option>
                  </select>

                  {addingCustomCategoryFor === 'modal' && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#0066C5]/40 bg-[#F8FAFC] p-2">
                      <input
                        type="text"
                        value={customCategoryDraft}
                        onChange={(e) => setCustomCategoryDraft(e.target.value)}
                        placeholder="Escribe el nombre de la nueva categoría..."
                        className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#0066C5]"
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateCustomCategory('modal')}
                        className="rounded-lg bg-[#0066C5] px-3 py-1.5 font-mono text-xs font-bold text-white"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                {/* Asignador de XP Libre (50, 100, 150, 250, 500 XP + Input Numérico Editable) */}
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                  <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Recompensa de XP Libre (Elige un botón rápido o escribe el valor según dificultad)
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {QUICK_XP_PRESETS.map((xpVal) => {
                        const isSelected = Number(newSprint.customXp) === xpVal;
                        return (
                          <button
                            key={xpVal}
                            type="button"
                            onClick={() =>
                              setNewSprint({ ...newSprint, customXp: xpVal })
                            }
                            className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-[#0066C5] text-white shadow-sm'
                                : 'border border-[#E2E8F0] bg-white text-slate-700 hover:border-[#0066C5] hover:text-[#0066C5]'
                            }`}
                          >
                            +{xpVal} XP
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        step="10"
                        required
                        value={newSprint.customXp}
                        onChange={(e) =>
                          setNewSprint({ ...newSprint, customXp: e.target.value })
                        }
                        className="w-24 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-right font-mono text-sm font-bold text-[#0066C5] outline-none focus:border-[#0066C5]"
                      />
                      <span className="font-mono text-xs font-bold text-[#0066C5]">
                        XP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-600">
                      Asignado a
                    </label>
                    <select
                      value={newSprint.assignee}
                      onChange={(e) => setNewSprint({ ...newSprint, assignee: e.target.value })}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-[#0066C5] focus:bg-white"
                    >
                      <option value="Kevin">Kevin</option>
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
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-[#0066C5] focus:bg-white"
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
                    Fecha Objetivo
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprint.deadline}
                    onChange={(e) => setNewSprint({ ...newSprint, deadline: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-slate-900 outline-none focus:border-[#0066C5] focus:bg-white"
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
                    className="rounded-xl bg-[#0066C5] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-[#0052A3]"
                  >
                    Guardar Quest (+{newSprint.customXp || 100} XP)
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
                      <option value="Kevin">Kevin</option>
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
                    <option value="Kevin">Kevin</option>
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

      {/* Modal 6: Mini-Modal Anti-Trampa '+ Publicar' (Restaura 100% HP, +200 XP, +1 Meta Semanal y Guarda en Historial) */}
      <AnimatePresence>
        {publishModalClient && (
          <motion.div
            key="modal-anti-cheat-publish"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setPublishModalClient(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 text-[#0F172A] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                    Registro Oficial Anti-Trampa · +200 XP · 100% HP
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-[#0F172A]">
                    Publicar Reel en {publishModalClient.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishModalClient(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAntiCheatPublish} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    1. ¿Quién lo publicó? (+200 XP)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Kevin', 'Marco'].map((who) => {
                      const isSelected = publishForm.player === who;
                      return (
                        <button
                          key={who}
                          type="button"
                          onClick={() => setPublishForm({ ...publishForm, player: who })}
                          className={`rounded-xl border px-3 py-2.5 font-mono text-xs font-bold transition-colors ${
                            isSelected
                              ? 'border-[#0066C5] bg-[#0066C5] text-white shadow-sm'
                              : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#0066C5]'
                          }`}
                        >
                          {who} (+200 XP)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    2. Título / Tema del Reel Publicado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Ej. Nuevo Reel para ${publishModalClient.name}...`}
                    value={publishForm.title}
                    onChange={(e) =>
                      setPublishForm({ ...publishForm, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    3. Link Opcional (TikTok / Instagram / Facebook)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/reel/... o https://www.tiktok.com/..."
                    value={publishForm.link}
                    onChange={(e) =>
                      setPublishForm({ ...publishForm, link: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-xs text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                  />
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-[11px] text-slate-600">
                  Al confirmar: Restaura el HP de <strong>{publishModalClient.name}</strong> al 100%, suma{' '}
                  <strong className="text-[#10B981]">+200 XP</strong> a{' '}
                  <strong>{publishForm.player}</strong>, sube +1 a la Meta Semanal (12/12) y archiva el registro en la Bóveda.
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalClient(null)}
                    className="rounded-xl px-4 py-2 font-mono text-xs text-slate-500 hover:text-[#0F172A]"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#0066C5] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-[#0052A3]"
                  >
                    Confirmar Publicación (+200 XP)
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 7: Mini-Modal de Penalización Competitiva 1v1 (-100 XP) */}
      <AnimatePresence>
        {penaltyModalOpen && (
          <motion.div
            key="modal-penalty-1v1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setPenaltyModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 text-[#0F172A] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
                    Psicología Competitiva 1v1
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-[#0F172A]">
                    ⚠️ Aplicar Penalización (-100 XP)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPenaltyModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleApplyPenalty} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Jugador Penalizado (-100 XP)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Kevin', 'Marco'].map((who) => {
                      const isSelected = penaltyForm.player === who;
                      return (
                        <button
                          key={who}
                          type="button"
                          onClick={() => setPenaltyForm({ ...penaltyForm, player: who })}
                          className={`rounded-xl border px-3 py-2.5 font-mono text-xs font-bold transition-colors ${
                            isSelected
                              ? 'border-[#EF4444] bg-[#EF4444] text-white shadow-sm'
                              : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#EF4444]'
                          }`}
                        >
                          {who} (-100 XP)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Motivo de la Penalización
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Quedarse dormido (no check-in 7:30 AM) / Incumplimiento de entrega"
                    value={penaltyForm.reason}
                    onChange={(e) =>
                      setPenaltyForm({ ...penaltyForm, reason: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPenaltyModalOpen(false)}
                    className="rounded-xl px-4 py-2 font-mono text-xs text-slate-500 hover:text-[#0F172A]"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TRANSITION}
                    className="rounded-xl bg-[#EF4444] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-red-600"
                  >
                    Confirmar Penalización (-100 XP)
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 8: Perfil 360° de Cada Negocio (Actualizar Seguidores y Métricas Reales en Firestore) */}
      <AnimatePresence>
        {metricsModalClientId && (
          <motion.div
            key="modal-client-social-metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setMetricsModalClientId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING_TRANSITION}
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 text-[#0F172A] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const modalClient = zendaClients.find((c) => c.id === metricsModalClientId);
                if (!modalClient) return null;

                return (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0066C5]">
                          Perfil 360° · Indicadores Reales de Redes Sociales
                        </span>
                        <h3 className="mt-0.5 text-lg font-bold text-[#0F172A]">
                          {modalClient.name} · Seguidores &amp; Métricas
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={modalClient.id}
                          onChange={(e) => {
                            const nextClient = zendaClients.find((c) => c.id === e.target.value);
                            if (nextClient) handleOpenMetricsModal(nextClient);
                          }}
                          className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#0066C5]"
                        >
                          {zendaClients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setMetricsModalClientId(null)}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => handleSaveClientSocialMetrics(e, modalClient)}
                      className="mt-5 space-y-5 text-xs"
                    >
                      {/* 1. Seguidores actuales, meta y variación semanal (+X) en TikTok, Instagram y Facebook */}
                      <div>
                        <p className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          1. Seguidores Actuales, Meta &amp; Variación Semanal (+X seguidores)
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {[
                            {
                              label: 'TikTok',
                              fKey: 'tiktokFollowers',
                              gKey: 'tiktokGoal',
                              dKey: 'tiktokWeeklyDelta',
                            },
                            {
                              label: 'Instagram',
                              fKey: 'instagramFollowers',
                              gKey: 'instagramGoal',
                              dKey: 'instagramWeeklyDelta',
                            },
                            {
                              label: 'Facebook',
                              fKey: 'facebookFollowers',
                              gKey: 'facebookGoal',
                              dKey: 'facebookWeeklyDelta',
                            },
                          ].map((net) => (
                            <div
                              key={net.label}
                              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-[#0F172A]">
                                  {net.label}
                                </span>
                                <span className="font-mono text-[10px] font-semibold text-[#10B981]">
                                  {Number(metricsDraft[net.dKey] || 0) >= 0
                                    ? `+${Number(metricsDraft[net.dKey] || 0)}`
                                    : Number(metricsDraft[net.dKey] || 0)}{' '}
                                  sem
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block font-mono text-[10px] text-slate-500">
                                    Seguidores actuales
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={metricsDraft[net.fKey]}
                                    onChange={(e) =>
                                      setMetricsDraft({
                                        ...metricsDraft,
                                        [net.fKey]: e.target.value,
                                      })
                                    }
                                    className="mt-0.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#0066C5]"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block font-mono text-[9px] text-slate-500">
                                      Meta
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={metricsDraft[net.gKey]}
                                      onChange={(e) =>
                                        setMetricsDraft({
                                          ...metricsDraft,
                                          [net.gKey]: e.target.value,
                                        })
                                      }
                                      className="mt-0.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 font-mono text-[11px] text-slate-700 outline-none focus:border-[#0066C5]"
                                    />
                                  </div>

                                  <div>
                                    <label className="block font-mono text-[9px] text-slate-500">
                                      Var. (+X sem)
                                    </label>
                                    <input
                                      type="number"
                                      value={metricsDraft[net.dKey]}
                                      onChange={(e) =>
                                        setMetricsDraft({
                                          ...metricsDraft,
                                          [net.dKey]: e.target.value,
                                        })
                                      }
                                      className="mt-0.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 font-mono text-[11px] font-bold text-[#10B981] outline-none focus:border-[#0066C5]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Métricas Clave del Mes / Semana */}
                      <div>
                        <p className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          2. Métricas Clave del Mes / Semana
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-slate-600">
                              Vistas Totales Reels
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricsDraft.reelViews}
                              onChange={(e) =>
                                setMetricsDraft({
                                  ...metricsDraft,
                                  reelViews: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-slate-600">
                              Alcance Promedio
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricsDraft.avgReach}
                              onChange={(e) =>
                                setMetricsDraft({
                                  ...metricsDraft,
                                  avgReach: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#0066C5] focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-slate-600">
                              Engagement (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={metricsDraft.engagementRate}
                              onChange={(e) =>
                                setMetricsDraft({
                                  ...metricsDraft,
                                  engagementRate: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-xs font-bold text-[#0066C5] outline-none focus:border-[#0066C5] focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-slate-600">
                              Clics WhatsApp / Reservas
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricsDraft.whatsappClicks}
                              onChange={(e) =>
                                setMetricsDraft({
                                  ...metricsDraft,
                                  whatsappClicks: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 font-mono text-xs font-bold text-[#10B981] outline-none focus:border-[#0066C5] focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Mejor Reel de la Semana (Título + Vistas) */}
                      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                          3. Mejor Reel de la Semana (Título + Vistas)
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block font-mono text-[10px] text-slate-500">
                              Título / Tema del Mejor Reel
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Reel experiencia gastronómica / Antes y después corte..."
                              value={metricsDraft.bestReelTitle}
                              onChange={(e) =>
                                setMetricsDraft({
                                  ...metricsDraft,
                                  bestReelTitle: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#0066C5]"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-slate-500">
                              Vistas del Mejor Reel
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricsDraft.bestReelViews}
                              onChange={(e) =>
                                setMetricsDraft({
                                  ...metricsDraft,
                                  bestReelViews: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white p-2.5 font-mono text-xs font-bold text-[#0066C5] outline-none focus:border-[#0066C5]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setMetricsModalClientId(null);
                            handleOpenClient360(modalClient.id, 'metrics');
                          }}
                          className="font-mono text-xs font-bold text-[#0066C5] hover:underline"
                        >
                          Abrir Vista 360° completa de {modalClient.name} →
                        </button>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setMetricsModalClientId(null)}
                            className="rounded-xl px-4 py-2 font-mono text-xs text-slate-500 hover:text-[#0F172A]"
                          >
                            Cancelar
                          </button>
                          <motion.button
                            type="submit"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            transition={SPRING_TRANSITION}
                            className="rounded-xl bg-[#0066C5] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-[#0052A3]"
                          >
                            Guardar Métricas Reales
                          </motion.button>
                        </div>
                      </div>
                    </form>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Navegación Inferior Fija para Celular en Campo (md:hidden) */}
      <nav
        aria-label="Navegación Móvil en Campo"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#27272A] bg-[#09090B]/95 px-2 py-2 backdrop-blur-md md:hidden"
      >
        {[
          { id: 'command', shortLabel: 'Hoy', icon: LayoutDashboard },
          { id: 'clients', shortLabel: 'Cuentas', icon: Building2 },
          { id: 'pipeline', shortLabel: 'Pipeline', icon: Film },
          { id: 'calendar', shortLabel: 'Rodajes', icon: CalendarIcon },
          { id: 'finances', shortLabel: 'Caja', icon: Wallet },
        ].map((navItem) => {
          const NavIcon = navItem.icon;
          const isActive = activeTab === navItem.id;
          return (
            <button
              key={`mob-nav-${navItem.id}`}
              type="button"
              onClick={() => setActiveTab(navItem.id)}
              className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 font-mono text-[10px] transition-colors ${
                isActive ? 'bg-white/15 font-bold text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <NavIcon className={`h-4 w-4 ${isActive ? 'text-zenda-cyan' : 'text-zinc-400'}`} />
              <span className="mt-0.5">{navItem.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
