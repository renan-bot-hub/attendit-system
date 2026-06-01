import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../utils/mock_data.dart';

class TeacherAttendance extends StatelessWidget {
  final UserModel user;

  const TeacherAttendance({
    super.key,
    required this.user,
  });

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
    final teacherStudents = findStudentsForTeacher(
      teacherEmail: user.email,
    );

    final teacherStudentIds = teacherStudents
        .map((student) => student.id)
        .toList();

    final teacherRecords = attendanceRecords
        .where((record) => teacherStudentIds.contains(record.studentId))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final presentCount =
        teacherRecords.where((record) => record.status == "Present").length;

    final lateCount =
        teacherRecords.where((record) => record.status == "Late").length;

    final absentCount =
        teacherRecords.where((record) => record.status == "Absent").length;

    return Container(
      color: Colors.white,
      child: teacherStudents.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  "No student records linked to ${user.email}.",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Student Attendance Records",
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Teacher: ${user.name ?? user.email}",
                        style: const TextStyle(
                          color: Colors.black54,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Linked Students: ${teacherStudents.length}",
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
                                  getStudentName(record.studentId),
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