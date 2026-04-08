import { useState, useRef, useEffect } from 'react';

const ROLES = [
  { value: 'CLIENT', label: 'Client', emoji: '\uD83D\uDC64' },
  { value: 'AVOCAT', label: 'Avocat', emoji: '\u2696\uFE0F' },
  { value: 'SECRETAIRE', label: 'Secrétaire', emoji: '\uD83D\uDCCB' },
  { value: 'STAGIAIRE', label: 'Stagiaire', emoji: '\uD83C\uDF93' },
];

export default function RoleSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = ROLES.find((r) => r.value === value) || ROLES[0];

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [open]);

  function handleSelect(role) {
    onChange(role.value);
    setOpen(false);
  }

  return (
    <div className="rs-wrapper" ref={ref}>
      <button type="button" className="rs-trigger" onClick={() => setOpen(!open)}>
        <span className="rs-current">
          <span className="rs-emoji">{current.emoji}</span>
          <span>{current.label}</span>
        </span>
        <svg
          className={'rs-chevron' + (open ? ' open' : '')}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="rs-dropdown">
          {ROLES.map((role) => (
            <button
              type="button"
              key={role.value}
              className={'rs-option' + (role.value === value ? ' active' : '')}
              onClick={() => handleSelect(role)}
            >
              <span className="rs-emoji">{role.emoji}</span>
              <span className="rs-label">{role.label}</span>
              {role.value === value && (
                <svg className="rs-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
