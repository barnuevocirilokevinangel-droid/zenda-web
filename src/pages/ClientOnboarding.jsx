import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  FolderGit2,
  Globe,
  Layers,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Store,
  Target,
  Zap,
} from 'lucide-react';
import { COMPANY } from '../config/company.js';
import { saveDocument } from '../lib/saveDocument.js';
import usePageMeta from '../lib/usePageMeta.js';
import { buildWhatsAppLink } from '../lib/whatsapp.js';

const COLLECTION = 'client_onboarding';

const STEPS = [
  {
    stepNumber: '01',
    label: 'Ficha y Accesos',
    title: 'Ficha de Negocio y Accesos',
    subtitle: 'Información esencial de tu marca, decisores y material audiovisual para la auditoría técnica.',
  },
  {
    stepNumber: '02',
    label: 'Radiografía Operativa',
    title: 'Radiografía de Ventas y Operación',
    subtitle: 'Mapeamos tu oferta estrella, volúmenes de atención y tickets para dimensionar el sistema.',
  },
  {
    stepNumber: '03',
    label: 'Cuello de Botella',
    title: 'Sistemas y Cuellos de Botella',
    subtitle: 'Identificamos las herramientas actuales y los procesos manuales que te generan mayores pérdidas u horas desperdiciadas.',
  },
  {
    stepNumber: '04',
    label: 'Objetivos 90 Días',
    title: 'Objetivos y Hoja de Ruta a 90 Días',
    subtitle: 'Establecemos la meta comercial prioritaria para medir el éxito concreto del proyecto.',
  },
];

// Rangos de ticket adaptados a comercios y empresas locales (en Soles)
const TICKETS = [
  'Menos de S/ 50 (Consumo diario / servicios rápidos)',
  'S/ 50 – S/ 150 (Servicios estándar o retail)',
  'S/ 150 – S/ 500 (Ticket medio / atención especializada)',
  'S/ 500 – S/ 2,000 (Servicios corporativos / B2B)',
  'Más de S/ 2,000 (Alto valor o ticket premium)',
  'Variable según cotización / proyecto',
];

const VOLUMES = [
  'Menos de 20 pedidos o consultas por semana',
  '20 a 60 pedidos o consultas por semana',
  '60 a 150 pedidos o consultas por semana',
  'Más de 150 pedidos o consultas por semana',
];

const CHANNELS = [
  { value: 'WhatsApp', label: 'WhatsApp Business', icon: MessageSquare },
  { value: 'Instagram', label: 'Instagram DM', icon: Globe },
  { value: 'Llamadas', label: 'Llamadas telefónicas', icon: PhoneCall },
  { value: 'Tienda física', label: 'Tienda física / Local comercial', icon: Store },
  { value: 'Web / E-commerce', label: 'Sitio Web / Carrito de compras', icon: Layers },
  { value: 'Otros', label: 'TikTok / Otros canales', icon: Zap },
];

const TOOLS_LIST = [
  'Excel / Google Sheets',
  'WhatsApp Business',
  'Software POS / Sistema de Caja',
  'CRM (Kommo, HubSpot, etc.)',
  'Facturación Electrónica / ERP',
  'Tienda online (Shopify, WooCommerce...)',
  'Meta Business Suite / Pauta publicitaria',
  'Cuaderno / Procesos manuales en papel',
  'Ninguna herramienta formal',
  'Otra herramienta',
];

const GOAL_OPTIONS = [
  {
    value: 'Más leads calificados',
    title: 'Más leads calificados',
    description: 'Adquisición y prospección continua de clientes pre-filtrados y de alto valor.',
    icon: Target,
  },
  {
    value: 'Automatizar pedidos y atención',
    title: 'Automatizar pedidos y atención',
    description: 'Flujos inteligentes en WhatsApp 24/7, catálogo interactivo y respuesta en < 60 segundos.',
    icon: Bot,
  },
  {
    value: 'Sistema interno a medida',
    title: 'Sistema interno a medida',
    description: 'Dashboard de control, inventario, CRM o software propio para eliminar el desorden operativo.',
    icon: LayoutDashboard,
  },
  {
    value: 'Escalamiento 360° (Marketing + Software)',
    title: 'Escalamiento 360° (Marketing + Software)',
    description: 'Ecosistema completo: campañas publicitarias + automatizaciones + infraestructura técnica.',
    icon: Rocket,
  },
];

