import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

const CHART_COLORS = [
  "#0f172a", "#1e40af", "#0369a1", "#0d9488", "#15803d",
  "#64748b", "#94a3b8", "#cbd5e1",
];

const chartConfig = (keys: string[]) => {
  const c: Record<string, { label: string; color?: string }> = {};
  keys.forEach((k, i) => {
    c[k] = { label: k, color: CHART_COLORS[i % CHART_COLORS.length] };
  });
  return c;
};

interface FinCampChartBlockProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  type?: "bar" | "pie" | "horizontalBar";
  valueKey?: string;
  nameKey?: string;
  emptyMessage?: string;
}

export function FinCampChartBlock({
  title,
  description,
  data,
  type = "bar",
  valueKey = "value",
  nameKey = "name",
  emptyMessage = "Sem dados no período",
}: FinCampChartBlockProps) {
  const config = chartConfig([valueKey]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm mt-4">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      <div className="h-[240px] mt-4">
        {type === "pie" ? (
          <ChartContainer config={config} className="h-full w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ChartContainer>
        ) : type === "horizontalBar" ? (
          <ChartContainer config={config} className="h-full w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis type="number" />
              <YAxis type="category" dataKey={nameKey} width={100} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={valueKey} fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={config} className="h-full w-full">
            <BarChart data={data} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={valueKey} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
