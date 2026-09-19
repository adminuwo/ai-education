import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { aiApi, dashboardApi, attendanceApi, parentApi, tasksApi, homeworkApi } from '../../lib/api';
import {
  Sparkles,
  BookOpen,
  CalendarCheck,
  MessageSquare,
  RefreshCw,
  Bell,
  ArrowRight,
  GraduationCap,
  Video,
  TrendingUp,
  CheckSquare,
  Scale,
} from 'lucide-react-native';

export default function HomeScreen({ navigation }: any) {
  const { user, currentOrg } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [personalAttendancePct, setPersonalAttendancePct] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTasksCount, setActiveTasksCount] = useState<number | null>(null);
  const [activeHomeworkCount, setActiveHomeworkCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isStudent = currentOrg?.role === 'STUDENT';
  const isParent = currentOrg?.role === 'PARENT';
  const roleUpper = (currentOrg?.role || '').toUpperCase();
  const isHigherAuthority = ['ADMIN', 'DIRECTOR', 'PRINCIPAL', 'DEAN', 'HOD', 'OWNER'].some(
    (r) => roleUpper.includes(r)
  ) || user?.systemRole === 'SUPER_ADMIN';

  const loadData = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      setBriefingLoading(true);
      const promises: Promise<any>[] = [
        aiApi.dailyBriefing(currentOrg.id).catch(() => null),
        dashboardApi.employee(currentOrg.id).catch(() => null),
        tasksApi
          .list(currentOrg.id, { isHomework: 'false' })
          .then((res) => {
            const pending = Array.isArray(res) ? res.filter((t) => t && t.status !== 'COMPLETED').length : 0;
            setActiveTasksCount(pending);
            return pending;
          })
          .catch(() => {
            setActiveTasksCount(0);
            return 0;
          }),
        homeworkApi
          .tasks(currentOrg.id, { isHomework: 'true' })
          .then((res) => {
            const pending = Array.isArray(res)
              ? res.filter((t) => t && t.status !== 'COMPLETED' && (!t.submission || isStudent)).length
              : 0;
            setActiveHomeworkCount(pending);
            return pending;
          })
          .catch(() => {
            setActiveHomeworkCount(0);
            return 0;
          }),
      ];

      if (isStudent && user?.id) {
        promises.push(parentApi.getChildReport(user.id, currentOrg.id).catch(() => null));
      } else if (isParent) {
        promises.push(
          parentApi
            .getMyChildren()
            .then(async (kids) => {
              if (kids?.length > 0) {
                const childId = kids[0].userId || kids[0].user?.id;
                return parentApi.getChildReport(childId, currentOrg.id).catch(() => null);
              }
              return null;
            })
            .catch(() => null)
        );
      } else {
        promises.push(attendanceApi.getStats(currentOrg.id).catch(() => null));
      }

      const [bRes, dRes, _tCount, _hwCount, attRes] = await Promise.all(promises);

      if (bRes?.briefing) setBriefing(bRes.briefing);
      if (dRes) setDashboardData(dRes);

      if (isStudent || isParent) {
        if (attRes?.attendance?.percentage !== undefined) {
          setPersonalAttendancePct(attRes.attendance.percentage);
        }
      } else {
        if (attRes) setAttendanceStats(attRes);
      }
    } catch {
      // ignore
    } finally {
      setBriefingLoading(false);
      setRefreshing(false);
    }
  }, [currentOrg?.id, isParent, isStudent, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const userRole = currentOrg?.role || 'MEMBER';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('home.welcomeBack', 'Welcome back')},</Text>
          <Text
            style={[styles.userName, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user?.fullName || user?.email?.split('@')[0] || 'Member'}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>{userRole}</Text>
        </View>
      </View>

      <Text style={[styles.orgName, { color: colors.textMuted }]}>
        {currentOrg?.name || 'Demo International Academy'}
      </Text>

      {/* AI Executive Daily Briefing Card */}
      <View style={[styles.briefingCard, { backgroundColor: colors.card, borderColor: colors.primaryLight }]}>
        <View style={styles.briefingHeader}>
          <View style={styles.briefingTitleRow}>
            <View style={[styles.sparkleIcon, { backgroundColor: colors.primaryLight }]}>
              <Sparkles size={16} color={colors.primary} />
            </View>
            <Text style={[styles.briefingTitle, { color: colors.text }]}>{t('home.aiBriefing', 'AI Daily Campus Briefing')}</Text>
          </View>
          <TouchableOpacity onPress={loadData} disabled={briefingLoading} style={styles.refreshIconBtn}>
            {briefingLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={15} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.briefingContent, { color: colors.textSecondary }]}>
          {briefing || (briefingLoading ? t('home.generatingBriefing', 'Generating AI daily briefing...') : t('home.noBriefing', 'No campus briefing generated yet today. Tap refresh to generate.'))}
        </Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Attendance KPI */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Attendance')}
          style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.kpiIcon, { backgroundColor: colors.emeraldLight }]}>
            <CalendarCheck size={18} color={colors.emerald} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {isStudent || isParent
              ? personalAttendancePct !== null
                ? `${personalAttendancePct}%`
                : '—'
              : attendanceStats?.overallCampusPercentage !== undefined
              ? `${attendanceStats.overallCampusPercentage}%`
              : '—'}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            {isStudent ? t('home.myAttendance', 'My Attendance') : isParent ? t('home.childAttendance', 'Child Attendance') : t('home.attendanceHealth', 'Attendance Rate')}
          </Text>
        </TouchableOpacity>

        {/* Administrative / Campus Tasks KPI */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Tasks')}
          style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.kpiIcon, { backgroundColor: colors.primaryLight }]}>
            <CheckSquare size={18} color={colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {activeTasksCount !== null ? activeTasksCount : (dashboardData?.myTasks?.length ?? 0)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            {isHigherAuthority ? t('home.campusTasks', 'Campus Tasks') : t('home.myTasks', 'My Tasks')}
          </Text>
        </TouchableOpacity>

        {/* Academic Homework KPI */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Homework')}
          style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.kpiIcon, { backgroundColor: colors.amberLight }]}>
            <BookOpen size={18} color={colors.amber} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {activeHomeworkCount !== null ? activeHomeworkCount : 0}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            {isStudent ? t('home.homeworkDue', 'Homework Due') : isParent ? t('home.childHomework', "Child's Homework") : t('home.homeworkGiven', 'Homework Given')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Navigation */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions', 'Quick Actions')}</Text>
      <View style={styles.actionsList}>
        {/* Judicial & ADP Exam Hub (High-Priority Academic Action) */}
        <TouchableOpacity
          onPress={() => navigation.navigate('LegalStudyHub')}
          style={[
            styles.actionItem,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb',
              borderColor: 'rgba(245, 158, 11, 0.35)',
            },
          ]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Scale size={18} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.actionName, { color: colors.text }]}>{t('home.judicialHub', 'Judicial & ADP Exam Hub')}</Text>
                <View style={{ backgroundColor: '#f59e0b', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Text style={{ color: '#000', fontSize: 9, fontWeight: 'bold' }}>LEGAL</Text>
                </View>
              </View>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                Bare Acts, 16+ State PYQs, AI Solver & BNS Transition
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color="#f59e0b" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Tasks')}
          style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <CheckSquare size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.actionName, { color: colors.text }]}>{t('nav.tasks', 'Campus Tasks & Operations')}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {isHigherAuthority
                  ? 'Assign, track & oversee departmental duties'
                  : 'View & update assigned administrative duties'}
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Homework')}
          style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.amberLight }]}>
              <BookOpen size={18} color={colors.amber} />
            </View>
            <View>
              <Text style={[styles.actionName, { color: colors.text }]}>{t('nav.homework', 'Homework & Rubrics')}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {userRole === 'STUDENT' ? 'Submit assignment solutions' : 'Grade assignments with rubrics'}
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Attendance')}
          style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.emeraldLight }]}>
              <CalendarCheck size={18} color={colors.emerald} />
            </View>
            <View>
              <Text style={[styles.actionName, { color: colors.text }]}>{t('nav.attendance', 'Class Attendance')}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {userRole === 'PARENT' ? "Check child's attendance rate" : '1-Click section attendance logger'}
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Meetings')}
          style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Video size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.actionName, { color: colors.text }]}>{t('home.liveMeetings', 'Live Meetings & Classes')}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                Join audio/video classes with 1-tap Jitsi links
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Analytics')}
          style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.emeraldLight }]}>
              <TrendingUp size={18} color={colors.emerald} />
            </View>
            <View>
              <Text style={[styles.actionName, { color: colors.text }]}>{t('home.academicAnalytics', 'Academic Analytics')}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {userRole === 'STUDENT' || userRole === 'PARENT'
                  ? 'Personal attendance %, rubric grades & feedback'
                  : 'Campus attendance rate & assignment pipeline'}
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {(isStudent || isParent) && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Portal')}
            style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.purpleLight }]}>
                <GraduationCap size={18} color={colors.purple} />
              </View>
              <View>
                <Text style={[styles.actionName, { color: colors.text }]}>
                  {userRole === 'PARENT' ? t('home.parentPortal', 'Parent Portal') : t('home.studentPortal', 'Student Portal')}
                </Text>
                <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                  Mentors, 30-day attendance health & report card
                </Text>
              </View>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('AIScreen')}
          style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.purpleLight }]}>
              <Sparkles size={18} color={colors.purple} />
            </View>
            <View>
              <Text style={[styles.actionName, { color: colors.text }]}>{t('home.aiAssistant', 'AI Academic Assistant')}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {t('home.aiAssistantDesc', 'Generate quiz questions & study help')}
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextWrap: { flex: 1, marginRight: 10 },
  greeting: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  roleBadge: { flexShrink: 0, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  roleText: { fontSize: 11, fontWeight: '800' },
  orgName: { fontSize: 12, fontWeight: '500', marginTop: 4, marginBottom: 16 },
  briefingCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  briefingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  briefingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sparkleIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  briefingTitle: { fontSize: 13, fontWeight: '700' },
  refreshIconBtn: { padding: 4 },
  briefingContent: { fontSize: 12, lineHeight: 18 },
  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  kpiCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16 },
  kpiIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  actionsList: { gap: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 14 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionName: { fontSize: 13, fontWeight: '700' },
  actionDesc: { fontSize: 11, marginTop: 2 },
});
