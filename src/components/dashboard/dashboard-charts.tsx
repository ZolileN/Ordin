"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardChartsProps {
  severityData: { name: string; value: number; color: string }[];
  runChartData: { name: string; matched: number; exceptions: number }[];
}

export function DashboardCharts({ severityData, runChartData }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="font-semibold text-base">Exception Severity</h3>
        </div>
        <div className="p-6 pt-0">
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">No open exceptions</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="font-semibold text-base">Recent Control Runs</h3>
        </div>
        <div className="p-6 pt-0">
          {runChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={runChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="matched" fill="#22c55e" name="Matched" />
                <Bar dataKey="exceptions" fill="#ef4444" name="Exceptions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">No control runs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
