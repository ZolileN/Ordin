import { cn } from "@/lib/utils";

const severityStyles = {
  LOW: "bg-zinc-100 text-zinc-700 border-zinc-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-50 text-red-800 border-red-200",
};

const statusStyles = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  ASSIGNED: "bg-purple-50 text-purple-700 border-purple-200",
  INVESTIGATING: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  FALSE_POSITIVE: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "severity" | "status";
  severity?: keyof typeof severityStyles;
  status?: keyof typeof statusStyles;
  className?: string;
}

export function Badge({ children, variant = "default", severity, status, className }: BadgeProps) {
  let style = "bg-zinc-100 text-zinc-700 border border-zinc-200";
  if (variant === "severity" && severity) style = severityStyles[severity];
  if (variant === "status" && status) style = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {children}
    </span>
  );
}
