import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class ParentStudentPortalScreen extends StatefulWidget {
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? orgData;

  const ParentStudentPortalScreen({Key? key, this.userData, this.orgData}) : super(key: key);

  @override
  State<ParentStudentPortalScreen> createState() => _ParentStudentPortalScreenState();
}

class _ParentStudentPortalScreenState extends State<ParentStudentPortalScreen> {
  bool _loading = true;
  late String _role;
  bool _isParent = false;
  List<dynamic> _children = [];
  String? _selectedStudentId;
  Map<String, dynamic>? _studentReport;

  @override
  void initState() {
    super.initState();
    _role = (widget.orgData?['role'] ??
            widget.userData?['role'] ??
            widget.userData?['systemRole'] ??
            ApiService.currentRole)
        .toString()
        .toUpperCase();
    _isParent = _role == 'PARENT';
    _loadPortalData();
  }

  Future<void> _loadPortalData() async {
    setState(() => _loading = true);
    final orgId = widget.orgData?['id']?.toString() ?? ApiService.currentOrgId ?? '';

    if (_isParent) {
      final kids = await ApiService.getMyChildren();
      _children = kids;
      if (kids.isNotEmpty) {
        _selectedStudentId = kids[0]['userId']?.toString() ?? kids[0]['user']?['id']?.toString();
      }
    } else {
      _selectedStudentId = widget.userData?['id']?.toString() ?? ApiService.currentUser?['id']?.toString() ?? '';
    }

    if (_selectedStudentId != null && _selectedStudentId!.isNotEmpty) {
      final report = await ApiService.getChildReport(_selectedStudentId!, orgId: orgId);
      _studentReport = report;
    }

    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: Text(_isParent
            ? LanguageService.tr('nav.parentPortal', fallback: 'Parent Portal')
            : LanguageService.tr('nav.studentPortal', fallback: 'Student Portal')),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadPortalData),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Child Switcher for Parents
                  if (_isParent && _children.length > 1) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: ConveeColors.card,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ConveeColors.border),
                      ),
                      child: DropdownButton<String>(
                        value: _selectedStudentId,
                        isExpanded: true,
                        dropdownColor: ConveeColors.card,
                        underline: const SizedBox(),
                        items: _children.map((c) {
                          final id = c['userId']?.toString() ?? c['user']?['id']?.toString();
                          final name = c['user']?['fullName'] ?? 'Student';
                          return DropdownMenuItem(value: id, child: Text(name, style: const TextStyle(color: ConveeColors.text)));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedStudentId = val);
                            _loadPortalData();
                          }
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Student Profile Card
                  _buildStudentHeaderCard(),
                  const SizedBox(height: 16),

                  // Attendance & Academics Metric Cards
                  _buildMetricsRow(),
                  const SizedBox(height: 16),

                  // Class Section & Mentor Info
                  _buildClassMentorCard(),
                  const SizedBox(height: 16),

                  // Institutional Performance & Guidelines
                  _buildInstitutionalGuidelinesCard(),
                ],
              ),
            ),
    );
  }

  Widget _buildStudentHeaderCard() {
    final user = _studentReport?['user'] ?? widget.userData ?? {};
    final name = user['fullName'] ?? user['name'] ?? 'Student User';
    final email = user['email'] ?? '';
    final team = _studentReport?['team']?['name'] ?? 'Class Section 10-A';
    final dept = _studentReport?['department']?['name'] ?? 'High School Academic Wing';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: ConveeColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ConveeColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: ConveeColors.purpleLight,
            child: const Icon(Icons.school, size: 30, color: ConveeColors.purple),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: ConveeColors.text)),
                const SizedBox(height: 2),
                Text(email, style: const TextStyle(fontSize: 12, color: ConveeColors.textMuted)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ConveeColors.emeraldLight,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text('$team • $dept', style: const TextStyle(color: ConveeColors.emerald, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsRow() {
    final attPct = _studentReport?['attendance']?['percentage'] ?? 88.5;
    final isGoodStanding = (attPct as num) >= 75.0;

    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: ConveeColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ConveeColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Attendance', style: TextStyle(color: ConveeColors.textMuted, fontSize: 12)),
                const SizedBox(height: 6),
                Text('${attPct.toStringAsFixed(1)}%', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: isGoodStanding ? ConveeColors.emerald : ConveeColors.destructive)),
                const SizedBox(height: 4),
                Text(isGoodStanding ? 'Eligible for Exams' : 'Attendance Shortage', style: TextStyle(color: isGoodStanding ? ConveeColors.emerald : ConveeColors.destructive, fontSize: 11, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: ConveeColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ConveeColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Academic Term', style: TextStyle(color: ConveeColors.textMuted, fontSize: 12)),
                const SizedBox(height: 6),
                const Text('Term 1', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: ConveeColors.text)),
                const SizedBox(height: 4),
                const Text('Session 2026-2027', style: TextStyle(color: ConveeColors.amber, fontSize: 11, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildClassMentorCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: ConveeColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ConveeColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Class Mentor & Staff Room Contact', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: ConveeColors.text)),
          const SizedBox(height: 12),
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: ConveeColors.cardSecondary,
                child: const Icon(Icons.person, color: ConveeColors.textSecondary),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Assigned Class Teacher', style: TextStyle(color: ConveeColors.text, fontWeight: FontWeight.w600, fontSize: 14)),
                    SizedBox(height: 2),
                    Text('Available during office hours via Channels', style: TextStyle(color: ConveeColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInstitutionalGuidelinesCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ConveeColors.cardSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ConveeColors.border),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: ConveeColors.amber, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Digital report cards and official transcripts are signed cryptographically by the Principal and HOD upon semester completion.',
              style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
