"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AuraLineChart({ data, color = "#E86A4A" }: { data: { label: string; value: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line dataKey="value" stroke={color} strokeWidth={3} type="monotone" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AuraRetentionChart({ data }: { data: { label: string; active: number; completed: number; dropped: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="active" fill="#2B1712" radius={[6, 6, 0, 0]} />
        <Bar dataKey="completed" fill="#E86A4A" radius={[6, 6, 0, 0]} />
        <Bar dataKey="dropped" fill="#A4A09A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AuraCountryPie({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["#2B1712", "#E86A4A", "#D79B61", "#6B4D3D", "#A4A09A"];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78}>
          {data.map((row, index) => <Cell key={row.name} fill={colors[index % colors.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
