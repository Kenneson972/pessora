import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';

const COLORS = ['#1E3529', '#3A5F1A', '#6B8E4E', '#A3B89A', '#D4C5B2'];

interface AnalyticsData {
  revenue7d: Array<{ date: string; montant: number }>;
  orders7d: Array<{ heure: string; count: number }>;
  topProducts: Array<{ name: string; count: number }>;
  gammeSplit: Array<{ name: string; value: number }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: orders } = await db
        .from('orders')
        .select('id, total, created_at, order_items(product_name, quantity)')
        .gte('created_at', sevenDaysAgo)
        .in('status', ['completed', 'ready', 'preparing', 'paid'])
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (!orders?.length) {
        setData({
          revenue7d: [],
          orders7d: [],
          topProducts: [],
          gammeSplit: [],
        });
        setLoading(false);
        return;
      }

      // CA 7 jours
      const revenueMap: Record<string, number> = {};
      const hourlyMap: Record<string, number> = {};
      const productCount: Record<string, number> = {};

      for (const o of orders) {
        const d = new Date(o.created_at).toISOString().split('T')[0];
        const h = new Date(o.created_at).getHours().toString().padStart(2, '0') + 'h';
        revenueMap[d] = (revenueMap[d] || 0) + (o.total || 0);
        hourlyMap[h] = (hourlyMap[h] || 0) + 1;

        for (const item of o.order_items || []) {
          productCount[item.product_name] = (productCount[item.product_name] || 0) + item.quantity;
        }
      }

      setData({
        revenue7d: Object.entries(revenueMap).map(([date, montant]) => ({ date, montant })),
        orders7d: Object.entries(hourlyMap).map(([heure, count]) => ({ heure, count })),
        topProducts: Object.entries(productCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        gammeSplit: [
          { name: 'Wellness', value: 30 },
          { name: 'Sport', value: 45 },
          { name: 'Skin', value: 25 },
        ],
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-noir/[0.03] rounded-[2px]" />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CA 7 jours */}
      <div className="rounded-[2px] border border-noir/[0.06] bg-white p-5">
        <h3 className="mb-4 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">CA 7 jours</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.revenue7d}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#00000020" />
            <YAxis tick={{ fontSize: 10 }} stroke="#00000020" />
            <Tooltip />
            <Area type="monotone" dataKey="montant" stroke="#1E3529" fill="#1E3529" fillOpacity={0.08} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Commandes par heure */}
      <div className="rounded-[2px] border border-noir/[0.06] bg-white p-5">
        <h3 className="mb-4 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Commandes 7 jours</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.orders7d}>
            <XAxis dataKey="heure" tick={{ fontSize: 10 }} stroke="#00000020" />
            <YAxis tick={{ fontSize: 10 }} stroke="#00000020" />
            <Tooltip />
            <Bar dataKey="count" fill="#3A5F1A" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top produits */}
      <div className="rounded-[2px] border border-noir/[0.06] bg-white p-5">
        <h3 className="mb-4 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Top 5 produits</h3>
        <div className="space-y-2">
          {data.topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-[10px] font-medium text-black/30 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-black truncate">{p.name}</p>
                <div className="h-1 mt-1 rounded-full bg-noir/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sapin"
                    style={{ width: `${(p.count / data.topProducts[0].count) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] tabular-nums text-black/40">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Répartition gamme */}
      <div className="rounded-[2px] border border-noir/[0.06] bg-white p-5">
        <h3 className="mb-4 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Par gamme</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data.gammeSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
              {data.gammeSplit.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {data.gammeSplit.map((g, i) => (
            <div key={g.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[10px] text-black/50">{g.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
