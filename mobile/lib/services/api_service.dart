import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

class ApiService {
  static const Duration _timeout = Duration(seconds: 40);

  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:5001/api';
    }

    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5001/api';
    }

    return 'http://127.0.0.1:5001/api';
  }

  static Map<String, String> _headers({String? token}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.trim().isNotEmpty)
        'Authorization': 'Bearer ${token.trim()}',
    };
  }

  static Future<Map<String, dynamic>> _request({
    required String method,
    required String endpoint,
    String? token,
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');

    try {
      late http.Response response;

      switch (method.toUpperCase()) {
        case 'POST':
          response = await http
              .post(
                uri,
                headers: _headers(token: token),
                body: jsonEncode(body ?? {}),
              )
              .timeout(_timeout);
          break;

        case 'PUT':
          response = await http
              .put(
                uri,
                headers: _headers(token: token),
                body: jsonEncode(body ?? {}),
              )
              .timeout(_timeout);
          break;

        case 'DELETE':
          response = await http
              .delete(
                uri,
                headers: _headers(token: token),
                body: jsonEncode(body ?? {}),
              )
              .timeout(_timeout);
          break;

        case 'GET':
        default:
          response = await http
              .get(
                uri,
                headers: _headers(token: token),
              )
              .timeout(_timeout);
          break;
      }

      return _handleResponse(response);
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Request timed out. Please check your connection.',
      };
    } on SocketException {
      return {
        'success': false,
        'message': 'Cannot connect to server. Make sure backend is running.',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection failed: $e',
      };
    }
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    try {
      if (response.body.trim().isEmpty) {
        return {
          'success': false,
          'message': 'Empty server response',
          'statusCode': response.statusCode,
        };
      }

      final decoded = jsonDecode(response.body);
      final bool isSuccessStatus =
          response.statusCode >= 200 && response.statusCode < 300;

      if (isSuccessStatus) {
        if (decoded is Map<String, dynamic>) {
          return {
            'success': decoded['success'] ?? true,
            'message':
                decoded['message'] ?? decoded['msg'] ?? 'Request successful',
            'data': decoded,
            'statusCode': response.statusCode,
          };
        }

        if (decoded is List) {
          return {
            'success': true,
            'message': 'Request successful',
            'data': decoded,
            'statusCode': response.statusCode,
          };
        }

        return {
          'success': true,
          'message': 'Request successful',
          'data': decoded,
          'statusCode': response.statusCode,
        };
      }

      if (decoded is Map<String, dynamic>) {
        return {
          'success': false,
          'message': decoded['message'] ??
              decoded['msg'] ??
              decoded['error'] ??
              'Server error (${response.statusCode})',
          'statusCode': response.statusCode,
          'data': decoded,
        };
      }

      return {
        'success': false,
        'message': 'Server error (${response.statusCode})',
        'statusCode': response.statusCode,
        'data': decoded,
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'Server returned invalid data',
        'statusCode': response.statusCode,
        'raw': response.body,
      };
    }
  }

  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) {
    return _request(
      method: 'POST',
      endpoint: '/auth/login',
      body: {
        'email': email.trim(),
        'password': password.trim(),
      },
    );
  }

  static Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
    String role,
  ) {
    return _request(
      method: 'POST',
      endpoint: '/auth/register',
      body: {
        'name': name.trim(),
        'email': email.trim(),
        'password': password.trim(),
        'role': role.trim(),
      },
    );
  }

  static Future<Map<String, dynamic>> getParentAttendanceNotifications(
  String token,
) {
  return _request(
    method: 'GET',
    endpoint: '/attendance/ledger',
    token: token,
  );
}

  static Future<Map<String, dynamic>> updateProfile(
    String token,
    Map<String, dynamic> data,
  ) {
    return _request(
      method: 'PUT',
      endpoint: '/auth/update-profile',
      token: token,
      body: {
        'name': data['name']?.toString().trim() ?? '',
        'contactNumber': data['contactNumber']?.toString().trim() ?? '',
        'birthdate': data['birthdate']?.toString().trim() ?? '',
        'gradeSection': data['gradeSection']?.toString().trim() ?? '',
      },
    );
  }

  static Future<Map<String, dynamic>> markAttendance(
    String token,
    String qrCode, {
    String? sessionId,
  }) {
    return _request(
      method: 'POST',
      endpoint: '/attendance/scan',
      token: token,
      body: {
        'qrCode': qrCode.trim(),
        if (sessionId != null && sessionId.trim().isNotEmpty)
          'sessionId': sessionId.trim(),
      },
    );
  }

  static Future<Map<String, dynamic>> getAttendance(String token) {
    return getAttendanceLedger(token);
  }

  static Future<Map<String, dynamic>> getAttendanceLedger(String token) {
    return _request(
      method: 'GET',
      endpoint: '/attendance/ledger',
      token: token,
    );
  }

  static Future<Map<String, dynamic>> generateQR(String token) {
    return _request(
      method: 'GET',
      endpoint: '/qr/generate',
      token: token,
    );
  }

  static Future<Map<String, dynamic>> sendOTP(String email) {
    return _request(
      method: 'POST',
      endpoint: '/auth/send-otp',
      body: {
        'email': email.trim(),
      },
    );
  }

  static Future<Map<String, dynamic>> verifyOTP(
    String email,
    String otp,
  ) {
    return _request(
      method: 'POST',
      endpoint: '/auth/verify-otp',
      body: {
        'email': email.trim(),
        'otp': otp.trim(),
      },
    );
  }

  static Future<Map<String, dynamic>> analyzeAttendance({
    required int present,
    required int late,
    required int absent,
  }) {
    return _request(
      method: 'POST',
      endpoint: '/ai/analyze',
      body: {
        'present': present,
        'late': late,
        'absent': absent,
      },
    );
  }
}