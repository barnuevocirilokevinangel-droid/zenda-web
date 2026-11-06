import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import usePageMeta from '../../lib/usePageMeta.js';

export default function AdminLogin() {
  usePageMeta({
    title: 'Zenda Admin · Acceso Fundadores',
    description: 'Portal de administración y gestión interna de Zenda.',
    noindex: true,
  });

  const { user, login, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Si ya tiene sesión, redirige a /admin
  const from = location.state?.from?.pathname || '/admin';
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.warn('[Admin Login Error]:', err);
      let msg = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Contraseña o correo electrónico incorrectos.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No existe una cuenta registrada con este correo.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#080B11] px-6 py-12 font-sans text-neutral-100 antialiased selection:bg-zenda-cyan selection:text-black">
      {/* Luces tenues de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/2 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zenda-blue/20 via-zenda-cyan/10 to-transparent blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-zenda-blue/15 blur-[160px]"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Enlace volver */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a wearezenda.com
        </Link>

        {/* Tarjeta de login */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/isotipo-zenda.png"
                alt="Zenda"
                className="h-8 w-auto object-contain brightness-110 drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]"
              />
              <div>
                <span className="text-xl font-bold tracking-tight text-white">zenda</span>
                <span className="ml-2 rounded-md border border-zenda-cyan/30 bg-zenda-cyan/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-zenda-cyan">
                  admin
                </span>
              </div>
            </div>
            <ShieldCheck className="h-5 w-5 text-neutral-500" />
          </div>

          <h1 className="mt-8 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Acceso Fundadores
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            Panel de control operativo, finanzas, métricas y pipeline de clientes.
          </p>

          {!isFirebaseConfigured && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
              <p className="font-semibold">Modo Desarrollo Activo:</p>
              <p className="mt-0.5 text-amber-300/80">
                Firebase sin credenciales en .env. Puedes ingresar con cualquier correo (ej. <code>admin@wearezenda.com</code>) y clave temporal para probar el panel.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="fundador@wearezenda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 transition-all outline-none hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-11 py-3 text-sm text-white placeholder:text-neutral-500 transition-all outline-none hover:border-white/20 focus:border-zenda-cyan focus:ring-1 focus:ring-zenda-cyan"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-zenda-cyan to-cyan-300 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(0,229,255,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-neutral-500">
            Zenda Tecnologías y Operaciones · Chimbote, Perú
          </div>
        </div>
      </div>
    </div>
  );
}
