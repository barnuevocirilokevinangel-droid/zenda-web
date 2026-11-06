import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Checkbox,
  Field,
  OptionCards,
  SelectInput,
  TextArea,
  TextInput,
} from '../../components/forms/FormFields.jsx';
import { COMPANY } from '../../config/company.js';
import { saveDocument } from '../../lib/saveDocument.js';
import usePageMeta from '../../lib/usePageMeta.js';
import { buildWhatsAppLink } from '../../lib/whatsapp.js';
import LegalLayout, { ContactList, LegalSection, ProviderIdentity } from './LegalLayout.jsx';

const COLLECTION = 'reclamaciones';
const REQUIRED = 'Este campo es obligatorio.';
const DOC_TYPES = ['DNI', 'Carné de extranjería', 'Pasaporte', 'RUC'];

const GOOD_TYPES = [
  { value: 'Producto', title: 'Producto', description: 'Bien o entregable tangible o digital.' },
  { value: 'Servicio', title: 'Servicio', description: 'Prestación de servicios de Zenda.' },
];

const CLAIM_TYPES = [
  {
    value: 'Reclamo',
    title: 'Reclamo',
    description: 'Disconformidad relacionada con los productos o servicios.',
  },
  {
    value: 'Queja',
    title: 'Queja',
    description: 'Malestar respecto a la atención al público, no vinculado al servicio.',
  },
];

const INITIAL_VALUES = {
  fullName: '',
  docType: 'DNI',
  docNumber: '',
  address: '',
  phone: '',
  email: '',
  isMinor: false,
  guardianName: '',
  goodType: '',
  amount: '',
  description: '',
  claimType: '',
  detail: '',
  request: '',
  consent: false,
};

function validate(v) {
  const errors = {};
  const required = ['fullName', 'address', 'description', 'detail', 'request'];
  required.forEach((key) => {
    if (!String(v[key]).trim()) errors[key] = REQUIRED;
  });

  const doc = v.docNumber.trim();
  if (!doc) errors.docNumber = REQUIRED;
  else if (v.docType === 'DNI' && !/^\d{8}$/.test(doc)) errors.docNumber = 'El DNI debe tener 8 dígitos.';
  else if (v.docType === 'RUC' && !/^\d{11}$/.test(doc)) errors.docNumber = 'El RUC debe tener 11 dígitos.';
  else if (doc.length < 6) errors.docNumber = 'Ingresa un número de documento válido.';

  if (v.phone.replace(/\D/g, '').length < 7) errors.phone = 'Ingresa un teléfono válido.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = 'Ingresa un correo electrónico válido.';
  if (v.isMinor && !v.guardianName.trim()) errors.guardianName = 'Indica el nombre del padre, madre o tutor.';
  if (!v.goodType) errors.goodType = 'Indica si se trata de un producto o un servicio.';
  if (!v.claimType) errors.claimType = 'Indica si presentas un reclamo o una queja.';
  if (!v.consent) errors.consent = 'Debes aceptar el tratamiento de tus datos para registrar la hoja.';
  return errors;
}

