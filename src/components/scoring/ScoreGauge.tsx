'use client';

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score < 40) return '#C23B3B'; // red-500
  if (score < 60) return '#D47B2A'; // orange-500
  if (score < 75) return '#C4952C'; // yellow-500
  return '#0B7A5E'; // green-500
}

export default function ScoreGauge({ score, size = 120 }: ScoreGaugeProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const color = getScoreColor(score);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-sm"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E4DED4"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease-in-out, stroke 0.3s ease',
          }}
        />
        {/* Score number */}
        <text
          x={center}
          y={center - size * 0.04}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-bold"
          style={{
            fontSize: `${size * 0.3}px`,
            fontFamily: 'var(--font-mono)',
            fill: 'var(--text-primary)',
          }}
        >
          {Math.round(score)}
        </text>
        {/* Label */}
        <text
          x={center}
          y={center + size * 0.18}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: `${size * 0.1}px`,
            fill: 'var(--text-tertiary)',
          }}
        >
          ATS Score
        </text>
      </svg>
    </div>
  );
}
