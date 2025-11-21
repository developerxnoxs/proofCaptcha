import { motion } from "framer-motion";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  subLabel?: string;
  color?: string;
  className?: string;
}

export default function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  subLabel,
  color = "hsl(var(--primary))",
  className = "",
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} data-testid="circular-progress">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(100, 100, 100, 0.2)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="text-4xl font-bold text-white" data-testid="text-percentage">
              {Math.round(percentage)}
            </div>
            <div className="text-sm text-slate-400">%</div>
          </motion.div>
        </div>
      </div>
      
      {subLabel && (
        <div className="text-center">
          <div className="text-sm font-medium text-slate-300" data-testid="text-sublabel">{subLabel}</div>
        </div>
      )}
    </div>
  );
}
