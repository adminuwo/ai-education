import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';

class HomeworkScreen extends StatefulWidget {
  final Map<String, dynamic>? orgData;
  final Map<String, dynamic>? userData;

  const HomeworkScreen({super.key, this.orgData, this.userData});

  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  List<dynamic> _tasks = [];
  bool _loading = true;
  bool _refreshing = false;
  String _filterTab = 'ALL';
  String _searchQuery = '';

  final TextEditingController _searchController = TextEditingController();

  String get _orgId => widget.orgData?['id']?.toString() ?? ApiService.currentOrgId ?? '';
  bool get _isStudent => (widget.orgData?['role'] ?? widget.userData?['role'] ?? ApiService.currentRole).toString().toUpperCase() == 'STUDENT';

  @override
  void initState() {
    super.initState();
    _loadHomework();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHomework() async {
    if (_orgId.isEmpty) {
      setState(() => _loading = false);
      return;
    }

    try {
      final data = await ApiService.getTasks(
        orgId: _orgId,
        isHomework: true,
        status: _filterTab != 'ALL' ? _filterTab : null,
        search: _searchQuery.trim().isNotEmpty ? _searchQuery.trim() : null,
        assignee: _isStudent ? 'me' : null,
      );

      if (mounted) {
        setState(() {
          _tasks = data;
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

  List<dynamic> get _filteredTasks {
    return _tasks.where((t) {
      if (t is! Map) return false;
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final title = (t['title'] ?? '').toString().toLowerCase();
        final desc = (t['description'] ?? '').toString().toLowerCase();
        if (!title.contains(q) && !desc.contains(q)) return false;
      }
      if (_filterTab != 'ALL' && t['status'] != _filterTab) return false;
      return true;
    }).toList();
  }

  void _showSubmitModal(Map<String, dynamic> task) {
    final contentController = TextEditingController();
    final urlController = TextEditingController();
    bool submitting = false;

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
                    const Text('Submit Homework Solution', style: TextStyle(color: ConveeColors.text, fontSize: 17, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.close, color: ConveeColors.textSecondary),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Your Solution / Answers *', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: contentController,
                  maxLines: 4,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Type your solution or answers here...',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.cardSecondary,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.primary)),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Attachment Link / Google Drive URL (Optional)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: urlController,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'https://drive.google.com/file/d/...',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.cardSecondary,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: ConveeColors.primary)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ConveeColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: submitting
                        ? null
                        : () async {
                            final content = contentController.text.trim();
                            if (content.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter your solution or answers.')),
                              );
                              return;
                            }

                            setSheetState(() => submitting = true);
                            try {
                              await ApiService.submitHomework(
                                task['id'].toString(),
                                content: content,
                                attachmentUrl: urlController.text.trim().isNotEmpty ? urlController.text.trim() : null,
                              );
                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Homework submitted successfully!')),
                                );
                                _loadHomework();
                              }
                            } catch (_) {
                              setSheetState(() => submitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Failed to submit homework. Please check connection.')),
                                );
                              }
                            }
                          },
                    child: submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Submit to Teacher', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showGradingModal(Map<String, dynamic> task, [Map<String, dynamic>? submission]) {
    final rubric = submission?['rubricScores'] as Map<String, dynamic>?;
    final accCtrl = TextEditingController(text: rubric?['accuracy']?.toString() ?? '25');
    final compCtrl = TextEditingController(text: rubric?['completeness']?.toString() ?? '25');
    final formCtrl = TextEditingController(text: rubric?['formatting']?.toString() ?? '25');
    final effCtrl = TextEditingController(text: rubric?['effort']?.toString() ?? '25');
    final notesCtrl = TextEditingController(text: submission?['feedbackNotes']?.toString() ?? '');
    bool grading = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) {
          final acc = num.tryParse(accCtrl.text) ?? 0;
          final comp = num.tryParse(compCtrl.text) ?? 0;
          final form = num.tryParse(formCtrl.text) ?? 0;
          final eff = num.tryParse(effCtrl.text) ?? 0;
          final total = acc + comp + form + eff;

          return Container(
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
                      const Text('Rubric Grading Portal', style: TextStyle(color: ConveeColors.text, fontSize: 17, fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.close, color: ConveeColors.textSecondary),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Text('Grade student submission out of 100 points:', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                  const SizedBox(height: 14),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Accuracy (/25)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            TextField(
                              controller: accCtrl,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: ConveeColors.cardSecondary,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                              onChanged: (_) => setSheetState(() {}),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Completeness (/25)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            TextField(
                              controller: compCtrl,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: ConveeColors.cardSecondary,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                              onChanged: (_) => setSheetState(() {}),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Formatting (/25)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            TextField(
                              controller: formCtrl,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: ConveeColors.cardSecondary,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                              onChanged: (_) => setSheetState(() {}),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Effort (/25)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            TextField(
                              controller: effCtrl,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: ConveeColors.cardSecondary,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                              onChanged: (_) => setSheetState(() {}),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: ConveeColors.emeraldLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Rubric Score:', style: TextStyle(color: ConveeColors.emerald, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('$total / 100', style: const TextStyle(color: ConveeColors.emerald, fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  const Text('Teacher Feedback', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: notesCtrl,
                    style: const TextStyle(color: ConveeColors.text, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. Good effort! Clear steps shown.',
                      hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 12),
                      filled: true,
                      fillColor: ConveeColors.cardSecondary,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ConveeColors.emerald,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: grading
                          ? null
                          : () async {
                              setSheetState(() => grading = true);
                              try {
                                final subId = submission?['id']?.toString() ?? 'default-sub';
                                await ApiService.gradeHomeworkSubmission(
                                  task['id'].toString(),
                                  submissionId: subId,
                                  gradeScore: total,
                                  gradeMax: 100,
                                  rubricScores: {
                                    'accuracy': acc,
                                    'completeness': comp,
                                    'formatting': form,
                                    'effort': eff,
                                  },
                                  feedbackNotes: notesCtrl.text.trim().isNotEmpty ? notesCtrl.text.trim() : null,
                                );
                                if (context.mounted) {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Rubric grade recorded!')),
                                  );
                                  _loadHomework();
                                }
                              } catch (_) {
                                setSheetState(() => grading = false);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Failed to save grade. Please check connection.')),
                                  );
                                }
                              }
                            },
                      child: grading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Approve & Save Grade', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showHomeworkDetail(Map<String, dynamic> task) {
    final taskId = task['id']?.toString() ?? '';
    List<dynamic> submissions = [];
    bool subsLoading = true;
    bool fetchInitiated = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          if (!fetchInitiated) {
            fetchInitiated = true;
            ApiService.getHomeworkSubmissions(taskId).then((res) {
              if (mounted) {
                setModalState(() {
                  submissions = res;
                  subsLoading = false;
                });
              }
            }).catchError((_) {
              if (mounted) {
                setModalState(() => subsLoading = false);
              }
            });
          }

          final isDone = task['status'] == 'COMPLETED';
          final isReview = task['status'] == 'REVIEW';
          final statusColor = isDone ? ConveeColors.emerald : isReview ? ConveeColors.amber : ConveeColors.primary;
          final dueDateStr = task['dueDate'] != null ? task['dueDate'].toString().split('T').first : 'Next Class';

          return Container(
            decoration: const BoxDecoration(
              color: ConveeColors.card,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: const EdgeInsets.all(20),
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          task['title']?.toString() ?? '',
                          style: const TextStyle(color: ConveeColors.text, fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: ConveeColors.textSecondary),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          task['status']?.toString() ?? 'TODO',
                          style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text('Due: $dueDateStr', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 14),

                  const Text('Instructions & Objectives', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: ConveeColors.cardSecondary,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    child: Text(
                      task['description'] != null && task['description'].toString().isNotEmpty
                          ? task['description'].toString()
                          : 'No detailed instructions specified for this assignment.',
                      style: const TextStyle(color: ConveeColors.text, fontSize: 13, height: 1.4),
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Text('Submissions & Rubrics', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),

                  if (subsLoading)
                    const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(color: ConveeColors.primary)))
                  else if (submissions.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: ConveeColors.cardSecondary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: const Column(
                        children: [
                          Icon(Icons.description_outlined, color: ConveeColors.textMuted, size: 28),
                          SizedBox(height: 6),
                          Text('No student submissions recorded yet.', style: TextStyle(color: ConveeColors.textMuted, fontSize: 12)),
                        ],
                      ),
                    )
                  else
                    ...submissions.map((sub) {
                      final grade = sub['gradeScore'];
                      final rubricScores = sub['rubricScores'] as Map<String, dynamic>?;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: ConveeColors.cardSecondary,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: ConveeColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  sub['student']?['fullName'] ?? sub['student']?['email'] ?? 'Student Submission',
                                  style: const TextStyle(color: ConveeColors.text, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (grade != null ? ConveeColors.emerald : ConveeColors.amber).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    grade != null ? '$grade / 100' : 'Pending Grade',
                                    style: TextStyle(
                                      color: grade != null ? ConveeColors.emerald : ConveeColors.amber,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (sub['content'] != null) ...[
                              const SizedBox(height: 6),
                              Text('Solution: ${sub['content']}', style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                            ],
                            if (sub['attachmentUrl'] != null) ...[
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.attach_file, size: 14, color: ConveeColors.primary),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      sub['attachmentUrl'].toString(),
                                      style: const TextStyle(color: ConveeColors.primary, fontSize: 11),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            if (rubricScores != null) ...[
                              const SizedBox(height: 8),
                              const Divider(height: 1, color: ConveeColors.border),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _buildRubricMini('Accuracy', rubricScores['accuracy']),
                                  _buildRubricMini('Completeness', rubricScores['completeness']),
                                  _buildRubricMini('Format', rubricScores['formatting']),
                                  _buildRubricMini('Effort', rubricScores['effort']),
                                ],
                              ),
                            ],
                            if (sub['feedbackNotes'] != null) ...[
                              const SizedBox(height: 6),
                              Text('Feedback: "${sub['feedbackNotes']}"', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic)),
                            ],
                            if (!_isStudent) ...[
                              const SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                height: 32,
                                child: OutlinedButton.icon(
                                  icon: const Icon(Icons.grade, size: 14, color: ConveeColors.emerald),
                                  label: Text(grade != null ? 'Update Grade' : 'Grade Submission', style: const TextStyle(color: ConveeColors.emerald, fontSize: 11)),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: ConveeColors.emerald),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    _showGradingModal(task, sub as Map<String, dynamic>?);
                                  },
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    }),

                  const SizedBox(height: 16),
                  if (_isStudent && task['status'] == 'TODO')
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ConveeColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.send, size: 16, color: Colors.white),
                        label: const Text('Submit My Solution', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _showSubmitModal(task);
                        },
                      ),
                    )
                  else if (!_isStudent && submissions.isEmpty)
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ConveeColors.emerald,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.grade, size: 16, color: Colors.white),
                        label: const Text('Grade with Rubric', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _showGradingModal(task);
                        },
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRubricMini(String label, dynamic score) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: ConveeColors.textMuted, fontSize: 9)),
        const SizedBox(height: 2),
        Text('${score ?? 25}/25', style: const TextStyle(color: ConveeColors.text, fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Academic Homework', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            Text('Course assignments, submissions & rubrics', style: TextStyle(fontSize: 11, color: ConveeColors.textSecondary)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search & Filter Bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            decoration: const BoxDecoration(
              color: ConveeColors.card,
              border: Border(bottom: BorderSide(color: ConveeColors.border)),
            ),
            child: Column(
              children: [
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
                            hintText: 'Search homework by title or keyword...',
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

                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['ALL', 'TODO', 'REVIEW', 'COMPLETED'].map((tab) {
                      final isSelected = _filterTab == tab;
                      return GestureDetector(
                        onTap: () {
                          setState(() => _filterTab = tab);
                          _loadHomework();
                        },
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? ConveeColors.amber : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isSelected ? ConveeColors.amber : ConveeColors.border),
                          ),
                          child: Text(
                            tab,
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

          // Homework List
          Expanded(
            child: _loading && !_refreshing
                ? const Center(child: CircularProgressIndicator(color: ConveeColors.amber))
                : RefreshIndicator(
                    onRefresh: () async {
                      setState(() => _refreshing = true);
                      await _loadHomework();
                    },
                    color: ConveeColors.amber,
                    child: _filteredTasks.isEmpty
                        ? Center(
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.menu_book_outlined, size: 48, color: ConveeColors.textMuted),
                                  const SizedBox(height: 12),
                                  const Text('No homework found', style: TextStyle(color: ConveeColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 6),
                                  Text(
                                    _searchQuery.isNotEmpty
                                        ? 'No homework assignments match your search query.'
                                        : 'No pending homework items found in this section.',
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
                              final isReview = task['status'] == 'REVIEW';
                              final statusColor = isDone ? ConveeColors.emerald : isReview ? ConveeColors.amber : ConveeColors.primary;
                              final dueDateStr = task['dueDate'] != null ? task['dueDate'].toString().split('T').first : 'Next Class';

                              return InkWell(
                                onTap: () => _showHomeworkDetail(task),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: ConveeColors.card,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: statusColor.withOpacity(0.3)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              task['title']?.toString() ?? '',
                                              style: const TextStyle(color: ConveeColors.text, fontSize: 15, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: statusColor.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              task['status']?.toString() ?? 'TODO',
                                              style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (task['description'] != null && task['description'].toString().isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          task['description'].toString(),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 12),
                                        ),
                                      ],
                                      const SizedBox(height: 10),
                                      const Divider(height: 1, color: ConveeColors.border),
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              const Icon(Icons.access_time, size: 12, color: ConveeColors.textMuted),
                                              const SizedBox(width: 4),
                                              Text('Due: $dueDateStr', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
                                            ],
                                          ),

                                          // Contextual Action Button
                                          if (_isStudent && task['status'] == 'TODO')
                                            GestureDetector(
                                              onTap: () => _showSubmitModal(task),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: ConveeColors.primary,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: const Row(
                                                  children: [
                                                    Icon(Icons.send, size: 11, color: Colors.white),
                                                    SizedBox(width: 4),
                                                    Text('Submit', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                                  ],
                                                ),
                                              ),
                                            )
                                          else if (!_isStudent && isReview)
                                            GestureDetector(
                                              onTap: () => _showGradingModal(task),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: ConveeColors.emerald,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: const Row(
                                                  children: [
                                                    Icon(Icons.grade, size: 11, color: Colors.white),
                                                    SizedBox(width: 4),
                                                    Text('Grade Rubric', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                                  ],
                                                ),
                                              ),
                                            )
                                          else
                                            Row(
                                              children: [
                                                Text(
                                                  isDone ? 'View Score' : 'Details',
                                                  style: const TextStyle(color: ConveeColors.primary, fontSize: 12, fontWeight: FontWeight.bold),
                                                ),
                                                const Icon(Icons.chevron_right, size: 14, color: ConveeColors.primary),
                                              ],
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
