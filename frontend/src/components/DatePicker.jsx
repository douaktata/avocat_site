import { useState, useRef, useEffect } from 'react';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function parseValue(value) {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1, day: parseInt(parts[2]) };
}

function formatOutput(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const today = new Date();

  const selected = parseValue(value);

  const [viewYear, setViewYear] = useState(selected ? selected.year : 2000);
  const [viewMonth, setViewMonth] = useState(selected ? selected.month : 0);

  // Close on outside click
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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  function handleDayClick(day) {
    onChange(formatOutput(viewYear, viewMonth, day));
    setOpen(false);
  }

  function goPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isSelected(day) {
    return selected && selected.day === day && selected.month === viewMonth && selected.year === viewYear;
  }

  function isToday(day) {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }

  // Build display text
  const displayText = selected
    ? `${selected.day} ${MONTHS[selected.month]} ${selected.year}`
    : '';

  // Generate year options (1940 to current year)
  const currentYear = today.getFullYear();
  const years = [];
  for (let y = currentYear; y >= 1940; y--) {
    years.push(y);
  }

  // Build calendar cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="datepicker" ref={ref}>
      <button type="button" className="datepicker-input" onClick={() => setOpen(!open)}>
        <span className={displayText ? 'dp-value' : 'dp-placeholder'}>
          {displayText || 'Sélectionner une date'}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="dp-dropdown">
          <div className="dp-header">
            <button type="button" className="dp-arrow" onClick={goPrev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="dp-selects">
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button type="button" className="dp-arrow" onClick={goNext}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="dp-weekdays">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
              <div key={d} className="dp-wday">{d}</div>
            ))}
          </div>

          <div className="dp-days">
            {cells.map((day, i) => (
              <div key={i} className="dp-cell">
                {day && (
                  <button
                    type="button"
                    className={'dp-day' + (isSelected(day) ? ' selected' : '') + (isToday(day) ? ' today' : '')}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
