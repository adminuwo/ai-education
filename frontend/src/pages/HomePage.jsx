import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { dashboardApi, aiExtendedApi, studentQuizApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ListTodo, MessageSquare, Sparkles, TrendingUp, Users, Building2, Layers, BarChart3, Bell, Timer, Newspaper, RefreshCw, Flame, Play, BookOpen, Zap, Award, GraduationCap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomTooltip from '@/components/CustomTooltip';
import FormattedMarkdown from '@/components/FormattedMarkdown';

function initials(n) { return (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); }

const STATUS_COLORS = { TODO: 'hsl(var(--muted-foreground))', IN_PROGRESS: 'hsl(var(--chart-1))', REVIEW: 'hsl(var(--chart-3))', COMPLETED: 'hsl(var(--chart-4))', BLOCKED: 'hsl(var(--destructive))', CANCELLED: 'hsl(var(--muted))' };

const TONE_STYLES = {
  primary: {
    iconWrap: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    topBorder: 'before:bg-emerald-500',
    hoverBorder: 'hover:border-emerald-500/40',
  },
  accent: {
    iconWrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    topBorder: 'before:bg-amber-500',
    hoverBorder: 'hover:border-amber-500/40',
  },
  warning: {
    iconWrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    topBorder: 'before:bg-amber-500',
    hoverBorder: 'hover:border-amber-500/40',
  },
  info: {
    iconWrap: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    topBorder: 'before:bg-teal-500',
    hoverBorder: 'hover:border-teal-500/40',
  },
};

function KpiCard({ icon: Icon, label, value, tone = 'primary', testid }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.primary;
  return (
    <Card
      className={`relative overflow-hidden glass-card-highlight border-border/80 transition-all ${styles.hoverBorder} before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] ${styles.topBorder} before:opacity-80`}
      data-testid={testid}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className="font-display text-2xl md:text-3xl font-bold tracking-tight tabular-nums mt-1 text-foreground">{value ?? '-'}</div>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${styles.iconWrap} shadow-2xs`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user, currentOrg } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [empData, setEmpData] = useState(null);
  const [mgrData, setMgrData] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [dailyBriefing, setDailyBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [studentQuiz, setStudentQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = currentOrg?.role;
  const isStudent = role === 'STUDENT' || user?.email?.toLowerCase().includes('student');

  useEffect(() => {
    if (role === 'PARENT') {
      navigate('/app/parent', { replace: true });
    } else if (role === 'ACCOUNTANT' || user?.systemRole === 'ACCOUNTANT' || user?.email?.toLowerCase().includes('accountant')) {
      navigate('/app/accountant', { replace: true });
    }
  }, [role, user, navigate]);

  const isManagerPlus = ['OWNER', 'ADMIN', 'PRINCIPAL', 'DEAN', 'HOD', 'DIRECTOR'].includes(role);
  const isAdmin = ['OWNER', 'ADMIN', 'PRINCIPAL', 'DIRECTOR'].includes(role);

  const getStatusLabel = (status) => {
    if (!status) return '';
    switch (status) {
      case 'TODO': return t('tasks.statusTodo', 'To do');
      case 'IN_PROGRESS': return t('tasks.statusInProgress', 'In progress');
      case 'REVIEW': return t('tasks.statusReview', 'In review');
      case 'COMPLETED': return t('tasks.statusCompleted', 'Completed');
      case 'BLOCKED': return t('tasks.statusBlocked', 'Blocked');
      case 'CANCELLED': return t('tasks.statusCancelled', 'Cancelled');
      default: return status.replace('_', ' ');
    }
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return '';
    switch (priority) {
      case 'LOW': return t('tasks.priorityLow', 'Low');
      case 'MEDIUM': return t('tasks.priorityMedium', 'Medium');
      case 'HIGH': return t('tasks.priorityHigh', 'High');
      case 'URGENT': return t('tasks.priorityUrgent', 'Urgent');
      default: return priority;
    }
  };

  const fetchBriefing = useCallback(async () => {
    if (!currentOrg?.id || isStudent) return;
    setBriefingLoading(true);
    try {
      const res = await aiExtendedApi.dailyBriefing(currentOrg.id);
      setDailyBriefing(res?.briefing || '');
    } catch (e) {
      setDailyBriefing('');
    } finally {
      setBriefingLoading(false);
    }
  }, [currentOrg?.id, isStudent]);

  const isLoadedRef = React.useRef(false);

  useEffect(() => {
    if (!currentOrg?.id) return;
    if (!isStudent) {
      fetchBriefing();
    }
    (async () => {
      if (!isLoadedRef.current) {
        setLoading(true);
      }
      try {
        const [e, m, o, sq] = await Promise.all([
          dashboardApi.employee(currentOrg.id).catch(() => null),
          isManagerPlus ? dashboardApi.manager(currentOrg.id).catch(() => null) : Promise.resolve(null),
          isAdmin ? dashboardApi.orgAdmin(currentOrg.id).catch(() => null) : Promise.resolve(null),
          isStudent ? studentQuizApi.getDailyStatus(currentOrg.id).catch(() => null) : Promise.resolve(null),
        ]);
        setEmpData(e); setMgrData(m); setOrgData(o); setStudentQuiz(sq);
        isLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    })();
  }, [currentOrg?.id, isAdmin, isManagerPlus, isStudent, fetchBriefing]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="p-4 sm:p-6 lg:p-8 space-y-6" data-testid="home-page">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{t('home.welcomeBack', 'Good to see you')}, {user?.fullName?.split(' ')[0] || 'there'}.</h1>
        <p className="text-muted-foreground mt-1">{t('home.happeningToday', "Here's what's happening in")} <span className="text-foreground font-medium">{currentOrg?.name}</span> {t('home.today', 'today.')}</p>
      </div>

      {/* Student Daily Adaptive Quiz Card */}
      {isStudent ? (
        <Card className="border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-background rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold px-2 py-0.5 border border-emerald-500/30 text-[11px]">
                    <Zap className="h-3 w-3 mr-1" />
                    {studentQuiz?.skillTitle || 'Developing (Level 2)'}
                  </Badge>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[11px]">
                    <Flame className="h-3 w-3 mr-1 text-orange-500" />
                    {studentQuiz?.streakDays || 0} {t('home.dayStreak', 'Day Streak')} 🔥
                  </Badge>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  {t('home.dailyQuiz', 'Daily Adaptive Home Practice Quiz')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('home.dailyQuizDesc', '5 curriculum-aligned questions customized to your grade in')} <span className="font-semibold text-foreground">{studentQuiz?.classInfo?.className || t('nav.classroom', 'Class')}</span>. {t('home.completeDailyToLevelUp', 'Complete daily to level up your mastery.')}
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right hidden md:block">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">{t('home.masteryScore', 'Mastery Score')}</div>
                  <div className="text-sm font-bold text-emerald-500 tabular-nums">{studentQuiz?.totalQuizzes > 0 ? `${studentQuiz.skillScore ?? 0}/100` : '0/100'}</div>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate('/app/ai?tab=quiz')}
                  className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md px-4 h-9 gap-1.5 rounded-xl w-full sm:w-auto shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  {studentQuiz?.todayQuiz?.isCompleted ? t('home.reviewQuiz', 'Review Today’s Quiz') : t('home.startQuiz', 'Start Daily Quiz (5 mins)')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* AI Executive Daily Briefing Widget */
        <Card className="border-border bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    {t('home.dailyBriefing', 'AI Executive Daily Briefing')}
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold">
                      {t('home.liveCampusInsights', 'Live Campus Insights')}
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{t('home.briefingSummaryDesc', 'Auto-generated summary for Directors, Principals & Academic Leaders')}</p>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={fetchBriefing}
                disabled={briefingLoading}
                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${briefingLoading ? 'animate-spin' : ''}`} /> {t('home.refreshBriefing', 'Refresh Briefing')}
              </Button>
            </div>

            <div className="mt-3 text-xs leading-relaxed text-foreground/90 p-3 rounded-lg bg-card/80 border border-border/60">
              {briefingLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse py-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> {t('home.synthesizingBriefing', "Synthesizing today's campus briefing...")}
                </div>
              ) : (
                <FormattedMarkdown
                  content={dailyBriefing || `${currentOrg?.name} ${t('home.campusNormal', 'campus is operating normally today. Attendance records, active homework tasks, and faculty announcements are up-to-date.')}`}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Row - varies by role */}
      {isStudent ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="kpi-row">
          <KpiCard icon={BookOpen} label={t('home.myHomework', 'My Homework')} value={empData?.myTasks?.length ?? 0} tone="primary" testid="kpi-homework" />
          <KpiCard icon={Flame} label={t('home.dailyQuizStreak', 'Daily Quiz Streak')} value={`${studentQuiz?.streakDays || 0} ${t('common.days', 'Days')}`} tone="warning" testid="kpi-streak" />
          <KpiCard icon={Zap} label={t('home.masteryScore', 'Mastery Score')} value={studentQuiz?.totalQuizzes > 0 ? `${studentQuiz.skillScore ?? 0}/100` : '0/100'} tone="accent" testid="kpi-mastery" />
          <KpiCard icon={MessageSquare} label={t('home.studyChannels', 'Study Channels')} value={empData?.myChannels ?? 0} tone="info" testid="kpi-channels" />
        </div>
      ) : isAdmin && orgData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="kpi-row">
          <KpiCard icon={Users} label={t('home.members', 'Members')} value={orgData.metrics.members} tone="primary" testid="kpi-members" />
          <KpiCard icon={Building2} label={t('home.departments', 'Departments')} value={orgData.metrics.departments} tone="accent" testid="kpi-departments" />
          <KpiCard icon={Layers} label={t('home.projects', 'Projects')} value={orgData.metrics.projects} tone="info" testid="kpi-projects" />
          <KpiCard icon={Sparkles} label={t('home.aiMessages', 'AI messages')} value={orgData.aiUsage} tone="accent" testid="kpi-ai" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="kpi-row">
          <KpiCard icon={ListTodo} label={t('home.myTasks', 'My tasks')} value={empData?.myTasks?.length ?? 0} tone="primary" testid="kpi-mytasks" />
          <KpiCard icon={Timer} label={t('home.upcomingMeetings', 'Upcoming meetings')} value={empData?.myMeetings?.length ?? 0} tone="accent" testid="kpi-meetings" />
          <KpiCard icon={Bell} label={t('home.unreadNotifs', 'Unread notifs')} value={empData?.unreadNotifications ?? 0} tone="warning" testid="kpi-notifs" />
          <KpiCard icon={MessageSquare} label={t('home.myChannels', 'My channels')} value={empData?.myChannels ?? 0} tone="info" testid="kpi-channels" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My tasks (all roles) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">{t('home.myTasks', 'My tasks')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/tasks')}>{t('home.viewAll', 'View all')}</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(empData?.myTasks || []).slice(0, 6).map((taskItem) => (
                <button key={taskItem.id} onClick={() => navigate('/app/tasks')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left">
                  <div className={`h-2 w-2 rounded-full ${taskItem.status === 'COMPLETED' ? 'bg-emerald-500' : taskItem.status === 'BLOCKED' ? 'bg-destructive' : taskItem.priority === 'URGENT' ? 'bg-orange-500' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{taskItem.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{taskItem.project?.name || t('common.noProject', 'No project')} · {getPriorityLabel(taskItem.priority)}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">{getStatusLabel(taskItem.status)}</Badge>
                </button>
              ))}
              {(!empData?.myTasks?.length) && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {t('home.allClear', "You're all clear. 🎉")} <Button variant="link" onClick={() => navigate('/app/tasks')} className="px-1">{t('home.createTask', 'Create a task')}</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task status donut */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">{t('home.taskStatus', 'Task status')}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="count" data={(empData?.taskStatusChart || []).length ? empData.taskStatusChart : [{ status: 'None', count: 1 }]} innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {(empData?.taskStatusChart || [{ status: 'None' }]).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted))'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(empData?.taskStatusChart || []).map((s) => (
                <div key={s.status} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[s.status] }} />
                  {getStatusLabel(s.status)} <span className="tabular-nums text-muted-foreground">({s.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager view */}
      {isManagerPlus && mgrData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card-highlight">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{t('home.teamWorkload', 'Team workload')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(mgrData.workload || [])
                      .filter((w) => {
                        const r = (w.role || w.user?.role || '').toUpperCase();
                        const email = (w.user?.email || '').toLowerCase();
                        const name = (w.user?.fullName || '').toLowerCase();
                        if (['STUDENT', 'ALUMNI', 'PARENT'].includes(r)) return false;
                        if (email.includes('student') || email.includes('alumni') || email.includes('parent')) return false;
                        if (name === 'student' || name === 'alumni' || name.includes('parent')) return false;
                        return true;
                      })
                      .sort((a, b) => (b.openTasks || 0) - (a.openTasks || 0))
                      .map((w) => {
                        const rawFirstName = w.user?.fullName?.split(' ')[0] || t('common.unknown', 'Unknown');
                        const displayName = rawFirstName.length > 10 ? `${rawFirstName.slice(0, 9)}…` : rawFirstName;
                        return {
                          name: displayName,
                          fullName: w.user?.fullName || t('common.unknown', 'Unknown'),
                          tasks: w.openTasks || 0,
                        };
                      })}
                    margin={{ top: 10, right: 10, left: -15, bottom: 35 }}
                  >
                    <defs>
                      <linearGradient id="mgrWorkloadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      interval={0}
                      tickLine={false}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.15)', rx: 4 }} />
                    <Bar dataKey="tasks" name={t('home.activeTasks', 'Active Tasks')} fill="url(#mgrWorkloadGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card-highlight">
            <CardHeader><CardTitle className="text-base font-semibold">{t('home.recentActivity', 'Recent activity')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(mgrData.recentActivity || []).slice(0, 6).map((tItem) => (
                  <div key={tItem.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={tItem.createdBy?.avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials(tItem.createdBy?.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tItem.title}</div>
                      <div className="text-xs text-muted-foreground">{t('home.updated', 'Updated')} {new Date(tItem.updatedAt).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">{getStatusLabel(tItem.status)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Org admin view */}
      {isAdmin && orgData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">{t('home.memberGrowth', 'Member growth')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={orgData.growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-1))', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">{t('home.orgOverview', 'Organization overview')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label={t('home.teams', 'Teams')} value={orgData.metrics.teams} />
                <Stat label={t('home.channels', 'Channels')} value={orgData.metrics.channels} />
                <Stat label={t('home.tasksTotal', 'Tasks total')} value={orgData.metrics.tasks} />
                <Stat label={t('home.meetings', 'Meetings')} value={orgData.metrics.meetings} />
                <Stat label={t('home.files', 'Files')} value={orgData.metrics.files} />
                <Stat label={t('home.activeChannels', 'Active channels')} value={orgData.channelsActive} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-semibold tabular-nums mt-1">{value ?? '-'}</div>
    </div>
  );
}
