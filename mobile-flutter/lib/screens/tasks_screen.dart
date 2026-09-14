import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';

class TasksScreen extends StatefulWidget {
  final Map<String, dynamic>? orgData;
  final Map<String, dynamic>? userData;

  const TasksScreen({super.key, this.orgData, this.userData});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<dynamic> _tasks = [];
  bool _loading = true;
  bool _refreshing = false;
  String _searchQuery = '';
  String _statusFilter = 'ALL';
  String _priorityFilter = 'ALL';

  final TextEditingController _searchController = TextEditingController();

  bool get _isHigherAuthority {
    final role = (widget.orgData?['role'] ?? widget.userData?['role'] ?? '').toString().toUpperCase();
    final systemRole = (widget.userData?['systemRole'] ?? '').toString().toUpperCase();
    if (systemRole == 'SUPER_ADMIN') return true;
    return ['ADMIN', 'DIRECTOR', 'PRINCIPAL', 'DEAN', 'HOD', 'OWNER'].any((r) => role.contains(r));
  }

  String get _orgId => widget.orgData?['id']?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTasks() async {
    if (_orgId.isEmpty) {
      setState(() => _loading = false);
      return;
    }

    try {
      final tasks = await ApiService.getTasks(
        orgId: _orgId,
        isHomework: false,
        status: _statusFilter != 'ALL' ? _statusFilter : null,
        priority: _priorityFilter != 'ALL' ? _priorityFilter : null,
        search: _searchQuery.trim().isNotEmpty ? _searchQuery.trim() : null,
      );

      if (mounted) {
        setState(() {
          _tasks = tasks;
          _loading = false;
          _refreshing = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _refreshing = false;
        });
      }
    }
  }

  Future<void> _handleToggleStatus(Map<String, dynamic> task) async {
    final taskId = task['id']?.toString() ?? '';
    final currentStatus = task['status']?.toString() ?? 'TODO';
    final nextStatus = currentStatus == 'COMPLETED' ? 'TODO' : 'COMPLETED';

    setState(() {
      task['status'] = nextStatus;
    });

    try {
      await ApiService.updateTaskStatus(taskId, nextStatus);
    } catch (_) {
      _loadTasks();
    }
  }

  Color _getPriorityColor(String? priority) {
    switch ((priority ?? '').toUpperCase()) {
      case 'URGENT':
        return ConveeColors.destructive;
      case 'HIGH':
        return ConveeColors.amber;
      case 'MEDIUM':
        return ConveeColors.primary;
      default:
        return ConveeColors.textMuted;
    }
  }

