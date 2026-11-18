"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface LeadStatusChartProps {
  data: Array<{ status: string; count: number }>;
}

const statusColors: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#f59e0b",
  QUALIFIED: "#10b981",
  UNQUALIFIED: "#6b7280",
  CONVERTED: "#8b5cf6",
  LOST: "#ef4444",
};

export function LeadStatusChart({ data }: LeadStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No lead data available
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.status),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: data.map((d) => statusColors[d.status] || "#94a3b8"),
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 16,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

