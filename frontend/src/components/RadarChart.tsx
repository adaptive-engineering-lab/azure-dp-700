import type { DomainStat } from '../lib/dashboard/aggregate';
import { DOMAIN_LABELS } from '../lib/questions/types';

interface Props {
  stats: DomainStat[];
  size?: number;
}

const LINE_HEIGHT = 12;
const MAX_CHARS_PER_LINE = 18;

/** Greedy word wrap — domain labels are full sentences, not single words. */
function wrapLabel(text: string, maxChars = MAX_CHARS_PER_LINE): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function RadarChart({ stats, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  // Labels are multi-line sentences, so the plot has to give up radius to
  // leave room for them on all sides.
  const radius = size / 2 - 62;
  const n = stats.length;

  const ringPcts = [25, 50, 75, 100];
  const points = stats.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = s.hasEnoughData ? (s.pct / 100) * radius : 0;
    const lines = wrapLabel(DOMAIN_LABELS[s.domain]);
    const dy = Math.sin(angle);
    // Nudge each label away from the plot, then centre the wrapped block on
    // its anchor so a 3-line label above the chart doesn't sit on the rings.
    const labelY = cy + dy * (radius + 20) - ((lines.length - 1) * LINE_HEIGHT) / 2 + dy * 8;
    return {
      angle,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (radius + 20),
      labelY,
      lines,
      label: lines.join(' '),
      hasData: s.hasEnoughData,
      stat: s,
    };
  });

  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Accuracy by domain"
    >
      {ringPcts.map((p) => (
        <circle
          key={p}
          cx={cx}
          cy={cy}
          r={(p / 100) * radius}
          fill="none"
          stroke="hsl(var(--color-divider))"
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      ))}
      {points.map((p) => (
        <line
          key={`axis-${p.label}`}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(p.angle) * radius}
          y2={cy + Math.sin(p.angle) * radius}
          stroke="hsl(var(--color-divider))"
          strokeOpacity={p.hasData ? 0.7 : 0.25}
          strokeDasharray={p.hasData ? undefined : '3 3'}
        />
      ))}
      <polygon points={polygon} fill="hsl(var(--color-accent) / 0.25)" stroke="hsl(var(--color-accent))" strokeWidth={2} />
      {points.map((p) => (
        <g key={`pt-${p.label}`}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="hsl(var(--color-accent))" />
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={p.hasData ? 'hsl(var(--color-fg))' : 'hsl(var(--color-fg-muted))'}
          >
            {p.lines.map((line, li) => (
              <tspan key={line} x={p.labelX} dy={li === 0 ? 0 : LINE_HEIGHT}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}
