import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:5001/api';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:5001/api';
    } else {
      return 'http://127.0.0.1:5001/api';
    }
  }

  static Map<String, String> _headers({String? token}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
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
      http.Response response;

      switch (method) {
        case 'POST':
          response = await http
              .post(
                uri,
                headers: _headers(token: token),
                body: jsonEncode(body ?? {}),
              )
              .timeout(const Duration(seconds: 40));
          break;

        case 'PUT':
          response = await http
              .put(
                uri,
                headers: _headers(token: token),
                body: jsonEncode(body ?? {}),
              )
              .timeout(const Duration(seconds: 40));
          break;

        case 'GET':
        default:
          response = await http
              .get(
                uri,
                headers: _headers(token: token),
              )
              .timeout(const Duration(seconds: 40));
          break;
      }

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection failed: $e',
      };
    }
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    try {
      if (response.body.isEmpty) {
        return {
          'success': false,
          'message': 'Empty server response',
          'statusCode': response.statusCode,
        };
      }

      final decoded = jsonDecode(response.body);

      if (decoded is! Map<String, dynamic>) {
        return {
          'success': false,
          'message': 'Invalid response format',
          'statusCode': response.statusCode,
          'raw': response.body,
        };
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          'success': true,
          'data': decoded,
          'statusCode': response.statusCode,
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Server error (${response.statusCode})',
        'statusCode': response.statusCode,
        'data': decoded,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Server returned invalid data: ${response.body}',
        'statusCode': response.statusCode,
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
    String qrCode,
  ) {
    return _request(
      method: 'POST',
      endpoint: '/attendance/mark',
      token: token,
      body: {
        'qrCode': qrCode.trim(),
      },
    );
  }

  static Future<Map<String, dynamic>> getAttendance(String token) {
    return _request(
      method: 'GET',
      endpoint: '/attendance',
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
      endpoint: '/otp/send',
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
      endpoint: '/otp/verify',
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