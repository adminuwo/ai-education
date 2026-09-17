import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://convee-education-977864306871.asia-south1.run.app/api/v1';
  static const String fallbackBaseUrl = 'https://education.uwo24.com/api/v1';

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

    if (token != null) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
    if (orgId != null) {
      dio.options.headers['X-Organization-Id'] = orgId;
    }

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final p = await SharedPreferences.getInstance();
          final t = p.getString('accessToken');
          final o = p.getString('currentOrgId');
          if (t != null) {
            options.headers['Authorization'] = 'Bearer $t';
          }
          if (o != null) {
            options.headers['X-Organization-Id'] = o;
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
    if (data['org'] != null && data['org']['id'] != null) {
      await prefs.setString('currentOrgId', data['org']['id'].toString());
      dio.options.headers['X-Organization-Id'] = data['org']['id'].toString();
    }

    return data;
  }

  static Future<Map<String, dynamic>?> getMe() async {
    try {
      final res = await dio.get('/auth/me');
      return res.data as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<String?> getDailyBriefing(String orgId) async {
    try {
      final res = await dio.get('/ai/daily-briefing', queryParameters: {'orgId': orgId});
      return res.data['briefing']?.toString();
    } catch (_) {
      return null;
    }
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

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('currentOrgId');
    dio.options.headers.remove('Authorization');
    dio.options.headers.remove('X-Organization-Id');
  }
}
