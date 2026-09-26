"use client";

import { useMemo, useRef, useState } from "react";

import { formatDate, formatMoney } from "@/lib/format";

// Single-series area chart (ink), one y-axis, recessive grid, crosshair +
// tooltip on hover/focus, and a table for screen readers.
export default function RevenueChart({
  data,
  locale,
  label,
  tableCaption,
  dateLabel,
  revenueLabel,
}: {
  data: { date: string; revenue: number }[];
  locale: string;
  label: string;
  tableCaption: string;
  dateLabel: string;
  revenueLabel: string;
}) {
  const W = 684;
  const H = 250;
  const pad = { l: 44, r: 8, t: 10, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { max, ticks, pts } = useMemo(() => {
    // Three gridline steps of a "nice" size (1, 2 or 5 × 10^n).
    const top = Math.max(...data.map((d) => d.revenue), 3);
    const raw = top / 3;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
    const niceMax = step * 3;
    const tk = [0, step, step * 2, niceMax];
    const p = data.map((d, i) => ({
      x: pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw),
      y: pad.t + ih - (d.revenue / niceMax) * ih,
    }));
    return { max: niceMax, ticks: tk, pts: p };
  }, [data, ih, iw, pad.l, pad.t]);

  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x} ${pad.t + ih} L${pts[0].x} ${pad.t + ih} Z`;
  const short = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`);
  const day = (d: string) => formatDate(`${d}T00:00:00`, locale, { month: "short", day: "numeric" });

  const pick = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((clientX - r.left) / r.width) * W;
    const i = Math.round(((x - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const h = hover !== null ? pts[hover] : null;
  const tipLeft = h ? Math.min(Math.max(h.x - 60, pad.l), W - 128) : 0;

  // Time runs left to right in both languages.
  return (
    <div className="relative" dir="ltr">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y text-foreground"
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(data.length - 1)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? data.length - 1) - 1));
          if (e.key === "ArrowRight") setHover((v) => Math.min(data.length - 1, (v ?? 0) + 1));
        }}
      >
        <g className="fill-muted-foreground" fontSize="11">
          {ticks.map((v) => {
            const y = pad.t + ih - (v / max) * ih;
            return (
              <g key={v}>
                <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className={v === 0 ? "stroke-input" : "stroke-border-soft"} strokeWidth={1} />
                <text x={0} y={y + 4}>
                  {short(v)}
                </text>
              </g>
            );
          })}
          {[0, Math.floor((data.length - 1) / 3), Math.floor((2 * (data.length - 1)) / 3), data.length - 1].map((i, k) => (
            <text key={i} x={pts[i].x} y={H - 4} textAnchor={k === 0 ? "start" : k === 3 ? "end" : "middle"}>
              {day(data[i].date)}
            </text>
          ))}
        </g>
        <path d={area} className="fill-current" opacity={0.08} />
        <path d={line} className="stroke-current" fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {h && (
          <>
            <line x1={h.x} x2={h.x} y1={pad.t} y2={pad.t + ih} className="stroke-muted-foreground" strokeDasharray="3 3" />
            <circle cx={h.x} cy={h.y} r={5} className="fill-current stroke-card" strokeWidth={2} />
          </>
        )}
      </svg>
      {h && hover !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-8 rounded-sm bg-inverse px-3 py-2 text-inverse-foreground shadow-md"
          style={{ left: `${(tipLeft / W) * 100}%` }}
        >
          <div className="text-[11px] text-inverse-muted">{day(data[hover].date)}</div>
          <div className="text-sm font-bold tabular-nums">{formatMoney(data[hover].revenue)}</div>
        </div>
      )}
      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{dateLabel}</th>
            <th scope="col">{revenueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{day(d.date)}</td>
              <td>{formatMoney(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
