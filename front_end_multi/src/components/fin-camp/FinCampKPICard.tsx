import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface FinCampKPICardProps {
  title: string;
  value: string | number;
  variation?: number;
  tooltip: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function FinCampKPICard({
  title,
  value,
  variation,
  tooltip,
  icon,
  variant = "default",
}: FinCampKPICardProps) {
  const variantStyles = {
    default: "bg-slate-50 border-slate-200",
    success: "bg-emerald-50/80 border-emerald-200",
    warning: "bg-amber-50/80 border-amber-200",
    danger: "bg-red-50/80 border-red-200",
  };

  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-red-100 text-red-600",
  };

  const varColor = variation == null ? "" : variation > 0 ? "text-emerald-600" : variation < 0 ? "text-red-600" : "text-slate-500";
  const VarIcon = variation != null && variation > 0 ? TrendingUp : variation != null && variation < 0 ? TrendingDown : Minus;

  return (
    <TooltipProvider>
      <div
        className={`rounded-xl border p-4 ${variantStyles[variant]} transition-shadow hover:shadow-sm`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-600 truncate">{title}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={14} className="text-slate-400 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
            {variation != null && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${varColor}`}>
                <VarIcon size={12} />
                <span>{variation > 0 ? "+" : ""}{variation}% vs período anterior</span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
