import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageService {
  static const String _prefKey = 'app_language';
  static final ValueNotifier<String> currentLocale = ValueNotifier<String>('en');

  static const Map<String, dynamic> _en = {
    'language': {
      'selectLanguage': 'Select Language',
      'english': 'English',
      'hindi': 'हिंदी (Hindi)',
    },
    'auth': {
      'brandTitle': 'AI Education',
      'brandSubtitle': 'Digital Campus & Academic Portal',
      'portalModeFaculty': 'Faculty & Staff',
      'portalModeStudent': 'Student Portal',
      'portalModeParent': 'Parent Portal',
      'emailLabel': 'Work Email or Faculty / Staff ID',
      'emailLabelStudent': 'Student ID or Email',
      'emailLabelParent': 'Registered Parent Email / Phone',
      'emailPlaceholder': 'name@institution.edu or ID',
      'emailPlaceholderStudent': 'e.g. STU-2026-1001',
      'emailPlaceholderParent': 'e.g. parent@example.com',
      'passwordLabel': 'Password',
      'passwordPlaceholder': 'Enter your secure password',
      'signIn': 'Sign In to Portal',
      'signingIn': 'Signing in…',
      'credentialsNotice': 'Sign in with your institutional credentials.',
      'errorEmptyCredentials': 'Please enter your email/ID and password.',
      'errorAuthFailed': 'Authentication failed. Please check credentials.',
    },
    'nav': {
      'home': 'Home',
      'homework': 'Homework',
      'attendance': 'Attendance',
      'channels': 'Channels',
      'messages': 'Messages & Channels',
      'tasks': 'Tasks & Operations',
      'ai': 'AI Assistant',
      'aiAssistant': 'AI Academic Assistant',
      'meetings': 'Live Meetings & Classes',
      'analytics': 'Academic Analytics',
      'portal': 'Parent & Student Portal',
      'studentPortal': 'Student Portal',
      'parentPortal': 'Parent Portal',
      'legalHub': 'Judicial & ADP Exam Hub',
      'profile': 'Profile & Settings',
    },
    'home': {
      'welcomeBack': 'Welcome back',
      'goodMorning': 'Good morning',
      'goodAfternoon': 'Good afternoon',
      'goodEvening': 'Good evening',
      'digitalCampus': 'Digital Campus Operations',
      'quickActions': 'Quick Actions',
      'aiBriefing': 'AI Daily Campus Briefing',
      'generatingBriefing': 'Generating AI daily briefing...',
      'noBriefing': 'No campus briefing generated yet today. Tap refresh to generate.',
      'aiAssistant': 'AI Academic Assistant',
      'aiAssistantDesc': 'Generate quiz questions & study help',
      'logAttendance': 'Class Attendance',
      'logAttendanceDesc': '1-Click section attendance logger',
      'activeTasks': 'Campus Tasks & Operations',
      'activeTasksDesc': 'Assign, track & oversee departmental duties',
      'attendanceHealth': 'Attendance Rate',
      'myAttendance': 'My Attendance',
      'childAttendance': 'Child Attendance',
      'campusTasks': 'Campus Tasks',
      'myTasks': 'My Tasks',
      'tasksPending': 'Pending Tasks',
      'homeworkDue': 'Homework Due',
      'childHomework': "Child's Homework",
      'homeworkGiven': 'Homework Given',
      'classesToday': 'Classes Today',
      'judicialHub': 'Judicial & ADP Exam Hub',
      'academicAnalytics': 'Academic Analytics',
      'liveMeetings': 'Live Meetings & Classes',
      'studentPortal': 'Student Portal',
      'parentPortal': 'Parent Portal',
      'signOut': 'Sign Out',
      'signOutConfirm': 'Are you sure you want to sign out?',
      'cancel': 'Cancel',
    },
  };

  static const Map<String, dynamic> _hi = {
    'language': {
      'selectLanguage': 'भाषा चुनें',
      'english': 'English',
      'hindi': 'हिंदी (Hindi)',
    },
    'auth': {
      'brandTitle': 'AI Education',
      'brandSubtitle': 'डिजिटल कैंपस एवं शैक्षणिक पोर्टल',
      'portalModeFaculty': 'संकाय एवं स्टाफ',
      'portalModeStudent': 'छात्र पोर्टल',
      'portalModeParent': 'अभिभावक पोर्टल',
      'emailLabel': 'कार्य ईमेल या संकाय / कर्मचारी आईडी',
      'emailLabelStudent': 'छात्र आईडी या ईमेल',
      'emailLabelParent': 'पंजीकृत अभिभावक ईमेल / फ़ोन',
      'emailPlaceholder': 'name@institution.edu या आईडी',
      'emailPlaceholderStudent': 'उदा. STU-2026-1001',
      'emailPlaceholderParent': 'उदा. parent@example.com',
      'passwordLabel': 'पासवर्ड',
      'passwordPlaceholder': 'अपना सुरक्षित पासवर्ड दर्ज करें',
      'signIn': 'पोर्टल में साइन इन करें',
      'signingIn': 'साइन इन हो रहा है…',
      'credentialsNotice': 'अपने संस्थागत क्रेडेंशियल्स के साथ साइन इन करें।',
      'errorEmptyCredentials': 'कृपया अपना ईमेल/आईडी और पासवर्ड दर्ज करें।',
      'errorAuthFailed': 'प्रमाणीकरण विफल रहा। कृपया क्रेडेंशियल्स की जाँच करें।',
    },
    'nav': {
      'home': 'मुख्य पृष्ठ',
      'homework': 'गृहकार्य',
      'attendance': 'उपस्थिति',
      'channels': 'चैनल',
      'messages': 'संदेश एवं चैनल',
      'tasks': 'कार्य एवं संचालन',
      'ai': 'एआई सहायक',
      'aiAssistant': 'एआई शैक्षणिक सहायक',
      'meetings': 'लाइव कक्षाएं एवं बैठकें',
      'analytics': 'शैक्षणिक एनालिटिक्स',
      'portal': 'अभिभावक एवं छात्र पोर्टल',
      'studentPortal': 'छात्र पोर्टल',
      'parentPortal': 'अभिभावक पोर्टल',
      'legalHub': 'न्यायिक एवं एडीपी परीक्षा केंद्र',
      'profile': 'प्रोफ़ाइल एवं सेटिंग्स',
    },
    'home': {
      'welcomeBack': 'वापसी पर स्वागत है',
      'goodMorning': 'सुप्रभात',
      'goodAfternoon': 'शुभ दोपहर',
      'goodEvening': 'शुभ संध्या',
      'digitalCampus': 'डिजिटल परिसर संचालन',
      'quickActions': 'त्वरित कार्य',
      'aiBriefing': 'एआई दैनिक परिसर ब्रीफिंग',
      'generatingBriefing': 'एआई दैनिक ब्रीफिंग तैयार की जा रही है...',
      'noBriefing': 'आज के लिए अभी कोई परिसर ब्रीफिंग नहीं बनी है। तैयार करने के लिए रीफ़्रेश दबाएं।',
      'aiAssistant': 'एआई शैक्षणिक सहायक',
      'aiAssistantDesc': 'क्विज़ प्रश्न और अध्ययन सहायता तैयार करें',
      'logAttendance': 'कक्षा उपस्थिति',
      'logAttendanceDesc': '1-क्लिक सेक्शन उपस्थिति लॉगर',
      'activeTasks': 'परिसर कार्य एवं संचालन',
      'activeTasksDesc': 'विभागीय कार्यों का आवंटन और निगरानी',
      'attendanceHealth': 'उपस्थिति दर',
      'myAttendance': 'मेरी उपस्थिति',
      'childAttendance': 'बच्चे की उपस्थिति',
      'campusTasks': 'परिसर कार्य',
      'myTasks': 'मेरे कार्य',
      'tasksPending': 'लंबित कार्य',
      'homeworkDue': 'लंबित गृहकार्य',
      'childHomework': 'बच्चे का गृहकार्य',
      'homeworkGiven': 'दिया गया गृहकार्य',
      'classesToday': 'आज की कक्षाएं',
      'judicialHub': 'न्यायिक एवं एडीपी परीक्षा केंद्र',
      'academicAnalytics': 'शैक्षणिक एनालिटिक्स',
      'liveMeetings': 'लाइव कक्षाएं एवं बैठकें',
      'studentPortal': 'छात्र पोर्टल',
      'parentPortal': 'अभिभावक पोर्टल',
      'signOut': 'साइन आउट करें',
      'signOutConfirm': 'क्या आप वाकई साइन आउट करना चाहते हैं?',
      'cancel': 'रद्द करें',
    },
  };

  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefKey);
      if (saved == 'en' || saved == 'hi') {
        currentLocale.value = saved!;
      }
    } catch (_) {}
  }

  static Future<void> setLanguage(String code) async {
    if (code == 'en' || code == 'hi') {
      currentLocale.value = code;
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefKey, code);
      } catch (_) {}
    }
  }

  static void toggleLanguage() {
    final next = currentLocale.value == 'en' ? 'hi' : 'en';
    setLanguage(next);
  }

  static dynamic _getNested(Map<String, dynamic> map, String path) {
    final parts = path.split('.');
    dynamic current = map;
    for (final part in parts) {
      if (current is Map && current.containsKey(part)) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }

  static String tr(String key, {String? fallback, Map<String, dynamic>? params}) {
    final lang = currentLocale.value;
    final dict = lang == 'hi' ? _hi : _en;
    dynamic value = _getNested(dict, key);
    if (value == null && lang != 'en') {
      value = _getNested(_en, key);
    }
    String result = (value != null) ? value.toString() : (fallback ?? key);

    if (params != null) {
      params.forEach((k, v) {
        result = result.replaceAll('{{$k}}', v.toString());
        result = result.replaceAll('{$k}', v.toString());
      });
    }

    return result;
  }
}
