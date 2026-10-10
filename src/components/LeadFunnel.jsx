import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Loader2,
  Megaphone,
  Workflow,
} from 'lucide-react';
import ScrollReveal from './ScrollReveal.jsx';

const BOTTLENECKS = [
  {
    value: 'marketing',
    label: 'Necesito más clientes y visibilidad',
    hint: 'Marketing',
    icon: Megaphone,
  },
  {
    value: 'operacion',
    label: 'Tengo clientes pero la operación interna colapsa',
    hint: 'Software / Automatización',
    icon: Workflow,
  },
  {
    value: 'ambos',
    label: 'Ambos: escalar ventas y ordenar mi operación',
    hint: 'Marketing + Software',
    icon: Layers,
  },
];

const BUDGETS = [
  'Menos de US$ 500',
  'US$ 500 – 1,000',
  'US$ 1,000 – 3,000',
  'US$ 3,000 – 5,000',
  'Más de US$ 5,000',
  'Aún no lo tengo definido',
];

const INITIAL_VALUES = {
  name: '',
  business: '',
  industry: '',
  whatsapp: '+51 ',
  bottleneck: '',
  budget: '',
};

const REQUIRED_MESSAGE = 'Este campo es obligatorio.';

/** Número de respaldo (solo dígitos, con código de país) si VITE_WHATSAPP_NUMBER no está definido. */
const FALLBACK_WHATSAPP_NUMBER = '51904610510';

const inputClasses =
  'block w-full rounded-xl border bg-white px-4 py-3.5 text-base text-zenda-dark placeholder:text-neutral-400 transition-colors focus:border-zenda-dark focus:outline-none focus:ring-2 focus:ring-zenda-cyan/40';

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = REQUIRED_MESSAGE;
  if (!values.business.trim()) errors.business = REQUIRED_MESSAGE;
  if (!values.industry.trim()) errors.industry = REQUIRED_MESSAGE;

  const digits = values.whatsapp.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    errors.whatsapp = 'Ingresa un número válido con código de país (ej. +51 999 999 999).';
  }

  if (!values.bottleneck) errors.bottleneck = 'Elige la opción que mejor te describe.';
  if (!values.budget) errors.budget = 'Selecciona un rango estimado.';
  return errors;
}

