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

class _TeacherAnalyticsState extends State<TeacherAnalytics> {
  final Map<String, Map<String, dynamic>> aiResults = {};
  bool isLoadingAI = true;

  @override
  void initState() {
    super.initState();
    _loadAIForStudents();
  }

  Future<void> _loadAIForStudents() async {
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: widget.user.email,
    );

    for (final student in teacherStudents) {
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

      if (response['success'] == true) {
        aiResults[student.id] = response['data']?['result'] ?? {};
      } else {
        aiResults[student.id] = {
          "riskLevel": "Unavailable",
          "prescription": response['message'] ?? "AI analysis failed.",
          "confidence": "0.00",
        };
      }
    }

    if (mounted) {
      setState(() {
        isLoadingAI = false;
      });
    }
  }

  Color _riskColor(String risk) {
    final value = risk.toLowerCase();

    if (value.contains("high")) return Colors.red;
    if (value.contains("moderate")) return Colors.orange;
    if (value.contains("low")) return Colors.green;

    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: widget.user.email,
    );

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
            "TensorFlow-based AI prescriptions for student attendance",
            style: TextStyle(
              color: Colors.black54,
              fontSize: 15,
            ),
          ),

          const SizedBox(height: 25),

          if (teacherStudents.isEmpty)
            const Expanded(
              child: Center(
                child: Text(
                  "No students linked to this teacher account.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
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
                itemCount: teacherStudents.length,
                itemBuilder: (context, index) {
                  final student = teacherStudents[index];

                  final records = attendanceRecords
                      .where((r) => r.studentId == student.id)
                      .toList();

                  final present =
                      records.where((r) => r.status == "Present").length;

                  final absent =
                      records.where((r) => r.status == "Absent").length;

                  final late =
                      records.where((r) => r.status == "Late").length;

                  final total = records.length;

                  final score = (present * 1.0) + (late * 0.5);

                  final rate = total == 0 ? 0 : (score / total) * 100;

                  final aiData = aiResults[student.id];

                  final aiRisk = aiData?['riskLevel']?.toString() ??
                      "Analyzing...";

                  final aiPrescription =
                      aiData?['prescription']?.toString() ??
                          "Generating AI prescription...";

                  final confidence =
                      aiData?['confidence']?.toString() ?? "0.00";

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
                                    student.name,
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
                          child: isLoadingAI
                              ? const Row(
                                  children: [
                                    SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                    SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        "Generating AI prescription...",
                                        style: TextStyle(
                                          color: Colors.black,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              : Column(
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
                                            "TensorFlow AI Prescription",
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