function generateReference() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REC-${new Date().getFullYear()}-${random}`;
}

const todayLabel = () =>
  new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

function FormBlock({ title, children }) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 p-6 sm:p-8">
      <legend className="px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zenda-blue">
        {title}
      </legend>
      <div className="space-y-6">{children}</div>
    </fieldset>
  );
}

export default function Reclamaciones() {
  usePageMeta({ title: 'Libro de Reclamaciones | Zenda' });

  const reference = useRef(generateReference());
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | error | done
  const [submittedAt, setSubmittedAt] = useState('');

  const sending = status === 'sending';

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const onText = (name) => (event) => setValue(name, event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    setStatus('sending');
    try {
      await saveDocument(COLLECTION, {
        referenceCode: reference.current,
        consumer: {
          fullName: values.fullName.trim(),
          docType: values.docType,
          docNumber: values.docNumber.trim(),
          address: values.address.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          isMinor: values.isMinor,
          guardianName: values.isMinor ? values.guardianName.trim() : null,
        },
        good: {
          type: values.goodType,
          amount: values.amount.trim() || null,
          description: values.description.trim(),
        },
        claim: {
          type: values.claimType,
          detail: values.detail.trim(),
          request: values.request.trim(),
        },
        provider: {
          legalName: COMPANY.legalName || COMPANY.brand,
          ruc: COMPANY.ruc || null,
          address: COMPANY.address || null,
        },
        privacyConsent: true,
        status: 'pendiente',
        providerResponse: null,
        source: 'web-zenda-reclamaciones',
      });
      setSubmittedAt(todayLabel());
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.warn('[Zenda] No se pudo registrar la hoja de reclamación:', error);
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <LegalLayout
        eyebrow="Libro de Reclamaciones"
        title="Hoja de Reclamación registrada"
        intro="Hemos recibido tu hoja de reclamación. Conserva el código de referencia para cualquier seguimiento."
      >
        <div role="status" className="rounded-2xl border border-zenda-cyan/40 bg-zenda-cyan/10 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-zenda-blue" />
            <p className="text-sm font-medium text-zenda-dark">Registro exitoso · {submittedAt}</p>
          </div>
          <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-zenda-dark">
            {reference.current}
          </p>
        </div>

        <LegalSection title="Resumen de tu hoja">
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
            {[
              ['Consumidor', `${values.fullName.trim()} · ${values.docType} ${values.docNumber.trim()}`],
              ['Contacto', `${values.email.trim()} · ${values.phone.trim()}`],
              ['Bien contratado', `${values.goodType}${values.amount.trim() ? ` · ${values.amount.trim()}` : ''}`],
              ['Tipo', values.claimType],
              ['Pedido del consumidor', values.request.trim()],
            ].map(([term, detail]) => (
              <div key={term} className="grid grid-cols-3 gap-4 px-5 py-3.5">
                <dt className="font-medium text-neutral-500">{term}</dt>
                <dd className="col-span-2 text-zenda-dark">{detail}</dd>
              </div>
            ))}
          </dl>
        </LegalSection>

        <LegalSection title="¿Qué sigue?">
          <p>
            Zenda atenderá tu {values.claimType.toLowerCase()} y te responderá por el medio de contacto
            que registraste, dentro del plazo máximo de quince (15) días hábiles contados desde el día
            siguiente de presentada la hoja. Puedes guardar una copia de esta página.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zenda-dark px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zenda-blue active:scale-[0.98]"
            >
              <Printer className="h-4 w-4 text-zenda-cyan" />
              Imprimir / guardar copia
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-3.5 text-sm font-semibold text-zenda-dark transition-colors hover:border-zenda-dark"
            >
              Volver al inicio
            </Link>
          </div>
        </LegalSection>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      eyebrow="Libro de Reclamaciones"
      title="Libro de Reclamaciones"
      intro="Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y su reglamento, puedes registrar aquí un reclamo o una queja sobre nuestros servicios."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-sm leading-relaxed text-neutral-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-zenda-dark">
            Hoja de Reclamación
          </p>
          <p className="font-mono text-xs text-neutral-500">
            N.º {reference.current} · {todayLabel()}
          </p>
        </div>
        <p className="mt-3">
          <span className="font-medium text-zenda-dark">Proveedor:</span> <ProviderIdentity />
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <FormBlock title="1. Identificación del consumidor reclamante">
          <Field id="fullName" label="Nombre completo" error={errors.fullName}>
            <TextInput
              id="fullName"
              autoComplete="name"
              value={values.fullName}
              onChange={onText('fullName')}
              error={errors.fullName}
            />
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Field id="docType" label="Tipo de documento">
              <SelectInput
                id="docType"
                placeholder="Selecciona"
                options={DOC_TYPES}
                value={values.docType}
                onChange={onText('docType')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="docNumber" label="Número de documento" error={errors.docNumber}>
                <TextInput
                  id="docNumber"
                  inputMode="numeric"
                  value={values.docNumber}
                  onChange={onText('docNumber')}
                  error={errors.docNumber}
                />
              </Field>
            </div>
          </div>
          <Field id="address" label="Domicilio" error={errors.address}>
            <TextInput
              id="address"
              autoComplete="street-address"
              value={values.address}
              onChange={onText('address')}
              error={errors.address}
            />
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field id="phone" label="Teléfono" error={errors.phone}>
              <TextInput
                id="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={onText('phone')}
                error={errors.phone}
              />
            </Field>
            <Field id="email" label="Correo electrónico" error={errors.email}>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={onText('email')}
                error={errors.email}
              />
            </Field>
          </div>
          <Checkbox
            id="isMinor"
            checked={values.isMinor}
            onChange={(checked) => setValue('isMinor', checked)}
          >
            El consumidor es menor de edad.
          </Checkbox>
          {values.isMinor && (
            <Field id="guardianName" label="Padre, madre o tutor" error={errors.guardianName}>
              <TextInput
                id="guardianName"
                value={values.guardianName}
                onChange={onText('guardianName')}
                error={errors.guardianName}
              />
            </Field>
          )}
        </FormBlock>

        <FormBlock title="2. Identificación del bien contratado">
          <OptionCards
            legend="Tipo de bien"
            name="goodType"
            options={GOOD_TYPES}
            value={values.goodType}
            onChange={(value) => setValue('goodType', value)}
            error={errors.goodType}
          />
          <Field id="amount" label="Monto reclamado" optional hint="Si corresponde, indica la moneda (S/ o US$).">
            <TextInput id="amount" value={values.amount} onChange={onText('amount')} />
          </Field>
          <Field id="description" label="Descripción del producto o servicio" error={errors.description}>
            <TextArea
              id="description"
              rows={3}
              value={values.description}
              onChange={onText('description')}
              error={errors.description}
            />
          </Field>
        </FormBlock>

        <FormBlock title="3. Detalle de la reclamación y pedido del consumidor">
          <OptionCards
            legend="Tipo de solicitud"
            name="claimType"
            options={CLAIM_TYPES}
            value={values.claimType}
            onChange={(value) => setValue('claimType', value)}
            error={errors.claimType}
          />
          <Field id="detail" label="Detalle de los hechos" error={errors.detail}>
            <TextArea
              id="detail"
              rows={5}
              value={values.detail}
              onChange={onText('detail')}
              error={errors.detail}
            />
          </Field>
          <Field id="request" label="Pedido del consumidor" error={errors.request}>
            <TextArea
              id="request"
              rows={3}
              value={values.request}
              onChange={onText('request')}
              error={errors.request}
            />
          </Field>
        </FormBlock>

        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-relaxed text-neutral-500">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            4. Observaciones y acciones adoptadas por el proveedor
          </span>
          <p className="mt-2">
            Este apartado lo completa Zenda al responder tu hoja. La respuesta se enviará por el medio
            de contacto que registraste en un plazo máximo de 15 días hábiles.
          </p>
        </div>

        <Checkbox
          id="consent"
          checked={values.consent}
          onChange={(checked) => setValue('consent', checked)}
          error={errors.consent}
        >
          Declaro que la información es veraz y autorizo el tratamiento de mis datos para atender esta
          hoja, conforme a la{' '}
          <Link
            to="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zenda-dark underline underline-offset-4 hover:text-zenda-blue"
          >
            Política de Privacidad
          </Link>
          .
        </Checkbox>

        {status === 'error' && (
          <div
            role="alert"
            className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">No pudimos registrar tu hoja de reclamación.</p>
              <p className="mt-1 leading-relaxed">
                Inténtalo nuevamente en unos minutos o comunícate con nosotros por{' '}
                <a
                  href={buildWhatsAppLink(`Hola Zenda, intenté registrar una hoja de reclamación (${reference.current}) y no se pudo guardar.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-4"
                >
                  WhatsApp
                </a>
                .
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-zenda-dark px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zenda-blue hover:shadow-lg hover:shadow-zenda-blue/20 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-zenda-cyan disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:scale-100 disabled:hover:bg-zenda-dark disabled:hover:shadow-none sm:w-auto"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Registrando...
            </>
          ) : (
            'Registrar hoja de reclamación'
          )}
        </button>
      </form>

      <LegalSection title="Contacto">
        <ContactList />
      </LegalSection>
    </LegalLayout>
  );
}