const INITIAL_VALUES = {
  // Paso 1
  businessName: '',
  rucOrLegal: '',
  decisionMaker: '',
  contact: '',
  socialLinks: '',
  driveFolder: '',

  // Paso 2
  starProduct: '',
  avgTicket: '',
  weeklyVolume: '',
  mainChannel: '',

  // Paso 3
  currentTools: [],
  toolsOther: '',
  bottleneckProcess: '',

  // Paso 4
  primaryGoal: '',
  goalDetail: '',
  consent: false,
};

const REQUIRED = 'Este campo es obligatorio.';

function validateStep(step, v) {
  const errors = {};
  if (step === 0) {
    if (!v.businessName.trim()) errors.businessName = REQUIRED;
    if (!v.decisionMaker.trim()) errors.decisionMaker = 'Indica el nombre y cargo del decisor.';
    if (v.contact.trim().length < 6) errors.contact = 'Ingresa un WhatsApp o teléfono de contacto válido.';
    // Campo socialLinks ahora es completamente OPCIONAL; no bloquea ni muestra error.
  } else if (step === 1) {
    if (!v.starProduct.trim()) errors.starProduct = REQUIRED;
    if (!v.avgTicket) errors.avgTicket = 'Selecciona el rango de ticket promedio.';
    if (!v.weeklyVolume) errors.weeklyVolume = 'Indica el volumen semanal aproximado.';
    if (!v.mainChannel) errors.mainChannel = 'Selecciona el canal principal de atención.';
  } else if (step === 2) {
    if (v.currentTools.length === 0) errors.currentTools = 'Selecciona al menos una herramienta o "Ninguna".';
    if (v.bottleneckProcess.trim().length < 10) {
      errors.bottleneckProcess = 'Cuéntanos el proceso con algo más de detalle (mínimo 10 caracteres).';
    }
  } else if (step === 3) {
    if (!v.primaryGoal) errors.primaryGoal = 'Selecciona tu meta comercial prioritaria.';
    if (v.goalDetail.trim().length < 10) {
      errors.goalDetail = 'Describe tu meta de éxito a 90 días (mínimo 10 caracteres).';
    }
    if (!v.consent) errors.consent = 'Debes aceptar los Términos y la Política de Privacidad para continuar.';
  }
  return errors;
}

