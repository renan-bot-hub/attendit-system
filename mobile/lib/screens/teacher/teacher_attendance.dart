import 'package:flutter/material.dart';

import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../utils/mock_data.dart';

class TeacherAttendance extends StatefulWidget {
  final UserModel user;

  const TeacherAttendance({
    super.key,
    required this.user,
  });

  @override
  State<TeacherAttendance> createState() => _TeacherAttendanceState();
}

class _TeacherAttendanceRecord {
  final String studentId;
  final String studentName;
  final String date;
  final DateTime rawDate;
  final String status;

  _TeacherAttendanceRecord({
    required this.studentId,
    required this.studentName,
    required this.date,
    required this.rawDate,
    required this.status,
  });
}

class _TeacherAttendanceState extends State<TeacherAttendance> {
  bool isLoading = true;
  String errorMessage = "";
  List<_TeacherAttendanceRecord> teacherRecords = [];

  @override
  void initState() {
    super.initState();
    _loadAttendanceFromDatabase();
  }

  Future<void> _loadAttendanceFromDatabase() async {
    final token = widget.user.token;

    if (token == null || token.trim().isEmpty) {
      _loadFallbackMockData("Login session missing. Please log in again.");
      return;
    }

    final response = await ApiService.getAttendanceLedger(token);

    if (!mounted) return;

    if (response["success"] != true) {
      _loadFallbackMockData(
        response["message"]?.toString() ?? "Failed to load attendance records.",
      );
      return;
    }

    final data = response["data"];

    if (data is! List) {
      _loadFallbackMockData("Invalid attendance data received from server.");
      return;
    }

    final loadedRecords = data
        .whereType<Map<String, dynamic>>()
        .map(_parseAttendanceRecord)
        .whereType<_TeacherAttendanceRecord>()
        .toList()
      ..sort((a, b) => b.rawDate.compareTo(a.rawDate));

    setState(() {
      teacherRecords = loadedRecords;
      errorMessage = "";
      isLoading = false;
    });
  }

  void _loadFallbackMockData(String message) {
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: widget.user.email,
    );

    final teacherStudentIds = teacherStudents.map((student) => student.id).toList();

    final fallbackRecords = attendanceRecords
        .where((record) => teacherStudentIds.contains(record.studentId))
        .map(
          (record) => _TeacherAttendanceRecord(
            studentId: record.studentId,
            studentName: getStudentName(record.studentId),
            date: record.date,
            rawDate: DateTime.tryParse(record.date) ?? DateTime.now(),
            status: record.status,
          ),
        )
        .toList()
      ..sort((a, b) => b.rawDate.compareTo(a.rawDate));

    setState(() {
      teacherRecords = fallbackRecords;
      errorMessage = message;
      isLoading = false;
    });
  }

  _TeacherAttendanceRecord? _parseAttendanceRecord(Map<String, dynamic> json) {
    try {
      final studentData = json["studentId"];

      String parsedStudentId = "";
      String parsedStudentName = "Unknown Student";

      if (studentData is Map<String, dynamic>) {
        parsedStudentId =
            studentData["_id"]?.toString() ?? studentData["id"]?.toString() ?? "";

        parsedStudentName = studentData["name"]?.toString() ?? "Unknown Student";
      } else {
        parsedStudentId = studentData?.toString() ?? "";
      }

      final status = json["status"]?.toString() ?? "Present";

      final timestampText = json["timestamp"]?.toString() ??
          json["createdAt"]?.toString() ??
          DateTime.now().toIso8601String();

      final rawDate = DateTime.tryParse(timestampText) ?? DateTime.now();

      final dateLabel =
          "${rawDate.year}-${rawDate.month.toString().padLeft(2, '0')}-${rawDate.day.toString().padLeft(2, '0')}";

      return _TeacherAttendanceRecord(
        studentId: parsedStudentId,
        studentName: parsedStudentName,
        date: dateLabel,
        rawDate: rawDate,
        status: status,
      );
    } catch (_) {
      return null;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case "Present":
        return Colors.green;
      case "Late":
        return Colors.orange;
      case "Absent":
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case "Present":
        return Icons.check_circle;
      case "Late":
        return Icons.access_time;
      case "Absent":
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  @override
  Widget build(BuildContext context) {
    final presentCount =
        teacherRecords.where((record) => record.status == "Present").length;

    final lateCount =
        teacherRecords.where((record) => record.status == "Late").length;

    final absentCount =
        teacherRecords.where((record) => record.status == "Absent").length;

    final linkedStudentCount =
        teacherRecords.map((record) => record.studentId).toSet().length;

    if (isLoading) {
      return Container(
        color: Colors.white,
        child: Center(
          child: CircularProgressIndicator(
            color: Color.fromARGB(255, 134, 32, 32),
          ),
        ),
      );
    }

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          if (errorMessage.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.orange),
              ),
              child: Text(
                errorMessage,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Student Attendance Records",
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  "Teacher: ${widget.user.name ?? widget.user.email}",
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Linked Students: $linkedStudentCount",
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildSummaryCard(
                      title: "Present",
                      count: presentCount.toString(),
                      color: Colors.green,
                      icon: Icons.check_circle,
                    ),
                    const SizedBox(width: 8),
                    _buildSummaryCard(
                      title: "Late",
                      count: lateCount.toString(),
                      color: Colors.orange,
                      icon: Icons.access_time,
                    ),
                    const SizedBox(width: 8),
                    _buildSummaryCard(
                      title: "Absent",
                      count: absentCount.toString(),
                      color: Colors.red,
                      icon: Icons.cancel,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: teacherRecords.isEmpty
                ? const Center(
                    child: Text(
                      "No attendance records found.",
                      style: TextStyle(
                        color: Colors.black54,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    itemCount: teacherRecords.length,
                    itemBuilder: (context, index) {
                      final record = teacherRecords[index];
                      final statusColor = _statusColor(record.status);
                      final statusIcon = _statusIcon(record.status);

                      return Card(
                        color: const Color.fromARGB(255, 227, 222, 222),
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          leading: CircleAvatar(
                            backgroundColor: statusColor.withOpacity(0.15),
                            child: Icon(
                              statusIcon,
                              color: statusColor,
                            ),
                          ),
                          title: Text(
                            record.studentName,
                            style: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          subtitle: Text(
                            "Date: ${record.date}",
                            style: const TextStyle(
                              color: Colors.black54,
                            ),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              record.status,
                              style: TextStyle(
                                color: statusColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required String count,
    required Color color,
    required IconData icon,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: 14,
          horizontal: 8,
        ),
        decoration: BoxDecoration(
          color: const Color.fromARGB(255, 134, 32, 32),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: color,
              size: 26,
            ),
            const SizedBox(height: 8),
            Text(
              count,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}