  List<dynamic> get _filteredTasks {
    return _tasks.where((t) {
      if (t is! Map) return false;
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final title = (t['title'] ?? '').toString().toLowerCase();
        final desc = (t['description'] ?? '').toString().toLowerCase();
        if (!title.contains(q) && !desc.contains(q)) return false;
      }
      if (_statusFilter != 'ALL' && t['status'] != _statusFilter) return false;
      if (_priorityFilter != 'ALL' && t['priority'] != _priorityFilter) return false;
      return true;
    }).toList();
  }

  void _showCreateTaskDialog() {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    String selectedPriority = 'MEDIUM';
    DateTime? selectedDueDate;
    bool creating = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Container(
          decoration: const BoxDecoration(
            color: ConveeColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Assign Campus Task',
                      style: TextStyle(color: ConveeColors.text, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: ConveeColors.textSecondary),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Task Title *', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'e.g. Prepare NBA Accreditation Dossier',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.cardSecondary,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.primary)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Description & Objectives', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: descController,
                  maxLines: 3,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Specify duties, deliverables, and targets...',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.cardSecondary,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.primary)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Priority', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(
                  children: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) {
                    final isSelected = selectedPriority == p;
                    final pColor = _getPriorityColor(p);
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setSheetState(() => selectedPriority = p),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? pColor : ConveeColors.cardSecondary,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: isSelected ? pColor : ConveeColors.border),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            p,
                            style: TextStyle(
                              color: isSelected ? Colors.white : ConveeColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                // Due date selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      selectedDueDate == null
                          ? 'No due date set'
                          : 'Due: ${selectedDueDate!.day}/${selectedDueDate!.month}/${selectedDueDate!.year}',
                      style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 13),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.calendar_month, size: 16, color: ConveeColors.primary),
                      label: const Text('Pick Due Date', style: TextStyle(color: ConveeColors.primary, fontSize: 13)),
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now().add(const Duration(days: 3)),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (picked != null) {
                          setSheetState(() => selectedDueDate = picked);
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ConveeColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: creating
                        ? null
                        : () async {
                            final title = titleController.text.trim();
                            if (title.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter a task title.')),
                              );
                              return;
                            }

                            setSheetState(() => creating = true);
                            try {
                              await ApiService.createTask(
                                orgId: _orgId,
                                title: title,
                                description: descController.text.trim().isNotEmpty ? descController.text.trim() : null,
                                priority: selectedPriority,
                                dueDate: selectedDueDate?.toIso8601String(),
                              );
                              if (mounted) {
                                Navigator.pop(ctx);
                                _loadTasks();
                              }
                            } catch (_) {
                              setSheetState(() => creating = false);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Failed to create task. Please try again.')),
                                );
                              }
                            }
                          },
                    child: creating
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Create & Publish Task', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showTaskDetail(Map<String, dynamic> task) {
    final isDone = task['status'] == 'COMPLETED';
    final priority = task['priority']?.toString() ?? 'MEDIUM';
    final pColor = _getPriorityColor(priority);
    final assignees = (task['assignees'] as List<dynamic>?) ?? [];
    final assigneeNames = assignees.map((a) => a['user']?['fullName'] ?? 'Member').join(', ');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: ConveeColors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Task Details', style: TextStyle(color: ConveeColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(
                  icon: const Icon(Icons.close, color: ConveeColors.textSecondary),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              task['title']?.toString() ?? '',
              style: TextStyle(
                color: ConveeColors.text,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                decoration: isDone ? TextDecoration.lineThrough : null,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: pColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    priority,
                    style: TextStyle(color: pColor, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (isDone ? ConveeColors.emerald : ConveeColors.primary).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    task['status']?.toString() ?? 'TODO',
                    style: TextStyle(
                      color: isDone ? ConveeColors.emerald : ConveeColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            if (task['description'] != null && task['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 14),
              Text(
                task['description'].toString(),
                style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 13, height: 1.4),
              ),
            ],
            if (task['dueDate'] != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.access_time, size: 14, color: ConveeColors.textMuted),
                  const SizedBox(width: 6),
                  Text(
                    'Due: ${task['dueDate'].toString().split('T').first}',
                    style: const TextStyle(color: ConveeColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
            ],
            if (assigneeNames.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 14, color: ConveeColors.textMuted),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Assigned to: $assigneeNames',
                      style: const TextStyle(color: ConveeColors.textMuted, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDone ? ConveeColors.destructive : ConveeColors.emerald,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: Icon(isDone ? Icons.replay : Icons.check_circle_outline, color: Colors.white, size: 18),
                label: Text(
                  isDone ? 'Reopen Task (Mark To-Do)' : 'Mark Task as Completed',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  _handleToggleStatus(task);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = (widget.orgData?['role'] ?? 'Authority').toString().toUpperCase();

    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isHigherAuthority ? 'Campus Tasks Oversight' : 'My Assigned Tasks',
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            Text(
              _isHigherAuthority ? '$role Mode • Full Institutional Visibility' : 'Tasks assigned to you & operational duties',
              style: const TextStyle(fontSize: 11, color: ConveeColors.textSecondary),
            ),
          ],
        ),
        actions: [
          if (_isHigherAuthority)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: ConveeColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.add, size: 16, color: Colors.white),
                label: const Text('New Task', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: _showCreateTaskDialog,
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            decoration: const BoxDecoration(
              color: ConveeColors.card,
              border: Border(bottom: BorderSide(color: ConveeColors.border)),
            ),
            child: Column(
              children: [
                // Search Input
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: ConveeColors.cardSecondary,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ConveeColors.border),
                  ),
                  child: Row(
                    children: [
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: Icon(Icons.search, size: 18, color: ConveeColors.textMuted),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          style: const TextStyle(color: ConveeColors.text, fontSize: 13),
                          decoration: const InputDecoration(
                            hintText: 'Search tasks by title or keyword...',
                            hintStyle: TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                          onChanged: (val) {
                            setState(() => _searchQuery = val);
                          },
                        ),
                      ),
                      if (_searchQuery.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.close, size: 16, color: ConveeColors.textMuted),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // Status Chips Row
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map((st) {
                      final isSelected = _statusFilter == st;
                      String label = st;
                      if (st == 'ALL') label = 'All Tasks';
                      if (st == 'IN_PROGRESS') label = 'In Progress';
                      if (st == 'TODO') label = 'To Do';
                      if (st == 'REVIEW') label = 'Review';
                      if (st == 'COMPLETED') label = 'Completed';

                      return GestureDetector(
                        onTap: () {
                          setState(() => _statusFilter = st);
                          _loadTasks();
                        },
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? ConveeColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isSelected ? ConveeColors.primary : ConveeColors.border),
                          ),
                          child: Text(
                            label,
                            style: TextStyle(
                              color: isSelected ? Colors.white : ConveeColors.textSecondary,
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Task List
          Expanded(
            child: _loading && !_refreshing
                ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
                : RefreshIndicator(
                    onRefresh: () async {
                      setState(() => _refreshing = true);
                      await _loadTasks();
                    },
                    color: ConveeColors.primary,
                    child: _filteredTasks.isEmpty
                        ? Center(
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.check_circle_outline, size: 48, color: ConveeColors.textMuted),
                                  const SizedBox(height: 12),
                                  const Text('No tasks found', style: TextStyle(color: ConveeColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 6),
                                  Text(
                                    _searchQuery.isNotEmpty
                                        ? 'No tasks match your search criteria.'
                                        : _isHigherAuthority
                                            ? 'All campus tasks are cleared. Tap "+ New Task" to assign work.'
                                            : 'You have no pending tasks assigned at this time.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredTasks.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final task = _filteredTasks[index] as Map<String, dynamic>;
                              final isDone = task['status'] == 'COMPLETED';
                              final priority = task['priority']?.toString() ?? 'MEDIUM';
                              final pColor = _getPriorityColor(priority);
                              final assignees = (task['assignees'] as List<dynamic>?) ?? [];
                              final assigneeNames = assignees.map((a) => a['user']?['fullName'] ?? 'Member').join(', ');
                              final dueDateStr = task['dueDate'] != null ? task['dueDate'].toString().split('T').first : null;

                              return InkWell(
                                onTap: () => _showTaskDetail(task),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: ConveeColors.card,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: ConveeColors.border),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          GestureDetector(
                                            onTap: () => _handleToggleStatus(task),
                                            child: Padding(
                                              padding: const EdgeInsets.only(right: 10, top: 2),
                                              child: Icon(
                                                isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                                                color: isDone ? ConveeColors.emerald : ConveeColors.textMuted,
                                                size: 20,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  task['title']?.toString() ?? '',
                                                  style: TextStyle(
                                                    color: ConveeColors.text,
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w600,
                                                    decoration: isDone ? TextDecoration.lineThrough : null,
                                                  ),
                                                ),
                                                if (task['description'] != null && task['description'].toString().isNotEmpty) ...[
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    task['description'].toString(),
                                                    maxLines: 2,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 12),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: pColor.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              priority,
                                              style: TextStyle(color: pColor, fontSize: 10, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      const Divider(height: 1, color: ConveeColors.border),
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          if (dueDateStr != null)
                                            Row(
                                              children: [
                                                const Icon(Icons.access_time, size: 12, color: ConveeColors.textMuted),
                                                const SizedBox(width: 4),
                                                Text('Due: $dueDateStr', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
                                              ],
                                            )
                                          else
                                            Text(
                                              assigneeNames.isNotEmpty ? assigneeNames : 'Unassigned',
                                              style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          Text(
                                            task['status']?.toString() ?? 'TODO',
                                            style: TextStyle(
                                              color: isDone ? ConveeColors.emerald : ConveeColors.primary,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
