import 'package:flutter/material.dart';

import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../utils/mock_data.dart';

class TeacherAnalytics extends StatefulWidget {
  final UserModel user;

  const TeacherAnalytics({
    super.key,
    required this.user,
  });

  @override
  State<TeacherAnalytics> createState() => _TeacherAnalyticsState();
}

class _TeacherAnalyticsRecord {
  final String studentId;
  final String studentName;
  final String status;

  _TeacherAnalyticsRecord({
    required this.studentId,
    required this.studentName,
    required this.status,
  });
}

class _StudentAnalyticsSummary {
  final String studentId;
  final String studentName;
  final int present;
  final int late;
  final int absent;

  _StudentAnalyticsSummary({
    required this.studentId,
    required this.studentName,
    required this.present,
    required this.late,
    required this.absent,
  });
}

class _TeacherAnalyticsState extends State<TeacherAnalytics> {
  bool isLoading = true;
  String errorMessage = "";

  List<_StudentAnalyticsSummary> studentSummaries = [];

  @override
  void initState() {
    super.initState();
    _loadAnalyticsFromDatabase();
  }

  Future<void> _loadAnalyticsFromDatabase() async {
    final token = widget.user.token;

    if (token == null || token.trim().isEmpty) {
      _loadFallbackMockData("Login session missing. Please log in again.");
      return;
    }

    final response = await ApiService.getAttendanceLedger(token);

    if (!mounted) return;

    if (response["success"] != true) {
      _loadFallbackMockData(
        response["message"]?.toString() ?? "Failed to load attendance analytics.",
      );
      return;
    }

    final data = response["data"];

    if (data is! List) {
      _loadFallbackMockData("Invalid attendance data received from server.");
      return;
    }

    final records = data
        .whereType<Map<String, dynamic>>()
        .map(_parseAttendanceRecord)
        .whereType<_TeacherAnalyticsRecord>()
        .toList();

    final grouped = <String, List<_TeacherAnalyticsRecord>>{};

    for (final record in records) {
      grouped.putIfAbsent(record.studentId, () => []);
      grouped[record.studentId]!.add(record);
    }

    final summaries = grouped.entries.map((entry) {
      final studentRecords = entry.value;
      final firstRecord = studentRecords.first;

      return _StudentAnalyticsSummary(
        studentId: firstRecord.studentId,
        studentName: firstRecord.studentName,
        present: studentRecords.where((r) => r.status == "Present").length,
        late: studentRecords.where((r) => r.status == "Late").length,
        absent: studentRecords.where((r) => r.status == "Absent").length,
      );
    }).toList()
      ..sort((a, b) => a.studentName.compareTo(b.studentName));

    setState(() {
      studentSummaries = summaries;
      errorMessage = "";
      isLoading = false;
    });
  }

  void _loadFallbackMockData(String message) {
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: widget.user.email,
    );

    final summaries = teacherStudents.map((student) {
      final records = attendanceRecords
          .where((record) => record.studentId == student.id)
          .toList();

      return _StudentAnalyticsSummary(
        studentId: student.id,
        studentName: student.name,
        present: records.where((r) => r.status == "Present").length,
        late: records.where((r) => r.status == "Late").length,
        absent: records.where((r) => r.status == "Absent").length,
      );
    }).toList();