function buildWhatsAppUrl(values, caseInterest = '') {
  const bottleneck = BOTTLENECKS.find((b) => b.value === values.bottleneck);
  const message = [
    `Hola, soy ${values.name.trim()} de ${values.business.trim()} (${values.industry.trim()}).`,
    'Acabo de completar el diagnóstico en la web de Zenda.',
    '',
    `• Principal cuello de botella: ${bottleneck ? bottleneck.label : '-'}`,
    `• Presupuesto mensual estimado: ${values.budget}`,
    `• WhatsApp de contacto: ${values.whatsapp.trim()}`,
    ...(caseInterest ? [`• Caso que me interesó: ${caseInterest}`] : []),
    '',
    'Me gustaría conversar con un consultor.',
  ].join('\n');

  const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  const cleanNumber =
    String(rawNumber || '').replace(/\D/g, '') || FALLBACK_WHATSAPP_NUMBER;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/** Simula la latencia de red cuando Firebase aún no está configurado (solo desarrollo). */
const simulateSave = () => new Promise((resolve) => setTimeout(resolve, 900));

/** Tiempo máximo de espera al guardar el lead antes de continuar a WhatsApp. */
const SAVE_TIMEOUT_MS = 6000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tiempo de espera agotado (${ms} ms).`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-zenda-dark">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SuccessScreen({ values, caseInterest, onReset }) {
  const whatsappUrl = useMemo(() => buildWhatsAppUrl(values, caseInterest), [values, caseInterest]);

  useEffect(() => {
    console.log('WhatsApp URL generada:', whatsappUrl);
  }, [whatsappUrl]);

  return (
    <div className="flex flex-col items-center py-8 text-center" role="status">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zenda-cyan/15 text-zenda-blue">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h3 className="mt-6 text-2xl font-bold tracking-tight text-zenda-dark">
        ¡Diagnóstico recibido!
      </h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-neutral-600">
        Gracias, {values.name.trim().split(' ')[0]}. Ya tenemos la información de{' '}
        {values.business.trim()}. Para avanzar más rápido, continúa la conversación directamente
        con un consultor.
      </p>

      {/* <a> nativo: un clic del usuario nunca es bloqueado por el bloqueador de pop-ups. */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-zenda-dark px-8 py-4 text-base font-bold text-white shadow-lg ring-2 ring-zenda-dark transition-all duration-300 hover:scale-[1.02] hover:bg-zenda-blue hover:ring-zenda-blue active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-zenda-cyan"
      >
        Continuar por WhatsApp ↗
      </a>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 text-sm font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-zenda-dark hover:underline"
      >
        Enviar otro diagnóstico
      </button>
    </div>
  );
}

export default function LeadFunnel() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success
  const [caseInterest, setCaseInterest] = useState('');

  useEffect(() => {
    const onCaseInterest = (event) => {
      const { title, bottleneck } = event.detail || {};
      if (title) setCaseInterest(title);
      if (bottleneck) {
        setValues((prev) => (prev.bottleneck ? prev : { ...prev, bottleneck }));
      }
      setStatus((prev) => (prev === 'success' ? 'idle' : prev));
    };
    window.addEventListener('zenda:case-interest', onCaseInterest);
    return () => window.removeEventListener('zenda:case-interest', onCaseInterest);
  }, []);

  const sending = status === 'sending';

  const setField = (name) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('sending');

    // A prueba de fallos: guardar el lead es "mejor esfuerzo". Cualquier error
    // (Firestore sin inicializar, credenciales, reglas, red, timeout) solo se
    // registra y el usuario siempre llega a la pantalla de éxito con su enlace
    // a WhatsApp.
    try {
      // Firebase se carga bajo demanda para mantener liviano el bundle inicial.
      const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([
        import('../firebase.js'),
        import('firebase/firestore'),
      ]);

      if (db) {
        // addDoc puede quedarse esperando indefinidamente sin red: se limita la espera.
        await withTimeout(
          addDoc(collection(db, 'leads'), {
            name: values.name.trim(),
            business: values.business.trim(),
            industry: values.industry.trim(),
            whatsapp: values.whatsapp.trim(),
            bottleneck: values.bottleneck,
            budget: values.budget,
            interestedCase: caseInterest || null,
            source: 'web-zenda',
            createdAt: serverTimestamp(),
          }),
          SAVE_TIMEOUT_MS,
        );
      } else if (import.meta.env.DEV) {
        await simulateSave();
        console.info('[Zenda] Lead simulado (Firebase no configurado):', values);
      } else {
        console.warn('[Zenda] Firestore no está inicializado; el lead no se guardó.');
      }
    } catch (error) {
      console.warn('[Zenda] No se pudo guardar el lead (se continúa a WhatsApp):', error);
    }

    setStatus('success');
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setCaseInterest('');
    setStatus('idle');
  };

  const borderFor = (name) => (errors[name] ? 'border-red-400' : 'border-neutral-200');
  const a11yFor = (name) => ({
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <section id="contacto" className="border-t border-neutral-100 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="overflow-hidden rounded-3xl border border-neutral-200 bg-gray-50/70 p-6 shadow-elevated sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Encabezado */}
            <div className="lg:col-span-2">
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
                Iniciar proyecto
              </p>
              <h2 className="text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl">
                Construyamos la infraestructura que tu marca necesita.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cuéntanos sobre tu negocio y te presentaremos un plan táctico de marketing y
                automatización.
              </p>
            </div>

            {/* Formulario */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
                {status === 'success' ? (
                  <SuccessScreen values={values} caseInterest={caseInterest} onReset={handleReset} />
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {caseInterest && (
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-zenda-cyan/40 bg-zenda-cyan/10 px-4 py-3 text-sm text-zenda-dark">
                        <p>
                          <span className="font-semibold">Caso de interés:</span> {caseInterest}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCaseInterest('')}
                          aria-label="Quitar caso de interés"
                          className="shrink-0 text-neutral-500 transition-colors hover:text-zenda-dark"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <Field id="name" label="Nombre y apellido" error={errors.name}>
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Ej. María Torres"
                        value={values.name}
                        onChange={setField('name')}
                        disabled={sending}
                        className={`${inputClasses} ${borderFor('name')}`}
                        {...a11yFor('name')}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Field id="business" label="Negocio / marca" error={errors.business}>
                        <input
                          id="business"
                          type="text"
                          autoComplete="organization"
                          placeholder="Ej. Dulce Aurora"
                          value={values.business}
                          onChange={setField('business')}
                          disabled={sending}
                          className={`${inputClasses} ${borderFor('business')}`}
                          {...a11yFor('business')}
                        />
                      </Field>
                      <Field id="industry" label="Rubro" error={errors.industry}>
                        <input
                          id="industry"
                          type="text"
                          placeholder="Ej. Pastelería, retail…"
                          value={values.industry}
                          onChange={setField('industry')}
                          disabled={sending}
                          className={`${inputClasses} ${borderFor('industry')}`}
                          {...a11yFor('industry')}
                        />
                      </Field>
                    </div>

                    <Field id="whatsapp" label="WhatsApp de contacto" error={errors.whatsapp}>
                      <input
                        id="whatsapp"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+51 999 999 999"
                        value={values.whatsapp}
                        onChange={setField('whatsapp')}
                        disabled={sending}
                        className={`${inputClasses} ${borderFor('whatsapp')}`}
                        {...a11yFor('whatsapp')}
                      />
                    </Field>

                    <fieldset
                      disabled={sending}
                      aria-describedby={errors.bottleneck ? 'bottleneck-error' : undefined}
                    >
                      <legend className="mb-3 text-sm font-medium text-zenda-dark">
                        ¿Cuál es tu principal cuello de botella hoy?
                      </legend>
                      <div className="space-y-3">
                        {BOTTLENECKS.map(({ value, label, hint, icon: Icon }) => (
                          <label key={value} className="relative block cursor-pointer">
                            <input
                              type="radio"
                              name="bottleneck"
                              value={value}
                              checked={values.bottleneck === value}
                              onChange={setField('bottleneck')}
                              className="peer sr-only"
                            />
                            <span className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400 peer-checked:border-zenda-dark peer-checked:bg-gray-50 peer-checked:ring-1 peer-checked:ring-zenda-dark peer-focus-visible:ring-2 peer-focus-visible:ring-zenda-cyan">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-zenda-blue">
                                <Icon className="h-5 w-5" strokeWidth={1.75} />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-zenda-dark">
                                  {label}
                                </span>
                                <span className="mt-0.5 block text-xs text-neutral-500">
                                  {hint}
                                </span>
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.bottleneck && (
                        <p id="bottleneck-error" className="mt-1.5 text-sm text-red-600">
                          {errors.bottleneck}
                        </p>
                      )}
                    </fieldset>

                    <Field
                      id="budget"
                      label="Presupuesto mensual estimado para crecimiento"
                      error={errors.budget}
                    >
                      <select
                        id="budget"
                        value={values.budget}
                        onChange={setField('budget')}
                        disabled={sending}
                        className={`${inputClasses} ${borderFor('budget')}`}
                        {...a11yFor('budget')}
                      >
                        <option value="" disabled>
                          Selecciona un rango
                        </option>
                        {BUDGETS.map((budget) => (
                          <option key={budget} value={budget}>
                            {budget}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <button
                      type="submit"
                      disabled={sending}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-zenda-dark px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zenda-blue hover:shadow-lg hover:shadow-zenda-blue/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:opacity-80 disabled:hover:bg-zenda-dark disabled:hover:shadow-none"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Enviando diagnóstico...
                        </>
                      ) : (
                        <>
                          Solicitar diagnóstico
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zenda-cyan" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
