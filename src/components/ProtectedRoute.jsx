import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080B11] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <img src="/isotipo-zenda.png" alt="Zenda" className="h-7 w-auto object-contain brightness-110" />
            <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-zenda-cyan/60" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            Validando sesión de fundador...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
