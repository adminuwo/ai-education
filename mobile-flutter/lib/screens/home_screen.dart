import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../components/language_switcher.dart';
import 'login_screen.dart';
import 'tasks_screen.dart';
import 'homework_screen.dart';
import 'legal_study_hub_screen.dart';
import 'attendance_screen.dart';
import 'chat_channels_screen.dart';
import 'meetings_screen.dart';
import 'parent_student_portal_screen.dart';
import 'finance_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? orgData;

  const HomeScreen({super.key, this.userData, this.orgData});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _org;
  String? _briefing;
  bool _briefingLoading = false;
  Map<String, dynamic>? _attendanceStats;
  Map<String, dynamic>? _dashboardData;
  int _activeTaskCount = 0;
  int _pendingHomeworkCount = 0;
  bool _statsLoaded = false;
  bool _refreshing = false;
  double _attendancePercentage = 0.0;

  bool get _hasAiLegal {
    if (_org == null) return false;
    if (_org!['hasAiLegal'] == true) return true;
    final addons = _org!['addons'];
    if (addons is List && addons.contains('AI_LEGAL')) return true;
    final desc = _org!['description']?.toString() ?? '';
    return desc.contains('[ADDONS:') && desc.contains('AI_LEGAL');
  }

  String get _currentRole {
    return (_org?['role'] ?? _user?['role'] ?? _user?['systemRole'] ?? 'STUDENT').toString().toUpperCase();
  }

  bool get _isStudent => _currentRole == 'STUDENT';
  bool get _isParent => _currentRole == 'PARENT';
  bool get _isTeacher => _currentRole == 'TEACHER';
  bool get _isAccountant => _currentRole == 'ACCOUNTANT';
  bool get _isLeadership => [
    'ADMIN', 'DIRECTOR', 'PRINCIPAL', 'DEAN', 'HOD', 'OWNER', 'SUPER_ADMIN'
  ].contains(_currentRole) || (_user?['systemRole']?.toString().toUpperCase() == 'SUPER_ADMIN');
  bool get _isStaff => !_isStudent && !_isParent;

  @override
  void initState() {
    super.initState();
    _user = widget.userData ?? ApiService.currentUser;
    _org = widget.orgData ?? ApiService.currentOrg;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _briefingLoading = true;
    });

    try {
      // If user/org wasn't passed or role is missing, fetch full context from /auth/me
      if (_user == null || _org == null || _org!['role'] == null || _org!['id'] == null) {
        final me = await ApiService.getMe();
        if (me != null) {
          _user = ApiService.currentUser ?? _user;
          _org = ApiService.currentOrg ?? _org;
        }
      }

      final orgId = _org?['id']?.toString() ?? ApiService.currentOrgId;
      if (orgId != null && orgId.isNotEmpty) {
        final results = await Future.wait([
          ApiService.getDailyBriefing(orgId).catchError((_) => null),
          ApiService.getDashboard(orgId).catchError((_) => null),
          ApiService.getAttendanceStats(orgId).catchError((_) => null),
          ApiService.getTasks(orgId: orgId, isHomework: false).catchError((_) => <dynamic>[]),
          ApiService.getTasks(orgId: orgId, isHomework: true).catchError((_) => <dynamic>[]),
        ]);

        if (mounted) {
          final tasksList = (results[3] as List<dynamic>?) ?? [];
          final homeworkList = (results[4] as List<dynamic>?) ?? [];

          final activeTasks = tasksList.where((t) => t is Map && t['status'] != 'COMPLETED').length;
          final pendingHw = homeworkList.where((t) => t is Map && t['status'] != 'COMPLETED').length;

          double studentAttendance = 0.0;
          if (_isStudent) {
            final targetId = _user?['id']?.toString() ?? '';
            if (targetId.isNotEmpty) {
              try {
                final report = await ApiService.getChildReport(targetId, orgId: orgId);
                if (report != null && report['attendance'] != null) {
                  final pct = report['attendance']['percentage'];
                  if (pct != null) studentAttendance = (pct as num).toDouble();
                }
              } catch (_) {}
            }
          }

          setState(() {
            _briefing = results[0] as String?;
            _dashboardData = results[1] as Map<String, dynamic>?;
            _attendanceStats = results[2] as Map<String, dynamic>?;
            _activeTaskCount = activeTasks;
            _pendingHomeworkCount = pendingHw;
            _attendancePercentage = studentAttendance;
            _statsLoaded = true;
          });
        }
      }
    } catch (_) {
      // Handle network errors gracefully
    } finally {
      if (mounted) {
        setState(() {
          _briefingLoading = false;
          _refreshing = false;
        });
      }
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return LanguageService.tr('home.goodMorning', fallback: 'Good morning');
    if (hour < 17) return LanguageService.tr('home.goodAfternoon', fallback: 'Good afternoon');
    return LanguageService.tr('home.goodEvening', fallback: 'Good evening');
  }

  Drawer _buildDrawer(BuildContext context, String userName, String role, String orgName) {
    return Drawer(
      backgroundColor: ConveeColors.card,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF062E22), ConveeColors.cardLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border(bottom: BorderSide(color: ConveeColors.border)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: ConveeColors.primary.withOpacity(0.2),
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                        style: const TextStyle(color: ConveeColors.primary, fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName,
                            style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold, fontSize: 16),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            orgName,
                            style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ConveeColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: ConveeColors.primary.withOpacity(0.3)),
                  ),
                  child: Text(
                    role.toUpperCase(),
                    style: const TextStyle(color: ConveeColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard_outlined, color: ConveeColors.primary, size: 22),
            title: const Text('Dashboard', style: TextStyle(color: ConveeColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.fact_check_outlined, color: ConveeColors.emerald, size: 22),
            title: Text((_isStudent || _isParent) ? 'My Attendance' : 'Class Attendance', style: const TextStyle(color: ConveeColors.text, fontSize: 14)),
            subtitle: Text((_isStudent || _isParent) ? 'Personal History' : 'Rosters & Standing', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => AttendanceScreen(orgData: _org, userData: _user)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.menu_book_outlined, color: ConveeColors.amber, size: 22),
            title: const Text('Homework & Rubrics', style: TextStyle(color: ConveeColors.text, fontSize: 14)),
            subtitle: Text(_isStudent ? 'Submissions & Deadlines' : 'Grading & Assignments', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => HomeworkScreen(orgData: _org, userData: _user)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.chat_bubble_outline, color: ConveeColors.purple, size: 22),
            title: const Text('Messages & Channels', style: TextStyle(color: ConveeColors.text, fontSize: 14)),
            subtitle: const Text('Cohort Direct Messaging', style: TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ChatChannelsScreen(orgData: _org, userData: _user)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.videocam_outlined, color: ConveeColors.destructive, size: 22),
            title: const Text('Live Meetings', style: TextStyle(color: ConveeColors.text, fontSize: 14)),
            subtitle: const Text('Video Classes & Sessions', style: TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => MeetingsScreen(orgData: _org, userData: _user)));
            },
          ),
          if (_isStudent || _isParent)
            ListTile(
              leading: const Icon(Icons.family_restroom_outlined, color: ConveeColors.textSecondary, size: 22),
              title: Text(_isParent ? 'Parent Portal' : 'Student Portal', style: const TextStyle(color: ConveeColors.text, fontSize: 14)),
              subtitle: const Text('Academic Ward Directory', style: TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => ParentStudentPortalScreen(orgData: _org, userData: _user)));
              },
            ),
          if (_isStaff)
            ListTile(
              leading: const Icon(Icons.account_balance_wallet_outlined, color: ConveeColors.emerald, size: 22),
              title: Text(_isLeadership || _isAccountant ? 'Finance & Payslips' : 'My Payslips', style: const TextStyle(color: ConveeColors.text, fontSize: 14)),
              subtitle: Text(_isLeadership || _isAccountant ? 'Fee Ledgers & Salaries' : 'Monthly Salary Slips', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => FinanceScreen(orgData: _org, userData: _user)));
              },
            ),
          if (_isStaff)
            ListTile(
              leading: const Icon(Icons.task_alt_outlined, color: ConveeColors.primary, size: 22),
              title: const Text('Campus Tasks & Operations', style: TextStyle(color: ConveeColors.text, fontSize: 14)),
              subtitle: const Text('Delegated Duties', style: TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => TasksScreen(orgData: _org, userData: _user)));
              },
            ),
          if (_hasAiLegal)
            ListTile(
              leading: const Icon(Icons.balance, color: ConveeColors.amber, size: 22),
              title: const Text('Judicial & ADP Exam Hub', style: TextStyle(color: ConveeColors.text, fontSize: 14)),
              subtitle: const Text('Bare Acts & PYQs', style: TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => LegalStudyHubScreen(orgData: _org, userData: _user)));
              },
            ),
          const Divider(color: ConveeColors.border),
          ListTile(
            leading: const Icon(Icons.person_outline, color: ConveeColors.textSecondary, size: 22),
            title: const Text('Account & Settings', style: TextStyle(color: ConveeColors.text, fontSize: 14)),
            subtitle: const Text('Security, Password & 16KB Info', style: TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(orgData: _org, userData: _user)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout, color: ConveeColors.destructive, size: 22),
            title: const Text('Sign Out', style: TextStyle(color: ConveeColors.destructive, fontSize: 14, fontWeight: FontWeight.w600)),
            onTap: () async {
              Navigator.pop(context);
              await ApiService.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userName = _user?['fullName'] ?? _user?['email']?.toString().split('@').first ?? 'Faculty';
    final orgName = _org?['name'] ?? 'Institution';
    final role = _org?['role'] ?? _user?['systemRole'] ?? 'MEMBER';

    return Scaffold(
      backgroundColor: ConveeColors.background,
      drawer: _buildDrawer(context, userName, role, orgName),
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/logo.png',
                width: 28,
                height: 28,
                errorBuilder: (_, __, ___) => const Icon(Icons.school, color: ConveeColors.primary, size: 24),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                orgName,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          const Center(
            child: Padding(
              padding: EdgeInsets.only(right: 4.0),
              child: LanguageSwitcher(compact: true),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: ConveeColors.textSecondary),
            onPressed: () {
              setState(() => _refreshing = true);
              _loadData();
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline, color: ConveeColors.textSecondary),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => ProfileScreen(orgData: _org, userData: _user)),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: ConveeColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Greeting Banner (Clickable -> ProfileScreen)
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => ProfileScreen(orgData: _org, userData: _user)),
                  );
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: ConveeColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: ConveeColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_getGreeting()},',
                              style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              userName,
                              style: const TextStyle(color: ConveeColors.text, fontSize: 20, fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: ConveeColors.primaryLight,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: ConveeColors.primary.withOpacity(0.4)),
                        ),
                        child: Text(
                          role.toString().toUpperCase(),
                          style: const TextStyle(color: ConveeColors.primary, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // AI Daily Academic Briefing Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF062E22), ConveeColors.card],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: ConveeColors.primary.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.auto_awesome, color: ConveeColors.primary, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              LanguageService.tr('home.aiBriefing', fallback: 'AI Daily Academic Briefing'),
                              style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ],
                        ),
                        if (_briefingLoading)
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(color: ConveeColors.primary, strokeWidth: 2),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _briefing != null && _briefing!.isNotEmpty
                          ? _briefing!
                          : _briefingLoading
                              ? LanguageService.tr('home.generatingBriefing', fallback: 'Connecting to campus intelligence engine...')
                              : LanguageService.tr('home.noBriefing', fallback: 'No urgent announcements or scheduling updates for your cohort today.'),
                      style: TextStyle(
                        color: _briefing != null ? ConveeColors.text : ConveeColors.textSecondary,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              if (_hasAiLegal) ...[
                // Judicial & ADP Exam Hub High-Priority Action Banner
                InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => LegalStudyHubScreen(orgData: _org, userData: _user),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF2E1C05),
                          ConveeColors.card,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: ConveeColors.amber.withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: ConveeColors.amber.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.gavel, color: ConveeColors.amber, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    LanguageService.tr('home.judicialHub', fallback: 'Judicial & ADP Exam Hub'),
                                    style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: ConveeColors.amber,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'LEGAL',
                                      style: TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Bare Acts, 16+ State PYQs, AI Solver & Transition',
                                style: TextStyle(color: ConveeColors.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, color: ConveeColors.amber, size: 14),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Live Status KPI Cards (Attendance, Tasks, Homework)
              Text(
                LanguageService.tr('home.digitalCampus', fallback: 'Live Campus Analytics'),
                style: const TextStyle(color: ConveeColors.text, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _buildStatCard(
                    label: LanguageService.tr('nav.attendance', fallback: 'Attendance'),
                    value: (_isStudent || _isParent)
                        ? (_attendancePercentage > 0
                            ? '${_attendancePercentage.toStringAsFixed(0)}%'
                            : (_attendanceStats?['percentage'] != null
                                ? '${_attendanceStats!['percentage']}%'
                                : '--'))
                        : (_attendanceStats?['overallCampusPercentage'] != null
                            ? '${_attendanceStats!['overallCampusPercentage']}%'
                            : (_attendanceStats?['percentage'] != null
                                ? '${_attendanceStats!['percentage']}%'
                                : (_attendanceStats?['present'] != null
                                    ? '${_attendanceStats!['present']}'
                                    : '--'))),
                    color: ConveeColors.emerald,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => AttendanceScreen(orgData: _org, userData: _user)),
                      );
                    },
                  ),
                  const SizedBox(width: 10),
                  if (_isStaff) ...[
                    _buildStatCard(
                      label: LanguageService.tr('home.campusTasks', fallback: 'Campus Tasks'),
                      value: _statsLoaded ? '$_activeTaskCount' : '--',
                      color: ConveeColors.primary,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => TasksScreen(orgData: _org, userData: _user)),
                        );
                      },
                    ),
                    const SizedBox(width: 10),
                  ],
                  _buildStatCard(
                    label: LanguageService.tr('nav.homework', fallback: 'Homework'),
                    value: _statsLoaded ? '$_pendingHomeworkCount' : '--',
                    color: ConveeColors.amber,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => HomeworkScreen(orgData: _org, userData: _user)),
                      );
                    },
                  ),
                  if (!_isStaff) ...[
                    const SizedBox(width: 10),
                    _buildStatCard(
                      label: LanguageService.tr('home.liveMeetings', fallback: 'Live Classes'),
                      value: 'Active',
                      color: ConveeColors.destructive,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => MeetingsScreen(orgData: _org, userData: _user)),
                        );
                      },
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 20),

              // Quick Actions Grid (All Modules Connected)
              Text(
                LanguageService.tr('home.quickActions', fallback: 'Academic Modules'),
                style: const TextStyle(color: ConveeColors.text, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),

              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.35,
                children: [
                  if (_isStaff)
                    _buildModuleItem(
                      LanguageService.tr('home.activeTasks', fallback: 'Campus Tasks'),
                      'Operations & Duties',
                      Icons.task_alt_outlined,
                      ConveeColors.primary,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => TasksScreen(orgData: _org, userData: _user)),
                        );
                      },
                    ),
                  _buildModuleItem(
                    LanguageService.tr('nav.homework', fallback: 'Homework'),
                    _isStudent ? 'Submissions & Deadlines' : 'Assignments & Rubrics',
                    Icons.menu_book_outlined,
                    ConveeColors.amber,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => HomeworkScreen(orgData: _org, userData: _user)),
                      );
                    },
                  ),
                  _buildModuleItem(
                    LanguageService.tr('home.logAttendance', fallback: 'Daily Attendance'),
                    (_isStudent || _isParent) ? 'My Standing & History' : 'Roster & Records',
                    Icons.fact_check_outlined,
                    ConveeColors.emerald,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => AttendanceScreen(orgData: _org, userData: _user)),
                      );
                    },
                  ),
                  _buildModuleItem(
                    LanguageService.tr('nav.messages', fallback: 'Class Channels'),
                    'Messaging & Chat',
                    Icons.chat_bubble_outline,
                    ConveeColors.purple,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => ChatChannelsScreen(orgData: _org, userData: _user)),
                      );
                    },
                  ),
                  _buildModuleItem(
                    LanguageService.tr('home.liveMeetings', fallback: 'Live Meetings'),
                    'Classroom Video',
                    Icons.videocam_outlined,
                    ConveeColors.destructive,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => MeetingsScreen(orgData: _org, userData: _user)),
                      );
                    },
                  ),
                  if (_isStudent || _isParent)
                    _buildModuleItem(
                      LanguageService.tr('nav.portal', fallback: 'Campus Portal'),
                      _isParent ? 'Child Performance' : 'Student Academic Ward',
                      Icons.family_restroom_outlined,
                      ConveeColors.textSecondary,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ParentStudentPortalScreen(orgData: _org, userData: _user)),
                        );
                      },
                    ),
                  if (_isStaff)
                    _buildModuleItem(
                      _isLeadership || _isAccountant ? 'Campus Finance' : 'My Payslips',
                      _isLeadership || _isAccountant ? 'Fees & Staff Payslips' : 'Monthly Salary Slips',
                      Icons.account_balance_wallet_outlined,
                      ConveeColors.emerald,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => FinanceScreen(orgData: _org, userData: _user)),
                        );
                      },
                    ),
                  if (_hasAiLegal)
                    _buildModuleItem(
                      LanguageService.tr('home.judicialHub', fallback: 'Judicial Hub'),
                      'Bare Acts & PYQs',
                      Icons.balance,
                      ConveeColors.amber,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => LegalStudyHubScreen(orgData: _org, userData: _user)),
                        );
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String label,
    required String value,
    required Color color,
    VoidCallback? onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            color: ConveeColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ConveeColors.border),
          ),
          child: Column(
            children: [
              Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text(label, style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModuleItem(
    String title,
    String subtitle,
    IconData icon,
    Color color, {
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: ConveeColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ConveeColors.border),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              Text(title, style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(color: ConveeColors.textMuted, fontSize: 10)),
            ],
          ),
        ),
      ),
    );
  }
}
