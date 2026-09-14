import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { tasksApi } from '../../lib/api';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Search,
  X,
  User,
  Calendar,
  Filter,
} from 'lucide-react-native';

export default function TasksScreen() {
  const { user, currentOrg } = useAuth();
  const { colors } = useTheme();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // New Task Modal (for HOD, Dean, Admin, Owner)
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Detail Modal
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const roleUpper = (currentOrg?.role || '').toUpperCase();
  const isHigherAuthority = ['ADMIN', 'DIRECTOR', 'PRINCIPAL', 'DEAN', 'HOD', 'OWNER'].some(
    (r) => roleUpper.includes(r)
  ) || user?.systemRole === 'SUPER_ADMIN';

  const loadTasks = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await tasksApi.list(currentOrg.id, params);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentOrg?.id, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleToggleStatus = async (task: any) => {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      await tasksApi.updateStatus(task.id, nextStatus);
    } catch {
      loadTasks();
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !currentOrg?.id) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }
    setCreating(true);
    try {
      await tasksApi.create({
        orgId: currentOrg.id,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        dueDate: newDueDate.trim() || undefined,
      });
      setCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      loadTasks();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  // Client-side search filtering fallback for instant responsiveness
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#EF4444';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search & Header Bar */}
      <View style={[styles.headerSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              {isHigherAuthority ? 'Campus Tasks Oversight' : 'My Assigned Tasks'}
            </Text>
            <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
              {isHigherAuthority
                ? `${currentOrg?.role || 'Authority'} Mode • Full Institutional Visibility`
                : 'Tasks assigned to you & operational duties'}
            </Text>
          </View>
          {isHigherAuthority && (
            <TouchableOpacity
              onPress={() => setCreateModal(true)}
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.createBtnText}>New Task</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tasks by title or keyword..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setStatusFilter(st)}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                statusFilter === st && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  statusFilter === st && { color: '#ffffff', fontWeight: '700' },
                ]}
              >
                {st === 'ALL' ? 'All Tasks' : st === 'IN_PROGRESS' ? 'In Progress' : st.charAt(0) + st.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTasks();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading live tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <CheckSquare size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'No tasks match your search criteria.'
                : isHigherAuthority
                ? 'All campus tasks are cleared. Tap "+ New Task" to assign work.'
                : 'You have no pending tasks assigned at this time.'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'COMPLETED';
            const priorityCol = getPriorityColor(t.priority);
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedTask(t)}
                style={[
                  styles.taskCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isDone && { opacity: 0.75 },
                ]}
              >
                <View style={styles.taskCardHeader}>
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(t)}
                    style={styles.checkboxBtn}
                  >
                    {isDone ? (
                      <CheckCircle2 size={22} color="#10B981" />
                    ) : (
                      <Circle size={22} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: colors.text },
                        isDone && { textDecorationLine: 'line-through', color: colors.textMuted },
                      ]}
                    >
                      {t.title}
                    </Text>
                    {t.description ? (
                      <Text
                        style={[styles.taskDesc, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {t.description}
                      </Text>
                    ) : null}
                  </View>

                  <View style={[styles.priorityBadge, { backgroundColor: priorityCol + '20' }]}>
                    <Text style={[styles.priorityText, { color: priorityCol }]}>
                      {t.priority}
                    </Text>
                  </View>
                </View>

                {/* Footer Meta */}
                <View style={[styles.taskFooter, { borderTopColor: colors.border }]}>
                  {t.dueDate ? (
                    <View style={styles.metaItem}>
                      <Clock size={13} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null}

                  {t.assignees && t.assignees.length > 0 ? (
                    <View style={styles.metaItem}>
                      <User size={13} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {t.assignees.map((a: any) => a.user?.fullName || 'Member').join(', ')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>Unassigned</Text>
                  )}

                  <Text
                    style={[
                      styles.statusBadge,
                      { color: isDone ? '#10B981' : colors.primary },
                    ]}
                  >
                    {t.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal visible={!!selectedTask} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Task Details</Text>
              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <ScrollView style={{ maxHeight: 450 }}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedTask.title}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedTask.priority) }]}>
                      {selectedTask.priority}
                    </Text>
                  </View>
                  <Text style={[styles.statusBadge, { color: selectedTask.status === 'COMPLETED' ? '#10B981' : colors.primary }]}>
                    Status: {selectedTask.status}
                  </Text>
                </View>

                {selectedTask.description ? (
                  <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>
                    {selectedTask.description}
                  </Text>
                ) : null}

                {selectedTask.dueDate ? (
                  <View style={[styles.metaItem, { marginVertical: 8 }]}>
                    <Calendar size={15} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.text }]}>
                      Target Due Date: {new Date(selectedTask.dueDate).toLocaleString()}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={() => {
                    handleToggleStatus(selectedTask);
                    setSelectedTask(null);
                  }}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: selectedTask.status === 'COMPLETED' ? '#EF4444' : '#10B981' },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {selectedTask.status === 'COMPLETED' ? 'Reopen Task (Mark To-Do)' : 'Mark Task as Completed'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Campus Task</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Task Title *</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Prepare NBA Accreditation Dossier"
                placeholderTextColor={colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Description & Objectives</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, height: 80 }]}
                placeholder="Specify duties, deliverables, and targets..."
                placeholderTextColor={colors.textMuted}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
              <View style={styles.prioritySelector}>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setNewPriority(p)}
                    style={[
                      styles.priorityOption,
                      { borderColor: colors.border },
                      newPriority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        { color: colors.textSecondary },
                        newPriority === p && { color: '#ffffff', fontWeight: '700' },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleCreateTask}
                disabled={creating}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
              >
                {creating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create & Publish Task</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { padding: 16, borderBottomWidth: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: '700' },
  pageSub: { fontSize: 12, marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  createBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '500' },
  listContent: { padding: 16, gap: 12 },
  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 13 },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 16 },
  taskCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkboxBtn: { paddingTop: 2 },
  taskTitle: { fontSize: 15, fontWeight: '600' },
  taskDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  priorityText: { fontSize: 10, fontWeight: '800' },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 11 },
  statusBadge: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  detailTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  detailDesc: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  prioritySelector: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityOptionText: { fontSize: 11, fontWeight: '600' },
});
