import { useRef } from 'react';

// ─── DashCard ────────────────────────────────────────────────────────────────
interface DashCardProps {
  children: React.ReactNode;
  dark?: boolean;
  pad?: number | string;
  className?: string;
  onClick?: () => void;
}
export function DashCard({ children, dark = false, pad, className = '', onClick }: DashCardProps) {
  const p = pad !== undefined ? pad : 22;
  const base =
    'relative rounded-[2px] border transition-colors ' +
    (dark
      ? 'bg-noir text-[#F5F2EC] border-white/[0.07]'
      : 'bg-white text-noir border-noir/[0.06]');
  return (
    <div
      onClick={onClick}
      className={`${base} ${className}`}
      style={{ padding: typeof p === 'number' ? `${p}px` : p, cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </div>
  );
}

// ─── DashEyebrow ─────────────────────────────────────────────────────────────
interface DashEyebrowProps {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}
export function DashEyebrow({ children, className = '', light = false }: DashEyebrowProps) {
  return (
    <div
      className={`text-[9px] uppercase tracking-[0.22em] font-medium ${light ? 'text-white/45' : 'text-black/40'} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── DashKPI ─────────────────────────────────────────────────────────────────
interface DashKPIProps {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  trailing?: React.ReactNode;
  dark?: boolean;
  className?: string;
}
export function DashKPI({ label, value, delta, positive, trailing, dark = false, className = '' }: DashKPIProps) {
  return (
    <DashCard dark={dark} className={`flex flex-col gap-3 ${className}`}>
      <DashEyebrow light={dark}>{label}</DashEyebrow>
      <div className="flex items-end justify-between gap-2">
        <div
          className="font-display leading-[0.95] tracking-[-0.02em]"
          style={{ fontSize: 30 }}
        >
          {value}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {delta !== undefined && (
        <DashDelta value={delta} positive={positive ?? true} />
      )}
    </DashCard>
  );
}

// ─── DashDelta ───────────────────────────────────────────────────────────────
interface DashDeltaProps {
  value: string;
  positive: boolean;
}
export function DashDelta({ value, positive }: DashDeltaProps) {
  return (
    <span
      className="inline-flex items-center gap-[3px] rounded-full font-medium"
      style={{
        fontSize: 10.5,
        padding: '3px 7px',
        background: positive ? 'rgba(53,94,59,0.08)' : 'rgba(182,67,43,0.08)',
        color: positive ? '#355E3B' : '#B6432B',
      }}
    >
      {positive ? '↑' : '↓'} {value}
    </span>
  );
}

// ─── DashPill ─────────────────────────────────────────────────────────────────
interface DashPillProps {
  children: React.ReactNode;
  dark?: boolean;
  outline?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}
export function DashPill({ children, dark = false, outline = false, active = false, onClick, className = '' }: DashPillProps) {
  const base = 'inline-flex items-center gap-[5px] rounded-full text-[9.5px] uppercase tracking-[0.14em] font-medium transition-colors';
  let variant = '';
  if (dark || active) {
    variant = 'bg-noir text-[#F5F2EC] border border-noir px-[10px] py-[5px]';
  } else if (outline) {
    variant = 'bg-transparent text-noir border border-noir/20 px-[10px] py-[5px]';
  } else {
    variant = 'bg-surface-muted text-noir border border-transparent px-[10px] py-[5px]';
  }
  return (
    <span onClick={onClick} className={`${base} ${variant} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      {children}
    </span>
  );
}

// ─── DashPageHeader ───────────────────────────────────────────────────────────
interface DashPageHeaderProps {
  breadcrumb?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function DashPageHeader({ breadcrumb, title, subtitle, action }: DashPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-noir/[0.06] px-4 pb-5 pt-7 sm:px-6 sm:gap-5 md:flex-row md:items-start md:justify-between md:gap-6 md:px-10">
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <div className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
            {breadcrumb}
          </div>
        )}
        <h1 className="font-display text-[clamp(1.65rem,5.2vw,2.5rem)] leading-[0.95] tracking-[-0.02em] break-words md:text-[40px]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[13px] text-black/45">{subtitle}</p>}
      </div>
      {action && (
        <div className="w-full shrink-0 pt-0 sm:w-auto md:pt-1 [&>button]:w-full [&>a]:w-full sm:[&>button]:w-auto sm:[&>a]:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}

// ─── DashBtn ──────────────────────────────────────────────────────────────────
interface DashBtnProps {
  children: React.ReactNode;
  variant?: 'solid' | 'ghost' | 'cream';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
export function DashBtn({ children, variant = 'solid', size = 'md', onClick, disabled, type = 'button', className = '' }: DashBtnProps) {
  const sizes: Record<string, string> = {
    sm: 'px-3 py-[7px] text-[12px] min-h-[44px]',
    md: 'px-4 py-[10px] text-[13px] min-h-[44px]',
    lg: 'px-5 py-[13px] text-[14px] min-h-[44px]',
  };
  const variants: Record<string, string> = {
    solid: 'bg-noir text-[#F5F2EC] border border-noir hover:bg-anthracite',
    ghost: 'bg-transparent text-noir border border-noir/20 hover:border-noir/40',
    cream: 'bg-surface-muted text-noir border border-noir/10 hover:bg-surface-product-well',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full font-medium tracking-[-0.005em] transition-all disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  filled?: boolean;
}
export function Sparkline({ data, w = 120, h = 38, color = 'currentColor', filled = false }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {filled && <path d={area} fill={color} opacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── MiniBars ─────────────────────────────────────────────────────────────────
interface MiniBarsProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
}
export function MiniBars({ data, w = 100, h = 36, color = 'currentColor' }: MiniBarsProps) {
  const max = Math.max(...data) || 1;
  const bw = (w / data.length) * 0.55;
  const gap = (w / data.length) * 0.45;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = (v / max) * (h - 2);
        return (
          <rect key={i} x={i * (bw + gap) + gap / 2} y={h - bh} width={bw} height={bh} fill={color} rx="1" />
        );
      })}
    </svg>
  );
}

// ─── AreaChart ────────────────────────────────────────────────────────────────
interface AreaChartProps {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
  labels?: string[];
}
export function AreaChart({ data, w = 720, h = 160, stroke = 'currentColor', labels }: AreaChartProps) {
  const gradId = useRef(`ag-${Math.random().toString(36).slice(2)}`).current;
  if (data.length < 2) return null;
  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.9;
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 10) - 5,
  ]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L ${w},${h} L 0,${h} Z`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.14" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((r) => (
        <line key={r} x1="0" x2={w} y1={h * r} y2={h * r} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 3" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts
        .filter((_, i) => i % 4 === 0)
        .map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.8" fill={stroke} />
        ))}
      {labels &&
        labels
          .filter((_, i) => i % 3 === 0)
          .map((lbl, i) => {
            const idx = i * 3;
            if (!pts[idx]) return null;
            return (
              <text
                key={i}
                x={pts[idx][0]}
                y={h - 2}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(0,0,0,0.35)"
                fontFamily="inherit"
              >
                {lbl}
              </text>
            );
          })}
    </svg>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
interface GaugeProps {
  value?: number;
  size?: number;
  label?: string;
  dark?: boolean;
}
export function Gauge({ value = 80, size = 130, label, dark = false }: GaugeProps) {
  const r = size / 2 - 10;
  const circ = Math.PI * r;
  const pct = value / 100;
  const trackColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const fillColor = dark ? '#F5F2EC' : 'var(--color-noir, #0A0A0A)';
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 12 }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M 10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
          stroke={trackColor}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
          stroke={fillColor}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: size / 2 - 14,
          left: 0,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div className={`font-display leading-none ${dark ? 'text-[#F5F2EC]' : 'text-noir'}`} style={{ fontSize: 26 }}>
          {value}
          <span className={`${dark ? 'text-white/45' : 'text-black/40'}`} style={{ fontSize: 14 }}>%</span>
        </div>
        {label && (
          <div className={`text-[9px] uppercase tracking-[0.22em] font-medium mt-1 ${dark ? 'text-white/45' : 'text-black/40'}`}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DashRule ─────────────────────────────────────────────────────────────────
export function DashRule({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-noir/[0.06] ${className}`} />;
}