export default function ClientOnboarding() {
  usePageMeta({
    title: 'Portal de Onboarding y Auditoría | Zenda',
    description: 'Portal interactivo de incorporación, accesos y auditoría operativa para nuevos clientes de Zenda.',
    noindex: true,
  });

  const reduceMotion = useReducedMotion();
  const headingRef = useRef(null);
  const mounted = useRef(false);

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | sending | error | done

  const lastStep = STEPS.length - 1;
  const sending = status === 'sending';
  const progress = status === 'done' ? 100 : ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step, status]);

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onText = (name) => (event) => setValue(name, event.target.value);

  const toggleTool = (tool) => {
    const active = values.currentTools.includes(tool);
    const updated = active
      ? values.currentTools.filter((t) => t !== tool)
      : [...values.currentTools, tool];
    setValue('currentTools', updated);
  };

  const submit = async () => {
    setStatus('sending');
    try {
      // Documento completo para Firestore con timestamp estándar y serverTimestamp
      await saveDocument(COLLECTION, {
        businessName: values.businessName.trim(),
        rucOrLegal: values.rucOrLegal.trim() || null,
        decisionMaker: values.decisionMaker.trim(),
        contact: values.contact.trim(),
        socialLinks: values.socialLinks.trim() || null,
        driveFolder: values.driveFolder.trim() || null,
        starProduct: values.starProduct.trim(),
        avgTicket: values.avgTicket,
        weeklyVolume: values.weeklyVolume,
        mainChannel: values.mainChannel,
        currentTools: values.currentTools,
        toolsOther: values.toolsOther.trim() || null,
        bottleneckProcess: values.bottleneckProcess.trim(),
        primaryGoal: values.primaryGoal,
        goalDetail: values.goalDetail.trim(),
        privacyConsent: true,
        privacyPolicyVersion: COMPANY.lastUpdated,
        timestamp: new Date().toISOString(),
        domain: COMPANY.domain || 'wearezenda.com',
        source: 'portal-client-onboarding',
      });
      setStatus('done');
    } catch (error) {
      console.warn('[Zenda] Error al guardar onboarding en Firestore:', error);
      setStatus('error');
    }
  };

  const goNext = () => {
    if (sending) return;
    const nextErrors = validateStep(step, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === lastStep) {
      submit();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (sending || step === 0) return;
    setErrors({});
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    goNext();
  };

  // Mensaje prellenado para WhatsApp al finalizar con éxito
  const bottleneckSummary = values.bottleneckProcess.trim().slice(0, 140);
  const whatsappNotificationText = [
    '🚨 Nuevo Onboarding completado en Zenda:',
    `- Negocio: ${values.businessName.trim()}`,
    `- Decisor: ${values.decisionMaker.trim()}`,
    `- Contacto: ${values.contact.trim()}`,
    `- Ticket: ${values.avgTicket}`,
    `- Cuello de botella: ${bottleneckSummary}`,
  ].join('\n');

  const whatsappNotificationUrl = buildWhatsAppLink(whatsappNotificationText);

  // Mensaje de respaldo en caso de fallo de red
  const fallbackMessage = [
    `Hola Zenda, soy ${values.decisionMaker.trim()} de ${values.businessName.trim()}.`,
    'Completé el formulario de onboarding en wearezenda.com. Te comparto los datos:',
    `• Decisor y contacto: ${values.decisionMaker.trim()} (${values.contact.trim()})`,
    values.socialLinks.trim() ? `• Redes / Web: ${values.socialLinks.trim()}` : null,
    `• Producto estrella: ${values.starProduct.trim()}`,
    `• Ticket promedio: ${values.avgTicket}`,
    `• Cuello de botella: ${values.bottleneckProcess.trim()}`,
    `• Meta a 90 días: ${values.primaryGoal} - ${values.goalDetail.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');

  const slideAnimation = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 40, filter: 'blur(4px)' },
        animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, x: direction * -40, filter: 'blur(4px)' },
      };

  const renderStepFields = () => {
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div>
            <label htmlFor="businessName" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Nombre comercial de la marca <span className="text-zenda-cyan">*</span>
            </label>
            <input
              id="businessName"
              type="text"
              placeholder="Ej. Dolciangel, Studio Moda, Valkiria SAC"
              value={values.businessName}
              onChange={onText('businessName')}
              className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none ${
                errors.businessName
                  ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-white/10 hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan'
              }`}
            />
            {errors.businessName && (
              <p className="mt-1.5 text-xs font-medium text-red-400">{errors.businessName}</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rucOrLegal" className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                RUC o Razón Social
              </label>
              <span className="text-[11px] font-mono text-neutral-400">Opcional</span>
            </div>
            <input
              id="rucOrLegal"
              type="text"
              placeholder="Ej. 20601234567 o Empresa SAC"
              value={values.rucOrLegal}
              onChange={onText('rucOrLegal')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="decisionMaker" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Decisor Principal <span className="text-zenda-cyan">*</span>
              </label>
              <input
                id="decisionMaker"
                type="text"
                placeholder="Nombre completo y cargo"
                value={values.decisionMaker}
                onChange={onText('decisionMaker')}
                className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none ${
                  errors.decisionMaker
                    ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-white/10 hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan'
                }`}
              />
              {errors.decisionMaker && (
                <p className="mt-1.5 text-xs font-medium text-red-400">{errors.decisionMaker}</p>
              )}
            </div>

            <div>
              <label htmlFor="contact" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
                WhatsApp o teléfono directo <span className="text-zenda-cyan">*</span>
              </label>
              <input
                id="contact"
                type="tel"
                placeholder="+51 999 999 999"
                value={values.contact}
                onChange={onText('contact')}
                className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none ${
                  errors.contact
                    ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-white/10 hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan'
                }`}
              />
              {errors.contact && (
                <p className="mt-1.5 text-xs font-medium text-red-400">{errors.contact}</p>
              )}
            </div>
          </div>

          {/* Enlaces a redes o web: COMPLETAMENTE OPCIONAL */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="socialLinks" className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Enlaces a Redes Sociales o Sitio Web
              </label>
              <span className="text-[11px] font-mono text-neutral-400">Opcional</span>
            </div>
            <input
              id="socialLinks"
              type="text"
              placeholder="https://instagram.com/tumarca, tiktok.com/@tumarca, miweb.com"
              value={values.socialLinks}
              onChange={onText('socialLinks')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan"
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              Auditaremos tu presencia visual, tiempo de respuesta y tráfico orgánico actual si cuentas con ellos.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="driveFolder" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zenda-cyan">
                <FolderGit2 className="h-4 w-4" />
                Carpeta de Drive con recursos de marca
              </label>
              <span className="text-[11px] font-mono text-neutral-400">Recomendado</span>
            </div>
            <input
              id="driveFolder"
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={values.driveFolder}
              onChange={onText('driveFolder')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan"
            />
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              Pega el enlace a la carpeta con tus logos en alta resolución, fotos de producto o manual de identidad (asegúrate de que tenga permiso de lectura).
            </p>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-8">
          <div>
            <label htmlFor="starProduct" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Producto o Servicio Estrella <span className="text-zenda-cyan">*</span>
            </label>
            <input
              id="starProduct"
              type="text"
              placeholder="Ej. Menú degustación, pack de zapatillas, consultoría premium, suscripción mensual"
              value={values.starProduct}
              onChange={onText('starProduct')}
              className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none ${
                errors.starProduct
                  ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-white/10 hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan'
              }`}
            />
            {errors.starProduct ? (
              <p className="mt-1.5 text-xs font-medium text-red-400">{errors.starProduct}</p>
            ) : (
              <p className="mt-1.5 text-xs text-neutral-400">
                El producto o servicio que genera el mayor volumen de facturación o el que más te interesa escalar.
              </p>
            )}
          </div>

          <div>
            <label className="mb-3 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Ticket Promedio (en Soles) <span className="text-zenda-cyan">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TICKETS.map((t) => {
                const isSelected = values.avgTicket === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('avgTicket', t)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-zenda-cyan bg-zenda-cyan/10 font-semibold text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                        : 'border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/25 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{t}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-zenda-cyan" />}
                  </button>
                );
              })}
            </div>
            {errors.avgTicket && (
              <p className="mt-2 text-xs font-medium text-red-400">{errors.avgTicket}</p>
            )}
          </div>

          <div>
            <label className="mb-3 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Volumen Semanal Aproximado <span className="text-zenda-cyan">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {VOLUMES.map((v) => {
                const isSelected = values.weeklyVolume === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue('weeklyVolume', v)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-zenda-cyan bg-zenda-cyan/10 font-semibold text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                        : 'border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/25 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{v}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-zenda-cyan" />}
                  </button>
                );
              })}
            </div>
            {errors.weeklyVolume && (
              <p className="mt-2 text-xs font-medium text-red-400">{errors.weeklyVolume}</p>
            )}
          </div>

          <div>
            <label className="mb-3 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Canal Principal de Atención al Cliente <span className="text-zenda-cyan">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CHANNELS.map(({ value, label, icon: Icon }) => {
                const isSelected = values.mainChannel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('mainChannel', value)}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-zenda-cyan bg-zenda-cyan/10 text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                        : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/25 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-zenda-cyan' : 'text-neutral-500'}`} />
                    <span className="mt-2 text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            {errors.mainChannel && (
              <p className="mt-2 text-xs font-medium text-red-400">{errors.mainChannel}</p>
            )}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-8">
          <div>
            <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Herramientas que utilizas actualmente en tu operación <span className="text-zenda-cyan">*</span>
            </label>
            <p className="mb-4 text-xs text-neutral-400">
              Selecciona todas las que apliquen para saber con qué sistemas debemos integrarnos.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {TOOLS_LIST.map((tool) => {
                const active = values.currentTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTool(tool)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                      active
                        ? 'border-zenda-cyan bg-zenda-cyan/15 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.18)]'
                        : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                    }`}
                  >
                    {tool} {active && '✓'}
                  </button>
                );
              })}
            </div>
            {errors.currentTools && (
              <p className="mt-2 text-xs font-medium text-red-400">{errors.currentTools}</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="toolsOther" className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Otras herramientas específicas o software propio
              </label>
              <span className="text-[11px] font-mono text-neutral-400">Opcional</span>
            </div>
            <input
              id="toolsOther"
              type="text"
              placeholder="Ej. Notion, Odoo, Mailchimp, sistema a medida en PHP..."
              value={values.toolsOther}
              onChange={onText('toolsOther')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all outline-none hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan"
            />
          </div>

          <div>
            <label htmlFor="bottleneckProcess" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
              ¿Qué proceso manual les genera mayores pérdidas u horas desperdiciadas? <span className="text-zenda-cyan">*</span>
            </label>
            <textarea
              id="bottleneckProcess"
              rows={4}
              placeholder="Ej. Nos demoramos más de 30 minutos en responder WhatsApp, pasamos los datos a mano a Excel al cerrar el día, o perdemos prospectos porque no hay un sistema de seguimiento automatizado..."
              value={values.bottleneckProcess}
              onChange={onText('bottleneckProcess')}
              className={`w-full rounded-xl border bg-white/[0.03] p-4 text-base text-white placeholder:text-neutral-500 transition-all outline-none ${
                errors.bottleneckProcess
                  ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-white/10 hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan'
              }`}
            />
            {errors.bottleneckProcess ? (
              <p className="mt-1.5 text-xs font-medium text-red-400">{errors.bottleneckProcess}</p>
            ) : (
              <p className="mt-1.5 text-xs text-neutral-400">
                Sé totalmente transparente: esta respuesta definirá la primera automatización prioritaria que implementaremos.
              </p>
            )}
          </div>
        </div>
      );
    }

    // Paso 4: Objetivos a 90 días
    return (
      <div className="space-y-8">
        <div>
          <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
            Meta Comercial Prioritaria <span className="text-zenda-cyan">*</span>
          </label>
          <p className="mb-4 text-xs text-neutral-400">
            Elige el resultado clave que transformaría tu negocio en los próximos tres meses.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GOAL_OPTIONS.map(({ value, title, description, icon: Icon }) => {
              const isSelected = values.primaryGoal === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('primaryGoal', value)}
                  className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                    isSelected
                      ? 'border-zenda-cyan bg-zenda-cyan/[0.08] text-white shadow-[0_0_20px_rgba(0,229,255,0.18)]'
                      : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/25 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      isSelected
                        ? 'border-zenda-cyan/40 bg-zenda-cyan/20 text-zenda-cyan'
                        : 'border-white/10 bg-white/[0.03] text-neutral-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-zenda-cyan" />}
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{description}</p>
                </button>
              );
            })}
          </div>
          {errors.primaryGoal && (
            <p className="mt-2 text-xs font-medium text-red-400">{errors.primaryGoal}</p>
          )}
        </div>

        <div>
          <label htmlFor="goalDetail" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
            Detalle de la meta cuantificable <span className="text-zenda-cyan">*</span>
          </label>
          <textarea
            id="goalDetail"
            rows={3}
            placeholder="Ej. Duplicar prospectos calificados semanales y responder al 100% de consultas en WhatsApp en menos de 2 minutos sin contratar más personal."
            value={values.goalDetail}
            onChange={onText('goalDetail')}
            className={`w-full rounded-xl border bg-white/[0.03] p-4 text-base text-white placeholder:text-neutral-500 transition-all outline-none ${
              errors.goalDetail
                ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-white/10 hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan'
            }`}
          />
          {errors.goalDetail && (
            <p className="mt-1.5 text-xs font-medium text-red-400">{errors.goalDetail}</p>
          )}
        </div>

        {/* Consentimiento legal */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={values.consent}
              onChange={(e) => setValue('consent', e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-zenda-cyan focus:ring-zenda-cyan focus:ring-offset-0"
            />
            <span className="text-xs leading-relaxed text-neutral-400">
              He leído y acepto los{' '}
              <Link to="/terminos" target="_blank" className="text-white underline underline-offset-4 hover:text-zenda-cyan">
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" target="_blank" className="text-white underline underline-offset-4 hover:text-zenda-cyan">
                Política de Privacidad
              </Link>{' '}
              de wearezenda.com, autorizando el tratamiento confidencial de datos para la auditoría técnica y prestación del servicio.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-2.5 text-xs font-medium text-red-400">{errors.consent}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#080B11] font-sans text-neutral-100 antialiased selection:bg-zenda-cyan selection:text-black">
      {/* Luces ambientales tenues estilo Linear */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/2 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zenda-blue/20 via-zenda-cyan/10 to-transparent blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-zenda-blue/15 blur-[160px]"
      />

      {/* Barra de progreso superior animada */}
      <div
        role="progressbar"
        aria-label="Progreso del onboarding"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="fixed inset-x-0 top-0 z-50 h-[3px] bg-white/5"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-zenda-blue via-zenda-cyan to-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.7)]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
        />
      </div>

      {/* Cabecera minimalista oscura */}
      <header className="relative z-40 mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
        <Link to="/" aria-label="Zenda — inicio" className="group inline-flex items-center gap-2.5">
          <img
            src="/isotipo-zenda.png"
            alt="Zenda"
            className="h-6 w-auto object-contain brightness-110 drop-shadow-[0_0_12px_rgba(0,229,255,0.35)]"
          />
          <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-zenda-cyan">
            zenda
          </span>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-neutral-400 sm:inline">
            portal clientes
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {status !== 'done' && (
            <span className="font-mono text-xs text-neutral-400">
              <span className="text-zenda-cyan">{STEPS[step].stepNumber}</span> / {STEPS.length}
            </span>
          )}
          <a
            href={buildWhatsAppLink('Hola Zenda, tengo una consulta sobre el portal de onboarding.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-neutral-300 transition-all hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5 text-zenda-cyan" />
            <span className="hidden sm:inline">¿Dudas?</span> Soporte
          </a>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-30 mx-auto flex max-w-3xl flex-1 flex-col px-6 py-8 sm:py-14">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'done' ? (
            /* Pantalla de Confirmación Ejecutiva */
            <motion.div
              key="done-view"
              {...slideAnimation}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
              role="status"
              className="my-auto"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-zenda-cyan/30 bg-zenda-cyan/10 px-3.5 py-1 text-xs font-mono font-medium text-zenda-cyan shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                AUDITORÍA Y ONBOARDING REGISTRADO
              </div>

              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-5 text-3xl font-extrabold tracking-tight text-white outline-none sm:text-5xl"
              >
                ¡Ficha de onboarding recibida con éxito!
              </h1>

              <p className="mt-4 text-base leading-relaxed text-neutral-300 sm:text-lg">
                La información de <strong className="font-semibold text-white">{values.businessName}</strong> ha sido
                recibida por el equipo de ingeniería y estrategia de Zenda. Ya estamos analizando los cuellos de botella
                para estructurar tu hoja de ruta.
              </p>

              {/* Resumen Ejecutivo */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
                <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  Resumen de la auditoría técnica
                </h2>
                <dl className="mt-4 divide-y divide-white/5 text-sm">
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <dt className="font-mono text-xs text-neutral-400">Decisor:</dt>
                    <dd className="col-span-2 font-medium text-white">{values.decisionMaker} ({values.contact})</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <dt className="font-mono text-xs text-neutral-400">Producto estrella:</dt>
                    <dd className="col-span-2 text-neutral-200">{values.starProduct}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <dt className="font-mono text-xs text-neutral-400">Ticket promedio:</dt>
                    <dd className="col-span-2 text-neutral-200">{values.avgTicket}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <dt className="font-mono text-xs text-neutral-400">Canal & Volumen:</dt>
                    <dd className="col-span-2 text-neutral-200">{values.mainChannel} · {values.weeklyVolume}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <dt className="font-mono text-xs text-neutral-400">Meta a 90 días:</dt>
                    <dd className="col-span-2 font-medium text-zenda-cyan">{values.primaryGoal}</dd>
                  </div>
                  {values.socialLinks && (
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <dt className="font-mono text-xs text-neutral-400">Redes / Web:</dt>
                      <dd className="col-span-2 truncate text-neutral-300">{values.socialLinks}</dd>
                    </div>
                  )}
                  {values.driveFolder && (
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <dt className="font-mono text-xs text-neutral-400">Carpeta Drive:</dt>
                      <dd className="col-span-2 truncate text-neutral-300">
                        <a
                          href={values.driveFolder}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-white"
                        >
                          {values.driveFolder}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Botón directo obligatorio: Notificar al equipo de Zenda por WhatsApp */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href={whatsappNotificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-sm font-bold text-neutral-950 shadow-[0_0_30px_rgba(37,211,102,0.35)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#20bd5a] hover:shadow-[0_0_40px_rgba(37,211,102,0.5)] active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  Notificar al equipo por WhatsApp
                </a>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-neutral-300 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Volver a wearezenda.com
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Flujo Paso a Paso */
            <motion.form
              key={`step-${step}`}
              {...slideAnimation}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
              onSubmit={handleSubmit}
              noValidate
              className="my-auto"
            >
              {/* Monospace Step Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zenda-cyan shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                Paso {STEPS[step].stepNumber} de {STEPS.length} · {STEPS[step].label}
              </div>

              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-4 text-2xl font-bold tracking-tight text-white outline-none sm:text-4xl"
              >
                {STEPS[step].title}
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-neutral-400 sm:text-base">
                {STEPS[step].subtitle}
              </p>

              {/* Campos dinámicos */}
              <fieldset disabled={sending} className="mt-8 sm:mt-10">
                {renderStepFields()}
              </fieldset>

              {/* Error state alert */}
              {status === 'error' && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-white">Hubo un problema de conexión al guardar.</p>
                    <p className="mt-1 leading-relaxed">
                      Revisa tu conexión o envía la información directamente por WhatsApp con un solo clic:{' '}
                      <a
                        href={buildWhatsAppLink(fallbackMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-zenda-cyan underline underline-offset-4"
                      >
                        Enviar ficha por WhatsApp
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Controles de navegación */}
              <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={sending || step === 0}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-neutral-400 transition-colors hover:text-white disabled:invisible`}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </button>

                <div className="flex items-center gap-4">
                  <span className="hidden text-xs text-neutral-400 md:inline font-mono">
                    Presiona <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-neutral-300">Enter ↵</kbd>
                  </span>

                  <button
                    type="submit"
                    disabled={sending}
                    className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-zenda-cyan to-cyan-300 px-7 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : step === lastStep ? (
                      <>
                        {status === 'error' ? 'Reintentar Envío' : 'Completar Onboarding'}
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
