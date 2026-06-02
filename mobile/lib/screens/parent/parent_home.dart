import 'package:flutter/material.dart';

import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../utils/mock_data.dart';

class ParentHome extends StatefulWidget {
  final UserModel user;

  const ParentHome({
    super.key,
    required this.user,
  });

  @override
  State<ParentHome> createState() => _ParentHomeState();
}

class _ParentAttendanceRecord {
  final String studentId;
  final String studentName;
  final String date;
  final DateTime rawDate;
  final String status;

  _ParentAttendanceRecord({
    required this.studentId,
    required this.studentName,
    required this.date,
    required this.rawDate,
    required this.status,
  });
}

class _ParentHomeState extends State<ParentHome> {
  static const Color maroon = Color.fromARGB(255, 128, 36, 36);

  bool isLoadingRecords = true;
  bool isLoadingAI = true;

  String studentName = "Student";
  String recordsError = "";

  List<_ParentAttendanceRecord> records = [];

  String aiRiskLevel = "";
  String aiAttendanceRate = "";
  String aiPrescription = "";
  String aiError = "";

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
        .whereType<_ParentAttendanceRecord>()
        .toList()
      ..sort((a, b) => b.rawDate.compareTo(a.rawDate));

    if (loadedRecords.isNotEmpty) {
      studentName = loadedRecords.first.studentName;
    } else {
      final fallbackStudent = findStudentForParent(
        parentEmail: widget.user.email,
        parentId: widget.user.parentId ?? widget.user.id,
        studentId: widget.user.studentId,
        parentName: widget.user.name,
      );

      if (fallbackStudent != null) {
        studentName = fallbackStudent.name;
      }
    }

    setState(() {
      records = loadedRecords;
      recordsError = "";
      isLoadingRecords = false;
    });

