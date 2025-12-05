import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CostBreakdownChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  'hsl(262, 83%, 58%)', // primary
  'hsl(180, 60%, 50%)', // secondary
  'hsl(38, 95%, 60%)',  // accent
  'hsl(145, 65%, 45%)', // success
  'hsl(0, 84%, 60%)',   // destructive
  'hsl(220, 15%, 45%)', // muted
  'hsl(290, 80%, 55%)', // purple variant
  'hsl(200, 70%, 55%)', // blue variant
];

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const filteredData = data.filter(d => d.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        No data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {filteredData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
