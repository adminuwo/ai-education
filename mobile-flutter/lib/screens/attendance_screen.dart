import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class AttendanceScreen extends StatefulWidget {
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? orgData;

  const AttendanceScreen({Key? key, this.userData, this.orgData}) : super(key: key);

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _loading = true;
  bool _saving = false;
  String? _message;
  bool _isSuccess = false;

  late String _role;
  bool _isStudent = false;
  bool _isParent = false;
  bool _isLeadership = false;

  // Faculty State
  List<dynamic> _departments = [];
  String? _selectedDeptId;
  String? _selectedTeamId;
  List<dynamic> _sections = [];
  List<Map<String, dynamic>> _students = [];
  Map<String, String> _attendanceMap = {}; // studentId -> status
  DateTime _selectedDate = DateTime.now();

  // Student / Parent State
  Map<String, dynamic>? _attendanceStats;
  double _attendancePercentage = 0.0;
  List<dynamic> _children = [];
  String? _selectedChildId;

  @override
  void initState() {
    super.initState();
    _role = (widget.orgData?['role'] ??
            widget.userData?['role'] ??
            widget.userData?['systemRole'] ??
            ApiService.currentRole)
        .toString()
        .toUpperCase();
    _isStudent = _role == 'STUDENT';
    _isParent = _role == 'PARENT';
    _isLeadership = ['ADMIN', 'DIRECTOR', 'PRINCIPAL', 'DEAN', 'HOD', 'OWNER'].contains(_role) ||
        widget.userData?['systemRole'] == 'SUPER_ADMIN';

    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final orgId = widget.orgData?['id']?.toString() ?? ApiService.currentOrgId ?? '';

    if (_isStudent || _isParent) {
      if (_isParent) {
        final kids = await ApiService.getMyChildren();
        _children = kids;
        if (kids.isNotEmpty) {
          _selectedChildId = kids[0]['userId']?.toString() ?? kids[0]['user']?['id']?.toString();
        }
      }
      final targetId = _isParent ? (_selectedChildId ?? '') : (widget.userData?['id']?.toString() ?? '');
      if (targetId.isNotEmpty) {
        final report = await ApiService.getChildReport(targetId, orgId: orgId);
        if (report != null && report['attendance'] != null) {
          final pct = report['attendance']['percentage'];
          if (pct != null) {
            _attendancePercentage = (pct as num).toDouble();
          }
        }
      }
    } else {
      // Faculty / Leadership: Load departments and class sections
      final depts = await ApiService.getDepartments(orgId);
      _departments = depts;
      _sections = [];
      for (final d in depts) {
        final teams = d['teams'] as List<dynamic>? ?? [];
        for (final t in teams) {
          _sections.add({...t, 'deptName': d['name']});
        }
      }
      if (_sections.isNotEmpty) {
        _selectedTeamId = _sections[0]['id']?.toString();
        await _loadTeamStudents(_selectedTeamId!);
      }

      final stats = await ApiService.getAttendanceStats(orgId);
      _attendanceStats = stats;
    }

    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadTeamStudents(String teamId) async {
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final records = await ApiService.getTeamAttendance(teamId: teamId, date: dateStr);

    final existingMap = <String, String>{};
    for (final r in records) {
      if (r is Map) {
        final sid = (r['studentId'] ?? r['userId'] ?? '').toString();
        final status = (r['status'] ?? 'PRESENT').toString().toUpperCase();
        if (sid.isNotEmpty) existingMap[sid] = status;
      }
    }

    final section = _sections.firstWhere((s) => s['id']?.toString() == teamId, orElse: () => null);
    final memberships = (section?['memberships'] as List<dynamic>?) ?? [];
    final roster = <Map<String, dynamic>>[];

    for (final m in memberships) {
      if (m is Map) {
        final role = (m['role'] ?? '').toString().toUpperCase();
        final user = m['user'] as Map<String, dynamic>? ?? {};
        final sid = (user['id'] ?? m['userId'] ?? m['id'] ?? '').toString();
        if (sid.isNotEmpty && (role == 'STUDENT' || role == 'MEMBER' || role.isEmpty)) {
          roster.add({
            'studentId': sid,
            'id': sid,
            'name': user['fullName'] ?? user['name'] ?? m['title'] ?? 'Student',
            'email': user['email'] ?? '',
            'rollNo': m['userUniqueId'] ?? m['title'] ?? '',
            'role': role,
          });
        }
      }
    }

    _attendanceMap.clear();
    for (final s in roster) {
      final sid = s['studentId'].toString();
      _attendanceMap[sid] = existingMap[sid] ?? 'PRESENT';
    }

    if (mounted) {
      setState(() {
        _students = roster;
      });
    }
  }

  Future<void> _saveAttendanceBatch() async {
    if (_selectedTeamId == null || _students.isEmpty) return;
    final orgId = widget.orgData?['id']?.toString() ?? ApiService.currentOrgId ?? '';
    setState(() {
      _saving = true;
      _message = null;
    });

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final records = _attendanceMap.entries.map((e) => {
      'studentId': e.key,
      'status': e.value,
    }).toList();

    final res = await ApiService.batchLogAttendance(
      orgId: orgId,
      teamId: _selectedTeamId!,
      date: dateStr,
      records: records,
    );

    if (mounted) {
      setState(() {
        _saving = false;
        if (res != null) {
          _isSuccess = true;
          _message = 'Attendance logged successfully for ${_students.length} students!';
        } else {
          _isSuccess = false;
          _message = 'Failed to record attendance. Please try again.';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: Text(LanguageService.tr('nav.attendance', fallback: 'Class Attendance')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: ConveeColors.textSecondary),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: ConveeColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: _isStudent || _isParent ? _buildStudentParentView() : _buildFacultyRegisterView(),
              ),
            ),
    );
  }

  Widget _buildStudentParentView() {
    final isLow = _attendancePercentage < 75.0 && _attendancePercentage > 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_isParent && _children.length > 1) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: ConveeColors.card,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: ConveeColors.border),
            ),
            child: DropdownButton<String>(
              value: _selectedChildId,
              isExpanded: true,
              dropdownColor: ConveeColors.card,
              underline: const SizedBox(),
              items: _children.map((c) {
                final id = c['userId']?.toString() ?? c['user']?['id']?.toString();
                final name = c['user']?['fullName'] ?? 'Child';
                return DropdownMenuItem(value: id, child: Text(name, style: const TextStyle(color: ConveeColors.text)));
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() => _selectedChildId = val);
                  _loadData();
                }
              },
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Attendance Percentage Ring Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: ConveeColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isLow ? ConveeColors.destructive : ConveeColors.primary.withOpacity(0.3)),
          ),
          child: Column(
            children: [
              Text(
                '${_attendancePercentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                  color: isLow ? ConveeColors.destructive : ConveeColors.primary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                isLow ? '⚠️ Low Attendance Alert (< 75%)' : '✅ Attendance in Good Standing (≥ 75%)',
                style: TextStyle(
                  color: isLow ? ConveeColors.destructive : ConveeColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Statutory university guidelines require a minimum of 75% attendance for examination eligibility.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: ConveeColors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFacultyRegisterView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Date & Section Bar
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: ConveeColors.card,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ConveeColors.border),
                ),
                child: DropdownButton<String>(
                  value: _selectedTeamId,
                  isExpanded: true,
                  dropdownColor: ConveeColors.card,
                  underline: const SizedBox(),
                  hint: const Text('Select Class Section', style: TextStyle(color: ConveeColors.textSecondary)),
                  items: _sections.map((s) {
                    final tid = s['id']?.toString();
                    final name = '${s['name']} (${s['deptName'] ?? ''})';
                    return DropdownMenuItem(value: tid, child: Text(name, style: const TextStyle(color: ConveeColors.text, fontSize: 13)));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedTeamId = val);
                      _loadTeamStudents(val);
                    }
                  },
                ),
              ),
            ),
            const SizedBox(width: 10),
            TextButton.icon(
              style: TextButton.styleFrom(
                backgroundColor: ConveeColors.cardSecondary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: const BorderSide(color: ConveeColors.border)),
              ),
              icon: const Icon(Icons.calendar_today, size: 16, color: ConveeColors.primary),
              label: Text(
                DateFormat('dd MMM').format(_selectedDate),
                style: const TextStyle(color: ConveeColors.text, fontSize: 13),
              ),
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                );
                if (picked != null) {
                  setState(() => _selectedDate = picked);
                  if (_selectedTeamId != null) _loadTeamStudents(_selectedTeamId!);
                }
              },
            ),
          ],
        ),

        const SizedBox(height: 16),

        if (_message != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _isSuccess ? ConveeColors.primaryLight : const Color(0x1AEF4444),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _isSuccess ? ConveeColors.primary : ConveeColors.destructive),
            ),
            child: Text(
              _message!,
              style: TextStyle(color: _isSuccess ? ConveeColors.primary : ConveeColors.destructive, fontSize: 13),
            ),
          ),
          const SizedBox(height: 14),
        ],

        // Student Roster
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Student Register (${_students.length})',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: ConveeColors.text),
            ),
            Row(
              children: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      for (final s in _students) {
                        final sid = s['studentId']?.toString() ?? s['id']?.toString() ?? '';
                        _attendanceMap[sid] = 'PRESENT';
                      }
                    });
                  },
                  child: const Text('Mark All Present', style: TextStyle(color: ConveeColors.primary, fontSize: 12)),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),

        if (_students.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: ConveeColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ConveeColors.border),
            ),
            child: const Center(
              child: Text('No students found in this section.', style: TextStyle(color: ConveeColors.textMuted)),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _students.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final s = _students[i];
              final sid = s['studentId']?.toString() ?? s['id']?.toString() ?? '';
              final name = s['user']?['fullName'] ?? s['name'] ?? 'Student $i';
              final currentStatus = _attendanceMap[sid] ?? 'PRESENT';

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: ConveeColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: ConveeColors.border),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: ConveeColors.cardSecondary,
                      radius: 16,
                      child: Text(name.isNotEmpty ? name[0] : 'S', style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(name, style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.w600, fontSize: 14)),
                    ),
                    // Quick Status Buttons
                    _buildStatusChip(sid, 'PRESENT', 'P', ConveeColors.primary, currentStatus == 'PRESENT'),
                    const SizedBox(width: 4),
                    _buildStatusChip(sid, 'ABSENT', 'A', ConveeColors.destructive, currentStatus == 'ABSENT'),
                    const SizedBox(width: 4),
                    _buildStatusChip(sid, 'LATE', 'L', ConveeColors.amber, currentStatus == 'LATE'),
                  ],
                ),
              );
            },
          ),

        const SizedBox(height: 20),

        // Submit Button
        if (_students.isNotEmpty)
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ConveeColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _saving ? null : _saveAttendanceBatch,
              child: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('Save Attendance Register', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
      ],
    );
  }

  Widget _buildStatusChip(String studentId, String status, String label, Color color, bool selected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _attendanceMap[studentId] = status;
        });
      },
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: selected ? color : ConveeColors.cardSecondary,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? color : ConveeColors.border),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : ConveeColors.textSecondary,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
