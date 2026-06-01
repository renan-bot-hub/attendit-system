import 'package:attendit_mobile/models/user_model.dart';
import 'package:flutter/material.dart';

import '../../utils/mock_data.dart';

class ParentAlertScreen extends StatelessWidget {
  final UserModel user;

  const ParentAlertScreen({
    super.key,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    final student = findStudentForParent(
      parentEmail: user.email,
      parentId: user.parentId ?? user.id,
      studentId: user.studentId,
      parentName: user.name,
    );

    if (student == null) {
      return Scaffold(
        backgroundColor: const Color.fromARGB(255, 132, 7, 7),
        appBar: _buildAppBar(),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              "No student notifications linked to this parent account.",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      );
    }

    final studentRecords = attendanceRecords
        .where((record) => record.studentId == student.id)
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final notifications = <Map<String, String>>[];

    int absentCount = 0;
    int lateCount = 0;

    for (final record in studentRecords) {
      if (record.status == "Absent") absentCount++;
      if (record.status == "Late") lateCount++;

      notifications.add({
        "date": record.date,
        "status": record.status,
        "message": _buildMessage(
          studentName: student.name,
          status: record.status,
        ),
      });
    }

    if (absentCount >= 3) {
      notifications.insert(0, {
        "date": DateTime.now().toString().split(" ")[0],
        "status": "Warning",
        "message":
            "Attendance Warning: ${student.name} has accumulated $absentCount absences. Parent monitoring is strongly recommended.",
      });
    }

    if (lateCount >= 3) {
      notifications.insert(0, {
        "date": DateTime.now().toString().split(" ")[0],
        "status": "Warning",
        "message":
            "Punctuality Warning: ${student.name} has accumulated $lateCount late arrivals.",
      });
    }

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 132, 7, 7),
      appBar: _buildAppBar(),
      body: notifications.isEmpty
          ? Center(
              child: Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  "${student.name} has no attendance notifications.",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(15),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                final status = notification["status"] ?? "";

                final bool isAbsent = status == "Absent";
                final bool isLate = status == "Late";
                final bool isWarning = status == "Warning";

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
                              notification["message"] ?? "",
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              "Date: ${notification["date"] ?? ""}",
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
        "Parent Notifications",
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
      case "Present":
        return "$studentName was successfully marked PRESENT today.";
      case "Late":
        return "$studentName arrived LATE to class today.";
      case "Absent":
        return "$studentName was marked ABSENT today. Please contact the adviser if necessary.";
      default:
        return "$studentName has an attendance update.";
    }
  }
}
