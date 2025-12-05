import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProfitAnalysisChartProps {
  data: { name: string; cost: number; profit: number }[];
}

export function ProfitAnalysisChart({ data }: ProfitAnalysisChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 10 }} 
          className="fill-muted-foreground"
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
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
        <Legend />
        <Bar dataKey="cost" name="Cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
