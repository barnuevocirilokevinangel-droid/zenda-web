/** Isotipo + wordmark de Zenda. `variant="light"` para fondos oscuros. */
export default function Logo({ variant = 'dark', className = '' }) {
  const textColor = variant === 'light' ? 'text-white' : 'text-zenda-dark';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="8" fill="#1E3A8A" />
        <path
          d="M8 9.5h12L8 18.5h12"
          stroke="#00E5FF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`text-2xl font-bold tracking-tight ${textColor}`}>zenda</span>
    </span>
  );
}
