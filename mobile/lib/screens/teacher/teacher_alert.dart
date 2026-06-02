import 'package:flutter/material.dart';
import '../../utils/mock_data.dart';

class TeacherAlert extends StatelessWidget {
  final String teacherEmail;

  const TeacherAlert({
    super.key,
    this.teacherEmail = "luciostongco9@gmail.com",
  });

  Widget alertCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String time,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: iconColor.withOpacity(0.15),
            child: Icon(icon, color: iconColor),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  time,
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  int getAbsentCount(String studentId) {
    return attendanceRecords
        .where(
          (record) =>
              record.studentId == studentId && record.status == "Absent",
        )
        .length;
  }

  int getLateCount(String studentId) {
    return attendanceRecords
        .where(
          (record) => record.studentId == studentId && record.status == "Late",
        )
        .length;
  }

  int getPresentCount(String studentId) {
    return attendanceRecords
        .where(
          (record) =>
              record.studentId == studentId && record.status == "Present",
        )
        .length;
  }

  Widget buildStudentAlert(Student student) {
    final present = getPresentCount(student.id);
    final absent = getAbsentCount(student.id);
    final late = getLateCount(student.id);

    if (absent >= 4) {
      return alertCard(
        icon: Icons.error,
        iconColor: Colors.red,
        title: "High Risk Attendance Alert",
        subtitle:
            "${student.name} from ${student.section} has $absent absences and $late late records.",
        time: "Today",
      );
    }

    if (absent >= 2 || late >= 3) {
      return alertCard(
        icon: Icons.warning_amber_rounded,
        iconColor: Colors.orange,
        title: "Moderate Risk Student",
        subtitle:
            "${student.name} from ${student.section} has $absent absences and $late late records.",
        time: "Today",
      );
    }

    if (absent == 0 && late <= 1) {
      return alertCard(
        icon: Icons.star,
        iconColor: Colors.amber,
        title: "Excellent Attendance",
        subtitle:
            "${student.name} from ${student.section} has strong attendance with $present present records.",
        time: "Today",
      );
    }

    return alertCard(
      icon: Icons.check_circle,
      iconColor: Colors.green,
      title: "Good Attendance",
      subtitle:
          "${student.name} from ${student.section} has $present present, $late late, and $absent absent records.",
      time: "Today",
    );
  }

  @override
  Widget build(BuildContext context) {
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: teacherEmail,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color.fromARGB(255, 128, 36, 36),
        centerTitle: true,
        title: const Text(
          "NOTIFICATIONS",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(15),
        child: teacherStudents.isEmpty
            ? const Center(
                child: Text(
                  "No notifications available for your handled section.",
                  style: TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              )
            : ListView(
                children: [
                  alertCard(
                    icon: Icons.class_,
                    iconColor: Colors.blue,
                    title: "Handled Section",
                    subtitle:
                        "You are currently viewing notifications for ${teacherStudents.first.section} only.",
                    time: "Today",
                  ),

                  ...teacherStudents.map((student) {
                    return buildStudentAlert(student);
                  }),

                  alertCard(
                    icon: Icons.qr_code_scanner,
                    iconColor: Colors.purple,
                    title: "QR Attendance Active",
                    subtitle:
                        "QR attendance scanner is operational for your handled section.",
                    time: "Just now",
                  ),
                ],
              ),
      ),
    );
  }
}