// ─── DashStatusBadge ──────────────────────────────────────────────────────────
type StatusVariant = 'active' | 'pending' | 'closed' | 'draft' | 'paused';
const STATUS_MAP: Record<StatusVariant, { label: string; cls: string }> = {
  active:  { label: 'Actif',     cls: 'bg-[rgba(53,94,59,0.08)] text-[#355E3B]' },
  pending: { label: 'En attente', cls: 'bg-[rgba(182,130,43,0.10)] text-[#8A6A10]' },
  closed:  { label: 'Fermé',     cls: 'bg-noir/[0.06] text-black/50' },
  draft:   { label: 'Brouillon', cls: 'bg-noir/[0.06] text-black/50' },
  paused:  { label: 'En pause',  cls: 'bg-[rgba(182,130,43,0.10)] text-[#8A6A10]' },
};
export function DashStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusVariant] ?? { label: status, cls: 'bg-noir/[0.06] text-black/50' };
  return (
    <span className={`inline-flex items-center rounded-full px-[8px] py-[3px] text-[10px] uppercase tracking-[0.14em] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── DashInput ────────────────────────────────────────────────────────────────
interface DashInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}
export function DashInput({ value, onChange, placeholder, icon, className = '' }: DashInputProps) {
  return (
    <div className={`flex items-center gap-[10px] px-[14px] py-[10px] bg-white border border-noir/[0.06] rounded-full ${className}`}>
      {icon && <span className="text-black/35 inline-flex shrink-0">{icon}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-none outline-none bg-transparent font-[inherit] text-[13px] w-full text-noir placeholder:text-black/30"
      />
    </div>
  );
}
