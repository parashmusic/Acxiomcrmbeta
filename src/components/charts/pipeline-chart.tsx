"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PipelineChartProps {
  data: Array<{ stage: string; count: number; totalAmount: number }>;
}

export function PipelineChart({ data }: PipelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No pipeline data available
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.stage),
    datasets: [
      {
        label: "Total Value (INR)",
        data: data.map((d) => d.totalAmount),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { raw?: unknown }) => {
            const val = typeof context.raw === "number" ? context.raw : 0;
            return ` ₹${val.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
