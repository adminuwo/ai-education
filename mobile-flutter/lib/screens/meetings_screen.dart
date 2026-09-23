import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class MeetingsScreen extends StatefulWidget {
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? orgData;

  const MeetingsScreen({Key? key, this.userData, this.orgData}) : super(key: key);

  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen> {
  bool _loading = true;
  List<dynamic> _meetings = [];

  // Schedule Meeting State
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  DateTime _startTime = DateTime.now().add(const Duration(minutes: 30));
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _loadMeetings();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadMeetings() async {
    setState(() => _loading = true);
    final orgId = widget.orgData?['id']?.toString() ?? '';
    final list = await ApiService.getMeetings(orgId);
    if (mounted) {
      setState(() {
        _meetings = list;
        _loading = false;
      });
    }
  }

  Future<void> _joinMeeting(String? url) async {
    if (url == null || url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No meeting link available.')),
      );
      return;
    }
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not launch video meeting link.')),
      );
    }
  }

  void _showScheduleModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ConveeColors.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Schedule Live Class / Meeting', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: ConveeColors.text)),
              const SizedBox(height: 16),
              TextField(
                controller: _titleController,
                style: const TextStyle(color: ConveeColors.text),
                decoration: InputDecoration(
                  hintText: 'e.g. Physics Class 12-A Live Lecture',
                  hintStyle: const TextStyle(color: ConveeColors.textMuted),
                  filled: true,
                  fillColor: ConveeColors.cardSecondary,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descController,
                style: const TextStyle(color: ConveeColors.text),
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Brief agenda or topic breakdown...',
                  hintStyle: const TextStyle(color: ConveeColors.textMuted),
                  filled: true,
                  fillColor: ConveeColors.cardSecondary,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ConveeColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _creating ? null : () async {
                    if (_titleController.text.trim().isEmpty) return;
                    setModalState(() => _creating = true);
                    final orgId = widget.orgData?['id']?.toString() ?? '';
                    final roomName = 'convee-${DateTime.now().millisecondsSinceEpoch}';
                    final jitsiUrl = 'https://meet.jit.si/$roomName';

                    await ApiService.createMeeting({
                      'orgId': orgId,
                      'title': _titleController.text.trim(),
                      'description': _descController.text.trim(),
                      'startTime': _startTime.toIso8601String(),
                      'endTime': _startTime.add(const Duration(hours: 1)).toIso8601String(),
                      'meetingUrl': jitsiUrl,
                      'location': 'Jitsi Secure Video',
                    });

                    _titleController.clear();
                    _descController.clear();
                    if (mounted) {
                      Navigator.pop(ctx);
                      _loadMeetings();
                    }
                  },
                  child: _creating
                      ? const CircularProgressIndicator(color: Colors.black)
                      : const Text('Schedule & Create Jitsi Room', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = (widget.orgData?['role'] ?? widget.userData?['systemRole'] ?? '').toString().toUpperCase();
    final canSchedule = !['STUDENT', 'PARENT'].contains(role);

    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: Text(LanguageService.tr('nav.meetings', fallback: 'Live Meetings & Classes')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: ConveeColors.textSecondary),
            onPressed: _loadMeetings,
          ),
        ],
      ),
      floatingActionButton: canSchedule
          ? FloatingActionButton.extended(
              backgroundColor: ConveeColors.primary,
              icon: const Icon(Icons.video_call, color: Colors.black),
              label: const Text('Schedule Class', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              onPressed: _showScheduleModal,
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
          : RefreshIndicator(
              onRefresh: _loadMeetings,
              color: ConveeColors.primary,
              child: _meetings.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.videocam_off_outlined, size: 54, color: ConveeColors.textMuted),
                          const SizedBox(height: 12),
                          const Text('No live meetings or classes scheduled.', style: TextStyle(color: ConveeColors.textSecondary)),
                          const SizedBox(height: 8),
                          if (canSchedule)
                            TextButton(
                              onPressed: _showScheduleModal,
                              child: const Text('Schedule one now', style: TextStyle(color: ConveeColors.primary)),
                            ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _meetings.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (ctx, i) {
                        final m = _meetings[i];
                        final title = m['title'] ?? 'Live Session';
                        final desc = m['description'] ?? '';
                        final url = m['meetingUrl']?.toString();
                        final startStr = m['startTime'] != null
                            ? DateFormat('EEE, dd MMM • hh:mm a').format(DateTime.parse(m['startTime']))
                            : 'Scheduled';

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: ConveeColors.card,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: ConveeColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: ConveeColors.primaryLight,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    alignment: Alignment.center,
                                    child: const Icon(Icons.video_camera_front, color: ConveeColors.primary, size: 22),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: ConveeColors.text)),
                                        const SizedBox(height: 4),
                                        Text(startStr, style: const TextStyle(fontSize: 12, color: ConveeColors.amber, fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              if (desc.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Text(desc, style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 13)),
                              ],
                              const SizedBox(height: 14),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: ConveeColors.primary,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    icon: const Icon(Icons.play_arrow, color: Colors.black, size: 18),
                                    label: const Text('Join Video Class', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                                    onPressed: () => _joinMeeting(url),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
