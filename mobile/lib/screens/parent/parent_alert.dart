import 'package:attendit_mobile/models/user_model.dart';
import 'package:attendit_mobile/services/api_service.dart';
import 'package:flutter/material.dart';

class ParentAlertScreen extends StatefulWidget {
  final UserModel user;

  const ParentAlertScreen({
    super.key,
    required this.user,
  });

  @override
  State<ParentAlertScreen> createState() => _ParentAlertScreenState();
}

class _ParentAlertScreenState extends State<ParentAlertScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final token = widget.user.token ?? '';

    if (token.isEmpty) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Login token not found. Please log in again.';
      });
      return;
    }

    final response = await ApiService.getParentAttendanceNotifications(token);

    if (!mounted) return;

    if (response['success'] != true) {
      setState(() {
        _isLoading = false;
        _errorMessage = response['message']?.toString() ??
            'Unable to load attendance notifications.';
      });
      return;
    }

    final rawData = response['data'];
    final List<dynamic> records = _extractAttendanceRecords(rawData);

    final notifications = records.map((record) {
      final status = _readStatus(record);
      final studentName = _readStudentName(record);
      final date = _readDate(record);

      return {
        'date': date,
        'status': status,
        'message': _buildMessage(
          studentName: studentName,
          status: status,
        ),
      };
    }).toList();

    notifications.sort((a, b) {
      final dateA = DateTime.tryParse(a['date']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final dateB = DateTime.tryParse(b['date']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return dateB.compareTo(dateA);
    });

    final absentCount = notifications
        .where((item) => item['status']?.toString() == 'Absent')
        .length;

    final lateCount = notifications
        .where((item) => item['status']?.toString() == 'Late')
        .length;

    if (absentCount >= 3) {
      notifications.insert(0, {
        'date': DateTime.now().toString().split(' ')[0],
        'status': 'Warning',
        'message':
            'Attendance Warning: ${widget.user.name}’s linked student has accumulated $absentCount absences. Parent monitoring is strongly recommended.',
      });
    }

    if (lateCount >= 3) {
      notifications.insert(0, {
        'date': DateTime.now().toString().split(' ')[0],
        'status': 'Warning',
        'message':
            'Punctuality Warning: ${widget.user.name}’s linked student has accumulated $lateCount late arrivals.',
      });
    }

    setState(() {
      _notifications = notifications;
      _isLoading = false;
    });
  }

  List<dynamic> _extractAttendanceRecords(dynamic rawData) {
    if (rawData is List) return rawData;

    if (rawData is Map<String, dynamic>) {
      if (rawData['records'] is List) return rawData['records'];
      if (rawData['attendance'] is List) return rawData['attendance'];
      if (rawData['data'] is List) return rawData['data'];

      if (rawData['data'] is Map<String, dynamic>) {
        final nested = rawData['data'] as Map<String, dynamic>;

        if (nested['records'] is List) return nested['records'];
        if (nested['attendance'] is List) return nested['attendance'];
        if (nested['data'] is List) return nested['data'];
      }
    }

    return [];
  }

  String _readStatus(dynamic record) {
    if (record is! Map) return 'Present';

    return record['status']?.toString() ??
        record['attendanceStatus']?.toString() ??
        'Present';
  }

  String _readStudentName(dynamic record) {
    if (record is! Map) return 'Student';

    final student = record['studentId'] ?? record['student'];

    if (student is Map) {
      return student['name']?.toString() ??
          student['fullName']?.toString() ??
          'Student';
    }

    return record['studentName']?.toString() ??
        record['name']?.toString() ??
        'Student';
  }

  String _readDate(dynamic record) {
    if (record is! Map) {
      return DateTime.now().toString().split(' ')[0];
    }

    final rawDate = record['timestamp'] ??
        record['date'] ??
        record['createdAt'] ??
        record['updatedAt'];

    if (rawDate == null) {
      return DateTime.now().toString().split(' ')[0];
    }

    final parsed = DateTime.tryParse(rawDate.toString());

    if (parsed == null) return rawDate.toString();

    return parsed.toLocal().toString().split(' ')[0];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 132, 7, 7),
      appBar: _buildAppBar(),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Colors.white,
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _errorMessage!,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text(
            'No attendance notifications found for the linked student.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      child: ListView.builder(
        padding: const EdgeInsets.all(15),
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          final status = notification['status']?.toString() ?? '';

          final bool isAbsent = status == 'Absent';
          final bool isLate = status == 'Late';
          final bool isWarning = status == 'Warning';

          final Color statusColor = isWarning
              ? Colors.purple
              : isAbsent
                  ? Colors.red
                  : isLate
                      ? Colors.orange
                      : Colors.green;

          final IconData statusIcon = isWarning
              ? Icons.notifications_active
              : isAbsent
                  ? Icons.warning_amber_rounded
                  : isLate
                      ? Icons.access_time
                      : Icons.check_circle;

          return Container(
            margin: const EdgeInsets.only(bottom: 15),
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor: statusColor.withOpacity(0.15),
                  child: Icon(
                    statusIcon,
                    color: statusColor,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        status,
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        notification['message']?.toString() ?? '',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Date: ${notification['date'] ?? ''}',
                        style: const TextStyle(
                          color: Colors.black54,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      title: const Text(
        'Parent Notifications',
        style: TextStyle(
          color: Colors.black,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  static String _buildMessage({
    required String studentName,
    required String status,
  }) {
    switch (status) {
      case 'Present':
        return '$studentName was successfully marked PRESENT.';
      case 'Late':
        return '$studentName arrived LATE to class.';
      case 'Absent':
        return '$studentName was marked ABSENT. Please contact the adviser if necessary.';
      case 'Warning':
        return '$studentName has an attendance warning.';
      default:
        return '$studentName has an attendance update.';
    }
  }
}