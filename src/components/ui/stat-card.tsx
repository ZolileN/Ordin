import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ title, value, subtitle, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-5", className)}>
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>}
    </div>
  );
}
