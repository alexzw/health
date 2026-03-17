function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "short"
  });
}

function sampleMeasurements(measurements) {
  if (measurements.length <= 3) {
    return measurements;
  }

  const middleIndex = Math.floor((measurements.length - 1) / 2);
  return [measurements[0], measurements[middleIndex], measurements[measurements.length - 1]];
}

function createChartPoints(measurements, key, width, height, padding) {
  const values = measurements.map((measurement) => measurement[key]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return measurements
    .map((measurement, index) => {
      const x =
        padding + (index * (width - padding * 2)) / Math.max(measurements.length - 1, 1);
      const y =
        height - padding - ((measurement[key] - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function GrowthChart({ measurements, metric, color, label, unit }) {
  const width = 560;
  const height = 240;
  const padding = 28;
  const points = createChartPoints(measurements, metric, width, height, padding);
  const latestMeasurement = measurements[measurements.length - 1];

  return (
    <div className="glass-panel rounded-[28px] p-6 shadow-glass">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {latestMeasurement[metric]} {unit}
          </h3>
        </div>
        <p className="text-sm text-slate-500">{formatDate(latestMeasurement.measuredAt)}</p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-6 h-56 w-full">
        <defs>
          <linearGradient id={`${metric}-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="30" fill="transparent" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {measurements.map((measurement, index) => {
          const values = measurements.map((entry) => entry[metric]);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          const range = maxValue - minValue || 1;
          const x =
            padding + (index * (width - padding * 2)) / Math.max(measurements.length - 1, 1);
          const y =
            height -
            padding -
            ((measurement[metric] - minValue) / range) * (height - padding * 2);

          return (
            <g key={measurement.id}>
              <circle cx={x} cy={y} r="5" fill={color} />
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {sampleMeasurements(measurements).map((measurement) => (
          <span key={measurement.id} className="rounded-full bg-white/70 px-3 py-1">
            {formatDate(measurement.measuredAt)}
          </span>
        ))}
      </div>
    </div>
  );
}
