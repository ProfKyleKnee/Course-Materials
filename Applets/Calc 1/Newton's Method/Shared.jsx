import React, { useState, useEffect } from 'react';

export const COLORS = {
  accent: '#3B4FC2',
  accentLight: '#6478D6',
  bg: '#F5F5FA',
  card: '#FFFFFF',
  border: '#DCDCF0',
  muted: '#6E6E86',
  eyebrow: '#8A8AA3',
  text: '#3A3A3C',
  warning: '#C77B94',
  warningBg: '#FBF1F4',
  good: '#3FA671',
  bad: '#C1556B',
  amber: '#C98F3E',
};

// ---------------------------------------------------------------------
// Local text-buffer number input — supports typing "-" and partial
// decimals fluently rather than coercing on every keystroke.
// ---------------------------------------------------------------------
export function NumberField({ value, onChange, prefix, width = 90, disabled }) {
  const [text, setText] = useState(value.toString());

  useEffect(() => {
    // Only resync from parent when not actively diverging from a valid parse
    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed !== value) {
      setText(formatDisplay(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function formatDisplay(v) {
    const s = v.toFixed(4).replace(/\.?0+$/, '');
    return s === '' || s === '-' ? '0' : s;
  }

  function handleChange(e) {
    const t = e.target.value;
    if (/^-?\d*\.?\d*$/.test(t)) {
      setText(t);
      const parsed = parseFloat(t);
      if (!isNaN(parsed)) onChange(parsed);
    }
  }

  function handleBlur() {
    const parsed = parseFloat(text);
    if (isNaN(parsed)) {
      setText(formatDisplay(value));
    } else {
      setText(formatDisplay(parsed));
      onChange(parsed);
    }
  }

  return (
    <div style={{ display: 'flex', borderRadius: 20, border: `1px solid ${COLORS.border}`, overflow: 'hidden', background: COLORS.card }}>
      {prefix && (
        <div style={{ padding: '8px 6px 8px 14px', color: COLORS.muted, fontSize: 14, display: 'flex', alignItems: 'center' }}>
          {prefix}
        </div>
      )}
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          width,
          border: 'none',
          outline: 'none',
          padding: '8px 14px 8px 4px',
          fontSize: 14,
          color: COLORS.text,
          background: 'transparent',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  );
}

export function FixedReadout({ prefix, value, minWidth = 150 }) {
  return (
    <div style={{
      display: 'flex', borderRadius: 20, border: `1px solid ${COLORS.border}`,
      background: '#F0F0F8', overflow: 'hidden', minWidth,
    }}>
      {prefix && (
        <div style={{ padding: '8px 6px 8px 14px', color: COLORS.muted, fontSize: 14, whiteSpace: 'nowrap' }}>{prefix}</div>
      )}
      <div style={{ padding: '8px 14px 8px 4px', fontSize: 14, color: COLORS.text, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

export function FieldCaption({ children }) {
  return (
    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.03em', color: COLORS.eyebrow, fontWeight: 700, paddingLeft: 4, marginBottom: 4 }}>
      {children}
    </div>
  );
}

// Fixed-height spacer that appears under sibling fields so the control
// strip never visually reflows when one field grows an extra line
// (warning note, toggle button, no-toggle explanation card, etc.)
export function FieldSpacer({ active, height = 28 }) {
  return <div style={{ height, visibility: active ? 'visible' : 'hidden' }} />;
}

export function WarningNote({ children }) {
  return (
    <div style={{
      background: COLORS.warningBg, color: COLORS.warning, fontSize: 12.5,
      borderRadius: 10, padding: '5px 10px', lineHeight: 1.3, maxWidth: 220,
    }}>
      {children}
    </div>
  );
}

export function SuccessNote({ children }) {
  return (
    <div style={{
      background: '#EEF7F1', color: COLORS.good, fontSize: 12.5,
      borderRadius: 10, padding: '5px 10px', lineHeight: 1.3, maxWidth: 220,
    }}>
      {children}
    </div>
  );
}

export function subscriptDigits(n) {
  return `${n}`.replace(/[0-9]/g, (d) => '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[d]);
}


// ---------------------------------------------------------------------
// Vertical icon-rail navigation — exact SVG paths + labels restored from
// the originally agreed mockup (intro-tab.html / flat-tangent-tab.html),
// with divider lines between groups.
// ---------------------------------------------------------------------
const ICONS = {
  intro: (
    <>
      <path d="M2 16 Q8 4 18 6" />
      <circle cx="8" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  freePlay: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M8 7 L14 10 L8 13 Z" fill="currentColor" stroke="none" />
    </>
  ),
  diverge: <path d="M10 10 L4 3 M10 10 L16 3 M10 10 L10 17" />,
  flatTangent: (
    <>
      <path d="M2 10 L18 9" />
      <path d="M14 4 L18 9 L13 13" strokeWidth="1.3" />
    </>
  ),
  oscillation: (
    <path d="M3 6 L14 6 M14 6 L11 3.5 M14 6 L11 8.5 M17 14 L6 14 M6 14 L9 11.5 M6 14 L9 16.5" />
  ),
  wrongRoot: (
    <>
      <path d="M10 3 L10 10 L4 17 M10 10 L16 17" />
      <circle cx="4" cy="17" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r="1.3" fill="none" />
    </>
  ),
  otherReasons: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M8 8 Q8 6 10 6 Q12 6 12 8 Q12 9.5 10 10.5 L10 12" strokeLinecap="round" />
      <circle cx="10" cy="14.3" r="0.4" fill="currentColor" stroke="none" />
    </>
  ),
};

export function IconRail({ groups, active, onSelect }) {
  return (
    <div style={{ width: 76, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map((group, gi) => (
        <React.Fragment key={group.label}>
          {gi > 0 && <div style={{ height: 1, background: COLORS.border, margin: '2px 4px' }} />}
          <div>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.eyebrow, fontWeight: 700, paddingLeft: 2, marginBottom: 6 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '8px 4px 7px', borderRadius: 12,
                      border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                      background: isActive ? COLORS.accent : COLORS.card,
                      cursor: 'pointer', color: isActive ? '#FFFFFF' : '#6E6E86',
                    }}
                  >
                    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.6}>
                      {ICONS[item.icon]}
                    </svg>
                    <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? '#FFFFFF' : COLORS.muted, textAlign: 'center', lineHeight: 1.15 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// Builds the echo-trail array for the Graph component: one entry per
// committed iterate x1..x_currentN, opacity fading toward ~15% for older
// steps, current step at full opacity (and flagged isCurrent so its
// tangent line plays the reveal animation).
export function buildTrail(xs, currentN, color) {
  const n = Math.min(currentN, xs.length);
  const trail = [];
  for (let i = 0; i < n; i++) {
    const age = n - 1 - i; // 0 = current
    const opacity = age === 0 ? 1 : Math.max(0.15, 1 - age * 0.22);
    trail.push({
      key: i,
      x: xs[i],
      label: `x${subscriptDigits(i + 1)}`,
      opacity,
      isCurrent: age === 0,
      color,
    });
  }
  return trail;
}

export function IterationTable({ maxN, currentN, xs, roseTheme, showPlaceholders = false }) {
  const rowColor = roseTheme ? COLORS.bad : COLORS.accent;
  const rowCount = showPlaceholders ? maxN : Math.min(currentN, xs.length);
  return (
    <div style={{
      width: 148, flexShrink: 0, background: COLORS.card, borderRadius: 16,
      boxShadow: '0 1px 3px rgba(60,60,90,0.07)', overflow: 'hidden', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', color: COLORS.eyebrow, fontWeight: 700, fontSize: 11, padding: '8px 10px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div>n</div>
        <div>x&#8345;</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {Array.from({ length: rowCount }, (_, i) => {
          const n = i + 1;
          const hasValue = i < currentN && i < xs.length;
          const isCurrent = n === currentN;
          return (
            <div
              key={n}
              style={{
                display: 'grid', gridTemplateColumns: '28px 1fr', fontSize: 12.5,
                padding: '5px 10px', background: isCurrent ? '#EFF1FC' : 'transparent',
                color: hasValue ? rowColor : COLORS.border, fontVariantNumeric: 'tabular-nums',
                fontWeight: isCurrent ? 700 : hasValue ? 600 : 400,
              }}
            >
              <div style={{ color: COLORS.muted }}>{n}</div>
              <div>{hasValue ? `x${subscriptDigits(n)} \u2248 ${xs[i].toFixed(4)}` : '\u2014'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
