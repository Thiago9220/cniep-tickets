import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChartProps {
  data: any[];
  colors?: string[];
}

export function VolumeBarChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          itemStyle={{ color: 'var(--color-foreground)' }}
        />
        <Legend />
        <Bar dataKey="opened" name="Abertos" fill="var(--color-blue-500)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="closed" name="Fechados" fill="var(--color-green-500)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" name="Pendentes" fill="var(--color-orange-500)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function UrgencyPieChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || `var(--chart-${(index % 5) + 1})`} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          itemStyle={{ color: 'var(--color-foreground)' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          itemStyle={{ color: 'var(--color-foreground)' }}
        />
        <Legend />
        <Line type="monotone" dataKey="opened" name="Abertos" stroke="var(--color-blue-500)" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="closed" name="Fechados" stroke="var(--color-green-500)" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="pending" name="Pendentes" stroke="var(--color-orange-500)" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, dataKey, name, color }: { data: any[], dataKey: string, name: string, color: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
        <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={100} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          itemStyle={{ color: 'var(--color-foreground)' }}
        />
        <Bar dataKey="value" name={name} fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
