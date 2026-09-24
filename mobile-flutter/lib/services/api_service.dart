import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://education.uwo24.com/api/v1';
  static const String fallbackBaseUrl = 'https://convee-education-977864306871.asia-south1.run.app/api/v1';

  static final ValueNotifier<bool> authState = ValueNotifier<bool>(false);

  static Map<String, dynamic>? currentUser;
  static Map<String, dynamic>? currentOrg;

  static String? get currentOrgId =>
      currentOrg?['id']?.toString() ?? dio.options.headers['x-org-id']?.toString();

  static String get currentRole =>
      (currentOrg?['role'] ?? currentUser?['role'] ?? currentUser?['systemRole'] ?? 'STUDENT')
          .toString()
          .toUpperCase();

  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    final orgId = prefs.getString('currentOrgId');
    final userJson = prefs.getString('currentUser');
    final orgJson = prefs.getString('currentOrg');

    authState.value = token != null && token.isNotEmpty;

    if (userJson != null) {
      try {
        currentUser = jsonDecode(userJson) as Map<String, dynamic>;
      } catch (_) {}
    }
    if (orgJson != null) {
      try {
        currentOrg = jsonDecode(orgJson) as Map<String, dynamic>;
      } catch (_) {}
    }

    if (token != null && token.isNotEmpty) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
    final activeOrgId = orgId ?? currentOrg?['id']?.toString();
    if (activeOrgId != null && activeOrgId.isNotEmpty) {
      dio.options.headers['x-org-id'] = activeOrgId;
    }

    dio.interceptors.clear();
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final p = await SharedPreferences.getInstance();
          final t = p.getString('accessToken');
          final o = p.getString('currentOrgId') ?? currentOrg?['id']?.toString();
          if (t != null && t.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $t';
          }
          if (o != null && o.isNotEmpty) {
            options.headers['x-org-id'] = o;
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          return handler.next(error);
        },
      ),
    );
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? portalMode,
  }) async {
    Response response;
    try {
      response = await dio.post('/auth/login', data: {
        'email': email,
        'password': password,
        if (portalMode != null) 'portalMode': portalMode,
      });
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.connectionError) {
        // Automatic failover retry on secondary live domain (education.uwo24.com)
        final fallbackDio = Dio(
          BaseOptions(
            baseUrl: fallbackBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {'Content-Type': 'application/json'},
          ),
        );
        response = await fallbackDio.post('/auth/login', data: {
          'email': email,
          'password': password,
          if (portalMode != null) 'portalMode': portalMode,
        });
        dio.options.baseUrl = fallbackBaseUrl;
      } else {
        rethrow;
      }
    }

    final data = response.data as Map<String, dynamic>;
    final prefs = await SharedPreferences.getInstance();

    if (data['accessToken'] != null) {
      await prefs.setString('accessToken', data['accessToken'].toString());
      dio.options.headers['Authorization'] = 'Bearer ${data['accessToken']}';
    }
    if (data['refreshToken'] != null) {
      await prefs.setString('refreshToken', data['refreshToken'].toString());
    }
    // Ensure org and role context are populated from /auth/me
    if (data['org'] == null || data['org']['id'] == null) {
      try {
        final meRes = await dio.get('/auth/me');
        if (meRes.data is Map) {
          final meData = meRes.data as Map<String, dynamic>;
          final memberships = meData['memberships'] as List<dynamic>?;
          if (memberships != null && memberships.isNotEmpty) {
            final cur = memberships.first as Map<String, dynamic>;
            final org = cur['organization'] as Map<String, dynamic>?;
            if (org != null) {
              final orgMap = Map<String, dynamic>.from(org);
              orgMap['role'] = cur['role'];
              orgMap['directorId'] = cur['directorId'];
              orgMap['userUniqueId'] = cur['userUniqueId'];
              data['org'] = orgMap;
            }
          }
          if (data['user'] == null) {
            data['user'] = meData;
          }
        }
      } catch (_) {}
    }

    if (data['user'] != null) {
      currentUser = Map<String, dynamic>.from(data['user'] as Map);
      await prefs.setString('currentUser', jsonEncode(currentUser));
    }

    if (data['org'] != null && data['org']['id'] != null) {
      currentOrg = Map<String, dynamic>.from(data['org'] as Map);
      await prefs.setString('currentOrg', jsonEncode(currentOrg));
      await prefs.setString('currentOrgId', data['org']['id'].toString());
      dio.options.headers['x-org-id'] = data['org']['id'].toString();
    }

    authState.value = true;

    return data;
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken') != null;
  }

  static Future<Map<String, dynamic>?> getMe() async {
    try {
      final res = await dio.get('/auth/me');
      if (res.data is Map) {
        final meData = res.data as Map<String, dynamic>;
        final prefs = await SharedPreferences.getInstance();

        // Hydrate and cache user profile
        final userMap = meData.containsKey('email')
            ? Map<String, dynamic>.from(meData)
            : (meData['user'] is Map ? Map<String, dynamic>.from(meData['user'] as Map) : null);
        if (userMap != null) {
          currentUser = userMap;
          await prefs.setString('currentUser', jsonEncode(userMap));
        }

        // Hydrate and cache active organization with role
        final memberships = meData['memberships'] as List<dynamic>?;
        if (memberships != null && memberships.isNotEmpty) {
          final cur = memberships.first as Map<String, dynamic>;
          final org = cur['organization'] as Map<String, dynamic>?;
          if (org != null) {
            final orgMap = Map<String, dynamic>.from(org);
            orgMap['role'] = cur['role'];
            orgMap['directorId'] = cur['directorId'];
            orgMap['userUniqueId'] = cur['userUniqueId'];
            currentOrg = orgMap;
            await prefs.setString('currentOrg', jsonEncode(orgMap));
            if (orgMap['id'] != null) {
              final oId = orgMap['id'].toString();
              await prefs.setString('currentOrgId', oId);
              dio.options.headers['x-org-id'] = oId;
            }
          }
        }
        return meData;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<String?> getDailyBriefing(String orgId) async {
    try {
      // Backend route is registered as POST /ai/daily-briefing with { orgId }
      final res = await dio.post('/ai/daily-briefing', data: {'orgId': orgId});
      if (res.data is Map && res.data['briefing'] != null) {
        return res.data['briefing'].toString();
      }
    } catch (_) {
      try {
        final fallbackRes = await dio.get('/ai/daily-briefing', queryParameters: {'orgId': orgId});
        return fallbackRes.data['briefing']?.toString();
      } catch (_) {}
    }
    return null;
  }

  static Future<Map<String, dynamic>?> getDashboard(String orgId) async {
    try {
      final res = await dio.get('/dashboard/employee', queryParameters: {'orgId': orgId});
      return res.data as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> getAttendanceStats(String orgId) async {
    try {
      final res = await dio.get('/attendance/stats', queryParameters: {'orgId': orgId});
      return res.data as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<List<dynamic>> getTasks({
    required String orgId,
    bool isHomework = false,
    String? status,
    String? priority,
    String? search,
    String? assignee,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'orgId': orgId,
        'isHomework': isHomework ? 'true' : 'false',
      };
      if (status != null && status.isNotEmpty && status.toLowerCase() != 'all') {
        queryParams['status'] = status;
      }
      if (priority != null && priority.isNotEmpty && priority.toLowerCase() != 'all') {
        queryParams['priority'] = priority;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (assignee != null && assignee.isNotEmpty) {
        queryParams['assignee'] = assignee;
      }

      final res = await dio.get('/tasks', queryParameters: queryParams);
      if (res.data is List) {
        return res.data as List<dynamic>;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> createTask({
    required String orgId,
    required String title,
    String? description,
    String priority = 'MEDIUM',
    String? dueDate,
    bool isHomework = false,
    List<String>? assigneeIds,
  }) async {
    final body = <String, dynamic>{
      'orgId': orgId,
      'title': title,
      'priority': priority,
      'isHomework': isHomework,
      if (description != null && description.isNotEmpty) 'description': description,
      if (dueDate != null && dueDate.isNotEmpty) 'dueDate': dueDate,
      if (assigneeIds != null && assigneeIds.isNotEmpty) 'assigneeIds': assigneeIds,
    };
    final res = await dio.post('/tasks', data: body);
    return res.data as Map<String, dynamic>?;
  }

  static Future<Map<String, dynamic>?> updateTaskStatus(String taskId, String status) async {
    final res = await dio.patch('/tasks/$taskId', data: {'status': status});
    return res.data as Map<String, dynamic>?;
  }

  static Future<List<dynamic>> getHomeworkSubmissions(String taskId) async {
    try {
      final res = await dio.get('/homework/$taskId/submissions');
      if (res.data is List) {
        return res.data as List<dynamic>;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> submitHomework(String taskId, {
    required String content,
    String? attachmentUrl,
  }) async {
    final res = await dio.post('/homework/$taskId/submit', data: {
      'content': content,
      if (attachmentUrl != null && attachmentUrl.isNotEmpty) 'attachmentUrl': attachmentUrl,
    });
    return res.data as Map<String, dynamic>?;
  }

  static Future<Map<String, dynamic>?> gradeHomeworkSubmission(String taskId, {
    required String submissionId,
    required num gradeScore,
    num gradeMax = 100,
    Map<String, dynamic>? rubricScores,
    String? feedbackNotes,
  }) async {
    final res = await dio.post('/homework/$taskId/submissions/$submissionId/grade', data: {
      'gradeScore': gradeScore,
      'gradeMax': gradeMax,
      if (rubricScores != null) 'rubricScores': rubricScores,
      if (feedbackNotes != null && feedbackNotes.isNotEmpty) 'feedbackNotes': feedbackNotes,
    });
    return res.data as Map<String, dynamic>?;
  }

  // -------------------------------------------------------------
  // Legal / Judicial & ADP Exam Hub Endpoints
  // -------------------------------------------------------------

  static Future<List<dynamic>> getLegalLibrary({
    String? category,
    String? state,
    String? search,
    int? year,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (category != null && category.isNotEmpty && category.toLowerCase() != 'all') {
        queryParams['category'] = category;
      }
      if (state != null && state.isNotEmpty && state.toLowerCase() != 'all') {
        queryParams['state'] = state;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (year != null && year > 0) {
        queryParams['year'] = year;
      }

      final res = await dio.get('/legal/library', queryParameters: queryParams);
      if (res.data is List) {
        return res.data as List<dynamic>;
      } else if (res.data is Map && res.data['assets'] is List) {
        return res.data['assets'] as List<dynamic>;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> getLegalAssetContent(String id) async {
    try {
      final res = await dio.get('/legal/assets/$id');
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<List<dynamic>> compareCriminalLaws({
    String? query,
    String? category,
    int? page,
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (query != null && query.trim().isNotEmpty) {
        queryParams['query'] = query.trim();
      }
      if (category != null && category.isNotEmpty && category.toLowerCase() != 'all') {
        queryParams['category'] = category;
      }
      if (page != null) queryParams['page'] = page;
      if (limit != null) queryParams['limit'] = limit;

      final res = await dio.get('/legal/transition/compare', queryParameters: queryParams);
      if (res.data is List) {
        return res.data as List<dynamic>;
      } else if (res.data is Map && res.data['comparisons'] is List) {
        return res.data['comparisons'] as List<dynamic>;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> exploreStatute({
    required String statuteName,
    required String sectionNumber,
    String? contextQuery,
  }) async {
    try {
      final res = await dio.post('/legal/statutes/explore', data: {
        'statuteName': statuteName,
        'sectionNumber': sectionNumber,
        if (contextQuery != null && contextQuery.isNotEmpty) 'contextQuery': contextQuery,
      });
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> solvePYQPaper({
    String? paperId,
    required String paperTitle,
    String? state,
    String? examType,
    int? year,
    String? userDoubt,
    String? fullPaperText,
  }) async {
    try {
      final res = await dio.post('/legal/pyq/solve', data: {
        if (paperId != null && paperId.isNotEmpty) 'paperId': paperId,
        'paperTitle': paperTitle,
        if (state != null && state.isNotEmpty) 'state': state,
        if (examType != null && examType.isNotEmpty) 'examType': examType,
        if (year != null) 'year': year,
        if (userDoubt != null && userDoubt.isNotEmpty) 'userDoubt': userDoubt,
        if (fullPaperText != null && fullPaperText.isNotEmpty) 'fullPaperText': fullPaperText,
      });
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> discoverPYQPaper({
    required String state,
    required String examType,
    required int year,
    String? stage,
  }) async {
    try {
      final res = await dio.post('/legal/pyq/discover', data: {
        'state': state,
        'examType': examType,
        'year': year,
        if (stage != null && stage.isNotEmpty) 'stage': stage,
      });
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> generateSectionDrill({
    String? actName,
    String? topic,
    int count = 5,
    String difficulty = 'INTERMEDIATE',
  }) async {
    try {
      final res = await dio.post('/legal/drills/generate', data: {
        if (actName != null && actName.isNotEmpty) 'actName': actName,
        if (topic != null && topic.isNotEmpty) 'topic': topic,
        'count': count,
        'difficulty': difficulty,
      });
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  // ==================== ATTENDANCE ====================
  static Future<List<dynamic>> getDepartments(String orgId) async {
    try {
      final res = await dio.get('/orgs/$orgId/departments');
      if (res.data is List) return res.data as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> batchLogAttendance({
    required String orgId,
    required String teamId,
    String? date,
    required List<Map<String, dynamic>> records,
  }) async {
    try {
      final res = await dio.post('/attendance/batch', data: {
        'orgId': orgId,
        'teamId': teamId,
        if (date != null) 'date': date,
        'records': records,
      });
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<List<dynamic>> getTeamAttendance({
    required String teamId,
    String? date,
  }) async {
    try {
      final res = await dio.get('/attendance/team/$teamId', queryParameters: {
        if (date != null) 'date': date,
      });
      if (res.data is List) return res.data as List<dynamic>;
      if (res.data is Map && res.data['records'] is List) return res.data['records'] as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  // ==================== CHANNELS & MESSAGES ====================
  static Future<List<dynamic>> getChannels(String orgId) async {
    try {
      final res = await dio.get('/channels', queryParameters: {'orgId': orgId});
      if (res.data is List) return res.data as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<List<dynamic>> getMessages(String channelId) async {
    try {
      final res = await dio.get('/channels/$channelId/messages');
      if (res.data is List) return res.data as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> sendMessage(String channelId, String content) async {
    try {
      final res = await dio.post('/channels/$channelId/messages', data: {'content': content});
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> createDM(String orgId, String targetUserId) async {
    try {
      final res = await dio.post('/channels/dm', data: {'orgId': orgId, 'targetUserId': targetUserId});
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  // ==================== LIVE MEETINGS ====================
  static Future<List<dynamic>> getMeetings(String orgId) async {
    try {
      final res = await dio.get('/meetings', queryParameters: {'orgId': orgId});
      if (res.data is List) return res.data as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> createMeeting(Map<String, dynamic> data) async {
    try {
      final res = await dio.post('/meetings', data: data);
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  // ==================== PARENT & STUDENT PORTAL ====================
  static Future<List<dynamic>> getMyChildren() async {
    try {
      final res = await dio.get('/parent/my-children');
      if (res.data is List) return res.data as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> getChildReport(String studentId, {String? orgId}) async {
    try {
      final res = await dio.get(
        '/parent/child/$studentId/report',
        queryParameters: orgId != null ? {'orgId': orgId} : null,
      );
      return res.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  // ==================== FINANCE & PAYSLIPS ====================
  static Future<Map<String, dynamic>?> getFeeOverview(String orgId) async {
    try {
      final res = await dio.get('/finance/overview', queryParameters: {'orgId': orgId});
      if (res.data is Map) return res.data as Map<String, dynamic>;
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<List<dynamic>> getFees(String orgId) async {
    try {
      final res = await dio.get('/finance/fees', queryParameters: {'orgId': orgId});
      if (res.data is Map && res.data['fees'] is List) {
        return res.data['fees'] as List<dynamic>;
      } else if (res.data is List) {
        return res.data as List<dynamic>;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>?> getFeeStatus(String orgId) async {
    try {
      final results = await Future.wait([
        getFeeOverview(orgId),
        getFees(orgId),
      ]);
      final overview = results[0] as Map<String, dynamic>?;
      final fees = results[1] as List<dynamic>? ?? [];
      final summary = (overview?['summary'] as Map<String, dynamic>?) ?? {};
      final totalCollected = (summary['totalFeesCollected'] as num?)?.toDouble() ?? 0.0;
      final totalPending = (summary['totalPendingDues'] as num?)?.toDouble() ?? 0.0;
      return {
        'totals': {
          'totalBilled': (totalCollected + totalPending).round(),
          'totalCollected': totalCollected.round(),
          'totalOutstanding': totalPending.round(),
        },
        'students': fees,
        'overview': overview,
      };
    } catch (_) {
      return null;
    }
  }

  static Future<List<dynamic>> getMyPayslips({String? orgId}) async {
    try {
      final res = await dio.get(
        '/finance/my-payslips',
        queryParameters: orgId != null ? {'orgId': orgId} : null,
      );
      if (res.data is List) return res.data as List<dynamic>;
      if (res.data is Map && res.data['payrolls'] is List) return res.data['payrolls'] as List<dynamic>;
      return [];
    } catch (_) {
      return [];
    }
  }

  // ==================== USER & PROFILE ====================
  static Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await dio.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('currentOrgId');
    await prefs.remove('currentUser');
    await prefs.remove('currentOrg');
    currentUser = null;
    currentOrg = null;
    dio.options.headers.remove('Authorization');
    dio.options.headers.remove('x-org-id');
    authState.value = false;
  }
}
