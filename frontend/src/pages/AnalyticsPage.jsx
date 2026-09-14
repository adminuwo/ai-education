import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Users, LayoutList, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';
import AiLegalTelemetryCard from '@/components/admin/AiLegalTelemetryCard';

const STATUS_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

function initials(n) {
  return (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
}

export default function AnalyticsPage() {
  const { currentOrg } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workloadView, setWorkloadView] = useState('list'); // 'list' | 'chart'

  useEffect(() => {
    if (!currentOrg?.id) return;
    (async () => {
      setLoading(true);
      try {
        setData(await dashboardApi.analytics(currentOrg.id));
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [currentOrg?.id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const workloadItems = data?.workload || [];
  const maxTasks = Math.max(...workloadItems.map((w) => w.count), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 lg:p-8 space-y-6" data-testid="analytics-page">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold mb-2">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Institutional Intelligence</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Campus & Academic Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Institutional performance, workload distribution, and verified staff research telemetry</p>
      </div>

      {/* AI-Legal Academic Research & Feature Telemetry Dashboard */}
      {currentOrg?.hasAiLegal && (
        <AiLegalTelemetryCard
          orgId={currentOrg.id}
          orgName={currentOrg.name}
          hasAiLegal={currentOrg.hasAiLegal}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="glass-card-highlight border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Communication activity (last 7d)</span>
              <span className="text-xs text-muted-foreground font-normal">Daily Messages</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.messagesPerDay || []} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="msgLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Messages"
                  stroke="url(#msgLineGrad)"
                  strokeWidth={2.5}
                  dot={{ fill: '#00F2FE', r: 3, strokeWidth: 1, stroke: '#070B14' }}
                  activeDot={{ r: 5, fill: '#00F2FE', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card-highlight border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Task completion status</span>
              <span className="text-xs text-muted-foreground font-normal">Org Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="_count._all"
                  data={data?.taskCompletion?.map(t => ({ name: t.status.replace('_', ' '), _count: { _all: t._count._all } })) || []}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(data?.taskCompletion || []).map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Faculty & Staff Workload distribution with Sleek Leaderboard & Visual Chart Toggle */}
        <Card className="lg:col-span-2 glass-card-highlight border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span>Faculty & Staff Workload Distribution</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time active tasks assigned across academic departments and staff members.
                </CardDescription>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setWorkloadView('list')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    workloadView === 'list'
                      ? 'bg-background text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Rank List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkloadView('chart')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    workloadView === 'chart'
                      ? 'bg-background text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Bar Graph</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {workloadItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mb-2" />
                <p className="text-sm font-medium">All clear! No pending tasks assigned.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned tasks will appear in this workload distribution.</p>
              </div>
            ) : workloadView === 'list' ? (
              <div className="space-y-2.5">
                {workloadItems.map((w, index) => {
                  const rawName = w.user?.fullName || 'Unknown';
                  const match = rawName.match(/^(.*?)(?:\s*\((.*?)\))?$/);
                  const cleanName = match && match[1] ? match[1].trim() : rawName;
                  const role = match && match[2] ? match[2] : 'Staff';
                  const percent = Math.min(100, Math.round((w.count / maxTasks) * 100));

                  return (
                    <div
                      key={w.user?.id || index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card/60 hover:bg-card border border-border/70 hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/60 text-[11px] font-mono text-muted-foreground shrink-0">
                        #{index + 1}
                      </div>

                      <Avatar className="h-8 w-8 border border-border/80 shrink-0">
                        <AvatarImage src={w.user?.avatarUrl} />
                        <AvatarFallback className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400">
                          {initials(cleanName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm font-semibold text-foreground group-hover:text-cyan-400 transition-colors truncate">
                              {cleanName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground uppercase tracking-wider font-semibold">
                              {role}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-cyan-400 shrink-0">
                            {w.count} {w.count === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden border border-border/40">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadItems.map((w) => ({
                      name: w.user?.fullName || 'Unknown',
                      tasks: w.count,
                    }))}
                    margin={{ top: 10, right: 10, left: -15, bottom: 40 }}
                  >
                    <defs>
                      <linearGradient id="workloadBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F2FE" stopOpacity={0.95} />
                        <stop offset="70%" stopColor="#38BDF8" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      tickLine={false}
                      tickFormatter={(val) => (val && val.length > 24 ? val.slice(0, 22) + '…' : val)}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent)/0.12)', rx: 4 }} />
                    <Bar dataKey="tasks" name="Active Tasks" fill="url(#workloadBarGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

