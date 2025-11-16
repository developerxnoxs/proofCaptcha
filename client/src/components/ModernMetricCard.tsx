import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ModernMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  gradient?: string;
  index?: number;
}

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(value);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, prefersReducedMotion]);

  return <>{count.toLocaleString()}</>;
}

export default function ModernMetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  gradient = "from-blue-500/10 to-purple-500/10",
  index = 0,
}: ModernMetricCardProps) {
  // Only animate pure numbers, not formatted strings with units
  const isPureNumber = typeof value === 'number';
  const numericValue = isPureNumber ? value : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        rotateX: 5,
        transition: { duration: 0.3 },
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${gradient} backdrop-blur-xl shadow-2xl`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className="p-3 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className="h-6 w-6 text-primary" data-testid="icon-metric" />
            </motion.div>
            
            {trend && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                  trend.value >= 0
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}
                data-testid="badge-trend"
              >
                {trend.value >= 0 ? "↗" : "↘"} {Math.abs(trend.value)}%
              </motion.div>
            )}
          </div>

          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </h3>

          <motion.div 
            className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" 
            data-testid="text-value"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isPureNumber ? <AnimatedCounter value={numericValue} /> : value}
          </motion.div>

          {description && (
            <p className="text-xs text-muted-foreground" data-testid="text-description">
              {description}
            </p>
          )}
        </CardContent>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </Card>
    </motion.div>
  );
}
