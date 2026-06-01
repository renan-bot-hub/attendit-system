import 'package:flutter/material.dart';
import '../../utils/mock_data.dart';

class TeacherAlert extends StatelessWidget {
  const TeacherAlert({super.key});

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
        color: const Color.fromARGB(255, 255, 255, 255),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: const Color.fromARGB(255, 128, 36, 36),
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
              record.studentId == studentId &&
              record.status == "Absent",
        )
        .length;
  }

  int getLateCount(String studentId) {
    return attendanceRecords
        .where(
          (record) =>
              record.studentId == studentId &&
              record.status == "Late",
        )
        .length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255),

      appBar: AppBar(
        backgroundColor: const Color.fromARGB(255, 255, 255, 255),
        centerTitle: true,
        title: const Text(
          "NOTIFICATIONS",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),

      body: Padding(
        padding: const EdgeInsets.all(15),
        child: ListView(
          children: [
            alertCard(
              icon: Icons.warning_amber_rounded,
              iconColor: Colors.red,
              title: "High Absence Alert",
              subtitle:
                  "Renan Turno has ${getAbsentCount("S1")} absences and ${getLateCount("S1")} late records.",
              time: "Today",
            ),

            alertCard(
              icon: Icons.check_circle,
              iconColor: Colors.green,
              title: "Good Attendance",
              subtitle:
                  "Nash Tongco maintains strong attendance performance.",
              time: "Today",
            ),

            alertCard(
              icon: Icons.analytics,
              iconColor: Colors.orange,
              title: "Moderate Risk Student",
              subtitle:
                  "Ranjet Hussein has frequent absences that may affect performance.",
              time: "Today",
            ),

            alertCard(
              icon: Icons.star,
              iconColor: Colors.yellow,
              title: "Excellent Attendance",
              subtitle:
                  "Ace Espejo has one of the best attendance records.",
              time: "Today",
            ),

            alertCard(
              icon: Icons.error,
              iconColor: Colors.red,
              title: "Critical Attendance Warning",
              subtitle:
                  "Mariel Naval requires immediate attendance intervention.",
              time: "Today",
            ),

            alertCard(
              icon: Icons.schedule,
              iconColor: Colors.blue,
              title: "Late Attendance Notice",
              subtitle:
                  "Mika Manimbo has multiple late attendance records.",
              time: "Today",
            ),

            alertCard(
              icon: Icons.qr_code_scanner,
              iconColor: Colors.purple,
              title: "QR Attendance Active",
              subtitle:
                  "Teacher QR attendance scanner is operational.",
              time: "Just now",
            ),

            alertCard(
              icon: Icons.chat,
              iconColor: Colors.teal,
              title: "New Parent Inquiry",
              subtitle:
                  "A parent requested to talk to the adviser.",
              time: "5 mins ago",
            ),
          ],
        ),
      ),
    );
  }
}