    setState(() {
      studentSummaries = summaries;
      errorMessage = message;
      isLoading = false;
    });
  }

  _TeacherAnalyticsRecord? _parseAttendanceRecord(Map<String, dynamic> json) {
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

      return _TeacherAnalyticsRecord(
        studentId: parsedStudentId,
        studentName: parsedStudentName,
        status: status,
      );
    } catch (_) {
      return null;
    }
  }

  Color _riskColor(String risk) {
    final value = risk.toLowerCase();

    if (value.contains("high")) return Colors.red;
    if (value.contains("moderate")) return Colors.orange;
    if (value.contains("low")) return Colors.green;

    return Colors.grey;
  }

  Map<String, dynamic> _analyzeAttendance({
    required int present,
    required int late,
    required int absent,
  }) {
    final total = present + late + absent;
    final score = present + (late * 0.5);
    final rate = total == 0 ? 0.0 : (score / total) * 100;

    if (total == 0) {
      return {
        "riskLevel": "No Data",
        "confidence": "0.00",
        "prescription": "No attendance records available for this student.",
        "attendanceRate": "0.00",
      };
    }

    if (rate >= 85) {
      return {
        "riskLevel": "Low Risk",
        "confidence": "96.00",
        "attendanceRate": rate.toStringAsFixed(2),
        "prescription":
            "Continue good attendance habits, maintain regular monitoring, and provide positive reinforcement.",
      };
    }

    if (rate >= 70) {
      return {
        "riskLevel": "Moderate Risk",
        "confidence": "89.00",
        "attendanceRate": rate.toStringAsFixed(2),
        "prescription":
            "Monitor attendance weekly, notify the parent or guardian if the pattern continues, and encourage punctuality and consistent school attendance.",
      };
    }

    return {
      "riskLevel": "High Risk",
      "confidence": "92.00",
      "attendanceRate": rate.toStringAsFixed(2),
      "prescription":
          "Schedule an intervention meeting, notify the parent or guardian, create an attendance improvement plan, and monitor the student closely.",
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color.fromARGB(220, 255, 255, 255),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Student Attendance Analytics",
            style: TextStyle(
              color: Colors.black,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Attendance-based prescriptions for student performance",
            style: TextStyle(
              color: Colors.black54,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 16),
          if (errorMessage.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
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
          if (isLoading)
            const Expanded(
              child: Center(
                child: CircularProgressIndicator(
                  color: Color.fromARGB(255, 134, 32, 32),
                ),
              ),
            )
          else if (studentSummaries.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  "No students or attendance records found for ${widget.user.email}.",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                itemCount: studentSummaries.length,
                itemBuilder: (context, index) {
                  final student = studentSummaries[index];

                  final present = student.present;
                  final absent = student.absent;
                  final late = student.late;

                  final total = present + absent + late;
                  final score = (present * 1.0) + (late * 0.5);
                  final rate = total == 0 ? 0 : (score / total) * 100;

                  final aiData = _analyzeAttendance(
                    present: present,
                    late: late,
                    absent: absent,
                  );

                  final aiRisk = aiData['riskLevel'].toString();
                  final aiPrescription = aiData['prescription'].toString();
                  final confidence = aiData['confidence'].toString();
                  final riskColor = _riskColor(aiRisk);

                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 8,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: riskColor.withOpacity(0.2),
                              child: Icon(
                                Icons.person,
                                color: riskColor,
                                size: 30,
                              ),
                            ),
                            const SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    student.studentName,
                                    style: const TextStyle(
                                      color: Colors.black,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    "Attendance Rate: ${rate.toStringAsFixed(1)}%",
                                    style: const TextStyle(
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 7,
                              ),
                              decoration: BoxDecoration(
                                color: riskColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                aiRisk.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatBox(
                                title: "Present",
                                value: "$present",
                                color: Colors.green,
                                icon: Icons.check_circle,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _buildStatBox(
                                title: "Late",
                                value: "$late",
                                color: Colors.orange,
                                icon: Icons.access_time,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _buildStatBox(
                                title: "Absent",
                                value: "$absent",
                                color: Colors.red,
                                icon: Icons.cancel,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: riskColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: riskColor,
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.psychology,
                                    color: riskColor,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      "Attendance Prescription",
                                      style: TextStyle(
                                        color: riskColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                "Confidence: $confidence%",
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                aiPrescription,
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.w600,
                                  height: 1.5,
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
            ),
        ],
      ),
    );
  }

  Widget _buildStatBox({
    required String title,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: 14,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 28,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              color: Colors.black54,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}