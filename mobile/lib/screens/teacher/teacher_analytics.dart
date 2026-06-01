import 'package:flutter/material.dart';

import '../../models/user_model.dart';
import '../../utils/mock_data.dart';

class TeacherAnalytics extends StatelessWidget {
  final UserModel user;

  const TeacherAnalytics({
    super.key,
    required this.user,
  });

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
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: user.email,
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
            "Attendance-based prescriptions for student performance",
            style: TextStyle(
              color: Colors.black54,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 25),
          if (teacherStudents.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  "No students linked to ${user.email}.",
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
                  final late = records.where((r) => r.status == "Late").length;

                  final total = records.length;
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