    await _loadAIPrescription();
  }

  void _loadFallbackMockData(String errorMessage) {
    final student = findStudentForParent(
      parentEmail: widget.user.email,
      parentId: widget.user.parentId ?? widget.user.id,
      studentId: widget.user.studentId,
      parentName: widget.user.name,
    );

    if (student == null) {
      setState(() {
        records = [];
        studentName = "Student";
        recordsError = errorMessage;
        isLoadingRecords = false;
        isLoadingAI = false;
        aiError = "No student record found for AI analysis.";
      });
      return;
    }

    final fallbackRecords = attendanceRecords
        .where((record) => record.studentId == student.id)
        .map(
          (record) => _ParentAttendanceRecord(
            studentId: record.studentId,
            studentName: student.name,
            date: record.date,
            rawDate: DateTime.tryParse(record.date) ?? DateTime.now(),
            status: record.status,
          ),
        )
        .toList()
      ..sort((a, b) => b.rawDate.compareTo(a.rawDate));

    setState(() {
      records = fallbackRecords;
      studentName = student.name;
      recordsError = errorMessage;
      isLoadingRecords = false;
    });

    _loadAIPrescription();
  }

  _ParentAttendanceRecord? _parseAttendanceRecord(Map<String, dynamic> json) {
    try {
      final studentData = json["studentId"];

      String parsedStudentId = "";
      String parsedStudentName = "Student";

      if (studentData is Map<String, dynamic>) {
        parsedStudentId =
            studentData["_id"]?.toString() ?? studentData["id"]?.toString() ?? "";
        parsedStudentName = studentData["name"]?.toString() ?? "Student";
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

      return _ParentAttendanceRecord(
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

  Future<void> _loadAIPrescription() async {
    final present =
        records.where((record) => record.status == "Present").length;
    final late = records.where((record) => record.status == "Late").length;
    final absent = records.where((record) => record.status == "Absent").length;

    final response = await ApiService.analyzeAttendance(
      present: present,
      late: late,
      absent: absent,
    );

    if (!mounted) return;

    if (response["success"] == true) {
      final result = response["data"]?["result"];

      if (result != null) {
        setState(() {
          aiRiskLevel = result["riskLevel"]?.toString() ?? "";
          aiAttendanceRate = result["attendanceRate"]?.toString() ?? "";
          aiPrescription = result["prescription"]?.toString() ?? "";
          isLoadingAI = false;
        });
      } else {
        setState(() {
          aiError = "AI result was not received properly.";
          isLoadingAI = false;
        });
      }
    } else {
      setState(() {
        aiError = response["message"] ?? "Failed to generate AI prescription.";
        isLoadingAI = false;
      });
    }
  }

  Color _riskColor(String riskLevel) {
    final risk = riskLevel.toLowerCase();

    if (risk.contains("high")) return Colors.red;
    if (risk.contains("moderate")) return Colors.orange;
    if (risk.contains("low")) return Colors.green;

    return maroon;
  }

  String _recordSubtitle(String status) {
    switch (status) {
      case "Present":
        return "Student attended class";
      case "Late":
        return "Student arrived late";
      default:
        return "Student was absent";
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case "Present":
        return Colors.green;
      case "Late":
        return Colors.orange;
      default:
        return Colors.red;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case "Present":
        return Icons.check_circle;
      case "Late":
        return Icons.access_time;
      default:
        return Icons.cancel;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoadingRecords) {
      return const Center(
        child: CircularProgressIndicator(
          color: maroon,
        ),
      );
    }

    final present =
        records.where((record) => record.status == "Present").length;
    final late = records.where((record) => record.status == "Late").length;
    final absent = records.where((record) => record.status == "Absent").length;

    final total = records.length;
    final attendanceScore = present + (late * 0.5);
    final percentage = total == 0 ? 0.0 : (attendanceScore / total) * 100;

    bool hasConsecutiveAbsents = false;
    bool hasFrequentLate = late >= 3;

    int absentStreak = 0;

    final sortedRecords = List<_ParentAttendanceRecord>.from(records)
      ..sort((a, b) => a.rawDate.compareTo(b.rawDate));

    for (final record in sortedRecords) {
      if (record.status == "Absent") {
        absentStreak++;
        if (absentStreak >= 2) {
          hasConsecutiveAbsents = true;
        }
      } else {
        absentStreak = 0;
      }
    }

    String riskLevel;
    Color riskColor;

    if (percentage < 60 || hasConsecutiveAbsents) {
      riskLevel = "HIGH RISK";
      riskColor = Colors.red;
    } else if (percentage < 80 || hasFrequentLate) {
      riskLevel = "MODERATE RISK";
      riskColor = Colors.orange;
    } else {
      riskLevel = "LOW RISK";
      riskColor = Colors.green;
    }

    final latestRecords = records.take(5).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (recordsError.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildWarningCard(recordsError),
            ),
          _buildWelcomeCard(
            parentName: widget.user.name ?? "Parent",
            studentName: studentName,
            riskLevel: riskLevel,
            riskColor: riskColor,
          ),
          const SizedBox(height: 18),
          _buildSectionTitle("Attendance Overview"),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  title: "Present",
                  value: "$present",
                  color: Colors.green,
                  icon: Icons.check_circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStatCard(
                  title: "Late",
                  value: "$late",
                  color: Colors.orange,
                  icon: Icons.access_time,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStatCard(
                  title: "Absent",
                  value: "$absent",
                  color: Colors.red,
                  icon: Icons.cancel,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _buildPerformanceCard(
            percentage: percentage,
            riskLevel: riskLevel,
            riskColor: riskColor,
            totalDays: total,
          ),
          const SizedBox(height: 18),
          _buildSectionTitle("AI Attendance Insight"),
          _buildAIPrescriptionCard(
            fallbackText: _fallbackRecommendation(
              percentage: percentage,
              hasConsecutiveAbsents: hasConsecutiveAbsents,
              hasFrequentLate: hasFrequentLate,
            ),
            fallbackColor: riskColor,
          ),
          const SizedBox(height: 18),
          _buildSectionTitle("Recent Attendance Records"),
          if (latestRecords.isEmpty)
            _buildEmptyRecordCard()
          else
            ...latestRecords.map((record) {
              return _buildAttendanceRecordCard(
                date: record.date,
                status: record.status,
                subtitle: _recordSubtitle(record.status),
                color: _statusColor(record.status),
                icon: _statusIcon(record.status),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildWarningCard(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.orange),
      ),
      child: Text(
        message,
        style: const TextStyle(
          color: Colors.black87,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildWelcomeCard({
    required String parentName,
    required String studentName,
    required String riskLevel,
    required Color riskColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: maroon,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: maroon.withOpacity(0.25),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.family_restroom,
            color: Colors.white,
            size: 42,
          ),
          const SizedBox(height: 14),
          Text(
            "Welcome, $parentName!",
            style: const TextStyle(
              color: Colors.white,
              fontSize: 23,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "Here is the attendance summary and performance analytics of $studentName.",
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: riskColor,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              riskLevel,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          color: maroon,
          fontSize: 21,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: maroon.withOpacity(0.15),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 30),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 25,
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

  Widget _buildPerformanceCard({
    required double percentage,
    required String riskLevel,
    required Color riskColor,
    required int totalDays,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F7),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: maroon.withOpacity(0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Attendance Performance",
            style: TextStyle(
              color: maroon,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 14),
          LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 12,
            borderRadius: BorderRadius.circular(20),
            backgroundColor: Colors.grey.shade300,
            color: riskColor,
          ),
          const SizedBox(height: 12),
          Text(
            "${percentage.toStringAsFixed(1)}% Attendance Rate",
            style: const TextStyle(
              color: Colors.black,
              fontSize: 19,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            "Based on $totalDays recorded class day/s.",
            style: const TextStyle(
              color: Colors.black54,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAIPrescriptionCard({
    required String fallbackText,
    required Color fallbackColor,
  }) {
    if (isLoadingAI) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: fallbackColor.withOpacity(0.10),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: fallbackColor),
        ),
        child: const Column(
          children: [
            CircularProgressIndicator(color: maroon),
            SizedBox(height: 12),
            Text(
              "Generating attendance recommendation...",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    }

    if (aiError.isNotEmpty) {
      return _buildRecommendationCard(
        text: fallbackText,
        color: fallbackColor,
      );
    }

    final aiColor = _riskColor(aiRiskLevel);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: aiColor.withOpacity(0.10),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: aiColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "AI Prescriptive Analytics",
            style: TextStyle(
              color: maroon,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "AI Attendance Rate: $aiAttendanceRate%",
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "AI Risk Level: $aiRiskLevel",
            style: TextStyle(
              color: aiColor,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            aiPrescription,
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 14,
              height: 1.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationCard({
    required String text,
    required Color color,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withOpacity(0.10),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: color),
      ),
      child: Text(
        text.trim(),
        style: const TextStyle(
          color: Colors.black87,
          fontSize: 14,
          height: 1.5,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildAttendanceRecordCard({
    required String date,
    required String status,
    required String subtitle,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: maroon,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: maroon.withOpacity(0.16),
            blurRadius: 8,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Colors.white,
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  date,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              status,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyRecordCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: maroon.withOpacity(0.15),
        ),
      ),
      child: const Text(
        "No attendance records found.",
        textAlign: TextAlign.center,
        style: TextStyle(
          color: Colors.black54,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _fallbackRecommendation({
    required double percentage,
    required bool hasConsecutiveAbsents,
    required bool hasFrequentLate,
  }) {
    if (hasConsecutiveAbsents && hasFrequentLate) {
      return """
⚠️ Critical Attendance Pattern Detected

Insights:
• Multiple late arrivals detected
• Consecutive absences detected
• Attendance performance is below acceptable level

Suggested Actions:
• Coordinate with adviser immediately
• Monitor attendance closely
• Improve daily routine
""";
    }

    if (hasConsecutiveAbsents) {
      return """
⚠️ Consecutive Absences Detected

Suggested Actions:
• Contact student immediately
• Coordinate with adviser
• Monitor attendance closely
""";
    }

    if (hasFrequentLate) {
      return """
⚠️ Frequent Late Arrivals Detected

Suggested Actions:
• Improve morning preparation
• Encourage earlier sleep schedule
• Monitor punctuality daily
""";
    }

    if (percentage < 75) {
      return """
⚠️ Low Attendance Rate

Suggested Actions:
• Build a consistent routine
• Improve attendance monitoring
• Schedule parent-teacher discussion
""";
    }

    return """
✅ Excellent Attendance Performance

Keep encouraging:
• Consistent attendance
• Positive study habits
• Good punctuality
""";
  }
}