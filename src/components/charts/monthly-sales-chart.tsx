"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlySalesChartProps {
  data: Array<{ month: string; amount: number }>;
}

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No sales data available
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        fill: true,
        label: "Closed Sales (INR)",
        data: data.map((d) => d.amount),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        tension: 0.3,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
