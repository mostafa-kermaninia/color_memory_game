// src/components/TimerCircle.jsx
export default function TimerCircle({ total, left }) {
    const radius = 40;
    const dash = 2 * Math.PI * radius;
    const progress = dash * (left / total);
  
    return (
      <svg width="100" height="100" className="mt-6 select-none">
        {/* پس‌زمینه */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth="8"
        />
        {/* پیشرفت */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke="#10b981" strokeWidth="8"
          strokeDasharray={`${dash} ${dash}`}
          strokeDashoffset={dash - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s linear" }}
        />
        {/* عدد */}
        <text
          x="50" y="56" textAnchor="middle"
          className="font-bold text-xl fill-slate-700"
        >
          {left}
        </text>
      </svg>
    );
  }
  