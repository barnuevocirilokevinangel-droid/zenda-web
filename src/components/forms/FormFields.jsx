/** Componentes de formulario compartidos (onboarding, reclamaciones). */

export const inputClasses =
  'block w-full rounded-xl border bg-white px-4 py-3.5 text-base text-zenda-dark placeholder:text-neutral-400 transition-colors focus:border-zenda-dark focus:outline-none focus:ring-2 focus:ring-zenda-cyan/40 disabled:cursor-not-allowed disabled:opacity-70';

const borderFor = (error) => (error ? 'border-red-400' : 'border-slate-200');

export function Field({ id, label, hint, error, optional = false, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium text-zenda-dark">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-neutral-400">Opcional</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const a11y = (id, error) => ({
  'aria-invalid': error ? 'true' : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
});

export function TextInput({ id, error, className = '', ...props }) {
  return (
    <input
      id={id}
      className={`${inputClasses} ${borderFor(error)} ${className}`}
      {...a11y(id, error)}
      {...props}
    />
  );
}

export function TextArea({ id, error, rows = 4, className = '', ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`${inputClasses} resize-y ${borderFor(error)} ${className}`}
      {...a11y(id, error)}
      {...props}
    />
  );
}

export function SelectInput({ id, error, placeholder, options, className = '', ...props }) {
  return (
    <select
      id={id}
      className={`${inputClasses} ${borderFor(error)} ${className}`}
      {...a11y(id, error)}
      {...props}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** Selección múltiple o simple con "chips" (botones con aria-pressed). */
export function ChipGroup({ legend, options, value, onChange, multiple = true, error, id }) {
  const toggle = (option) => {
    if (!multiple) {
      onChange(option);
      return;
    }
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  const isActive = (option) => (multiple ? value.includes(option) : value === option);

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-3 text-sm font-medium text-zenda-dark">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={isActive(option)}
            onClick={() => toggle(option)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zenda-cyan ${
              isActive(option)
                ? 'border-zenda-dark bg-zenda-dark text-white'
                : 'border-slate-200 bg-white text-neutral-600 hover:border-slate-400 hover:text-zenda-dark'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Opciones de selección única como tarjetas (radio accesible). */
export function OptionCards({ legend, name, options, value, onChange, error, columns = 'sm:grid-cols-2' }) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-3 text-sm font-medium text-zenda-dark">{legend}</legend>
      <div className={`grid grid-cols-1 gap-3 ${columns}`}>
        {options.map((option) => (
          <label key={option.value} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="block h-full rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-400 peer-checked:border-zenda-dark peer-checked:bg-gray-50 peer-checked:ring-1 peer-checked:ring-zenda-dark peer-focus-visible:ring-2 peer-focus-visible:ring-zenda-cyan">
              <span className="block text-sm font-semibold text-zenda-dark">{option.title}</span>
              {option.description && (
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function Checkbox({ id, checked, onChange, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-neutral-600">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-zenda-dark focus:ring-2 focus:ring-zenda-cyan"
          {...a11y(id, error)}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
