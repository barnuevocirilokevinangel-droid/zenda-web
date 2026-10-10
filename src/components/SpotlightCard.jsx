/**
 * Tarjeta con efecto "spotlight": un brillo radial sigue al cursor al hacer hover.
 * Actualiza variables CSS directamente en el DOM (sin re-renders) y funciona con
 * cualquier etiqueta mediante `as` ("a", "article", "div"…). El resto de props se
 * pasa al elemento.
 */
export default function SpotlightCard({ as: Tag = 'div', className = '', children, ...rest }) {
  const handleMouseMove = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  return (
    <Tag
      onMouseMove={handleMouseMove}
      className={`group/spot relative ${className}`}
      {...rest}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(0, 229, 255, 0.10), transparent 65%)',
        }}
      />
    </Tag>
  );
}
