import 'package:attendit_mobile/models/user_model.dart';
import 'package:flutter/material.dart';

import '../../services/api_service.dart';
import '../../utils/mock_data.dart';

class ParentAnalytics extends StatefulWidget {
  final UserModel user;

  const ParentAnalytics({
    super.key,
    required this.user,
  });

  @override
  State<ParentAnalytics> createState() => _ParentAnalyticsState();
}

class _ParentAnalyticsState extends State<ParentAnalytics> {
  bool isLoadingAI = true;

  String aiRiskLevel = "";
  String aiAttendanceRate = "";
  String aiPrescription = "";
  String aiError = "";

  @override
  void initState() {
    super.initState();
    _loadAIPrescription();
  }

  Future<void> _loadAIPrescription() async {
    final student = findStudentForParent(
      parentEmail: widget.user.email,
      parentId: widget.user.parentId ?? widget.user.id,
      studentId: widget.user.studentId,
      parentName: widget.user.name,
    );

    if (student == null) {
      setState(() {
        isLoadingAI = false;
        aiError = "No student record found for AI analysis.";
      });
      return;
    }

    final records = attendanceRecords
        .where((r) => r.studentId == student.id)
        .toList();

    final present = records.where((r) => r.status == "Present").length;
    final late = records.where((r) => r.status == "Late").length;
    final absent = records.where((r) => r.status == "Absent").length;

    final response = await ApiService.analyzeAttendance(
      present: present,
      late: late,
      absent: absent,
    );

    if (!mounted) return;

    if (response['success'] == true) {
      final result = response['data']?['result'];

      if (result != null) {
        setState(() {
          aiRiskLevel = result['riskLevel']?.toString() ?? "";
          aiAttendanceRate = result['attendanceRate']?.toString() ?? "";
          aiPrescription = result['prescription']?.toString() ?? "";
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
        aiError = response['message'] ?? "Failed to generate AI prescription.";
        isLoadingAI = false;
      });
    }
  }

  Color _getAIRiskColor(String risk) {
    final value = risk.toLowerCase();

    if (value.contains("high")) {
      return Colors.red;
    } else if (value.contains("moderate")) {
      return Colors.orange;
    } else if (value.contains("low")) {
      return Colors.green;
    } else {
      return const Color.fromARGB(255, 128, 36, 36);
    }
  }

  @override
  Widget build(BuildContext context) {
    final student = findStudentForParent(
      parentEmail: widget.user.email,
      parentId: widget.user.parentId ?? widget.user.id,
      studentId: widget.user.studentId,
      parentName: widget.user.name,
    );

    if (student == null) {
      return const Center(
        child: Text(
          "No analytics data linked to this parent account.",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    final records = attendanceRecords
        .where((r) => r.studentId == student.id)
        .toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final present = records.where((r) => r.status == "Present").length;
    final absent = records.where((r) => r.status == "Absent").length;
    final late = records.where((r) => r.status == "Late").length;

    final total = records.length;

    final attendanceScore = (present * 1.0) + (late * 0.5);

    final percentage = total == 0 ? 0 : (attendanceScore / total) * 100;

    bool hasConsecutiveAbsents = false;
    bool hasFrequentLate = late >= 3;

    int streak = 0;

    for (final record in records) {
      if (record.status == "Absent") {
        streak++;

        if (streak >= 2) {
          hasConsecutiveAbsents = true;
        }
      } else {
        streak = 0;
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

    String recommendation;
    Color recommendationColor;

    if (hasConsecutiveAbsents && hasFrequentLate) {
      recommendationColor = Colors.red;

      recommendation = """
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
    } else if (hasConsecutiveAbsents) {
      recommendationColor = Colors.orange;

      recommendation = """
⚠️ Consecutive Absences Detected

Suggested Actions:
• Contact student immediately
• Coordinate with adviser
• Monitor attendance closely
""";
    } else if (hasFrequentLate) {
      recommendationColor = Colors.orange;

      recommendation = """
⚠️ Frequent Late Arrivals Detected

Suggested Actions:
• Improve morning preparation
• Encourage earlier sleep schedule
• Monitor punctuality daily
""";
    } else if (percentage < 75) {
      recommendationColor = Colors.red;

      recommendation = """
⚠️ Low Attendance Rate

Suggested Actions:
• Build a consistent routine
• Improve attendance monitoring
• Schedule parent-teacher discussion
""";
    } else {
      recommendationColor = Colors.green;

      recommendation = """
✅ Excellent Attendance Performance

Keep encouraging:
• Consistent attendance
• Positive study habits
• Good punctuality
""";
    }

    return Container(
      color: Colors.white,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(
                    Icons.person,
                    color: Color.fromARGB(255, 128, 36, 36),
                    size: 34,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student.name,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: riskColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          riskLevel,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 30),

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

            const SizedBox(height: 20),

            LinearProgressIndicator(
              value: percentage / 100,
              minHeight: 12,
              borderRadius: BorderRadius.circular(20),
              backgroundColor: Colors.grey.shade300,
              color: riskColor,
            ),

            const SizedBox(height: 10),

            Center(
              child: Text(
                "${percentage.toStringAsFixed(1)}% Attendance Performance",
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 25),
            const SizedBox(height: 25),
            _buildAIPrescriptionCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildAIPrescriptionCard() {
    if (isLoadingAI) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color.fromARGB(255, 128, 36, 36).withOpacity(0.08),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: const Color.fromARGB(255, 128, 36, 36),
            width: 2,
          ),
        ),
        child: const Column(
          children: [
            CircularProgressIndicator(
              color: Color.fromARGB(255, 128, 36, 36),
            ),
            SizedBox(height: 12),
            Text(
              "Generating AI prescription...",
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
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.10),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: Colors.red,
            width: 2,
          ),
        ),
        child: Text(
          "AI Prescription Unavailable\n\n$aiError",
          style: const TextStyle(
            color: Colors.black,
            fontSize: 15,
            height: 1.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    final aiColor = _getAIRiskColor(aiRiskLevel);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: aiColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: aiColor,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.psychology,
                color: Color.fromARGB(255, 128, 36, 36),
                size: 28,
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  "AI Prescriptive Analytics",
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 15),

          Text(
            "AI Attendance Rate: $aiAttendanceRate%",
            style: const TextStyle(
              color: Colors.black,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 8),

          Text(
            "AI Risk Level: $aiRiskLevel",
            style: TextStyle(
              color: aiColor,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 15),

          Text(
            aiPrescription,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 15,
              height: 1.6,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
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
      padding: const EdgeInsets.symmetric(
        vertical: 20,
        horizontal: 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 32,
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            title,
            style: const TextStyle(
              color: Colors.black54,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}