import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CostTrendsChartProps {
  data: { date: string; cost: number; price: number }[];
}

export function CostTrendsChart({ data }: CostTrendsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          className="fill-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          className="fill-muted-foreground"
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
        />
        <Line
          type="monotone"
          dataKey="cost"
          name="Cost"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          name="Price"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
