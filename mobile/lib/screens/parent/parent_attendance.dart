import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../utils/mock_data.dart';

class ParentAttendance extends StatelessWidget {
  final UserModel user;

  const ParentAttendance({
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
      return const Center(
        child: Text(
          "No student record linked to this parent account.",
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
        .where((record) => record.studentId == student!.id)
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final presentCount =
        records.where((e) => e.status == "Present").length;

    final lateCount =
        records.where((e) => e.status == "Late").length;

    final absentCount =
        records.where((e) => e.status == "Absent").length;

    return Container(
      color: const Color.fromARGB(255, 255, 255, 255),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // HEADER
          Row(
            children: [
              const CircleAvatar(
                radius: 28,
                backgroundColor: Color.fromARGB(255, 132, 7, 7),
                child: Icon(
                  Icons.person,
                  color: Colors.white,
                  size: 32,
                ),
              ),

              const SizedBox(width: 15),

              Expanded(
                child: Text(
                  "${student.name}'s Attendance",
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 25),

          // SUMMARY CARDS
          Row(
            children: [
              Expanded(
                child: _buildSummaryCard(
                  title: "Present",
                  count: presentCount.toString(),
                  color: Colors.green,
                  icon: Icons.check_circle,
                ),
              ),

              const SizedBox(width: 10),

              Expanded(
                child: _buildSummaryCard(
                  title: "Late",
                  count: lateCount.toString(),
                  color: Colors.orange,
                  icon: Icons.access_time,
                ),
              ),

              const SizedBox(width: 10),

              Expanded(
                child: _buildSummaryCard(
                  title: "Absent",
                  count: absentCount.toString(),
                  color: Colors.red,
                  icon: Icons.cancel,
                ),
              ),
            ],
          ),

          const SizedBox(height: 25),

          // EMPTY RECORDS
          if (records.isEmpty)
            const Expanded(
              child: Center(
                child: Text(
                  "No attendance records found.",
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            )

          // ATTENDANCE LIST
          else
            Expanded(
              child: ListView.builder(
                itemCount: records.length,
                itemBuilder: (context, index) {

                  final record = records[index];

                  Color statusColor;
                  IconData statusIcon;
                  String subtitle;

                  switch (record.status) {

                    case "Present":
                      statusColor = Colors.green;
                      statusIcon = Icons.check;
                      subtitle = "Student attended class";
                      break;

                    case "Late":
                      statusColor = Colors.orange;
                      statusIcon = Icons.access_time;
                      subtitle = "Student arrived late";
                      break;

                    default:
                      statusColor = Colors.red;
                      statusIcon = Icons.close;
                      subtitle = "Student was absent";
                  }

                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.only(bottom: 14),

                    decoration: BoxDecoration(
                      color: const Color.fromARGB(255, 132, 7, 7),
                      borderRadius: BorderRadius.circular(20),

                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 8,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),

                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),

                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor:
                            statusColor.withOpacity(0.18),

                        child: Icon(
                          statusIcon,
                          color: statusColor,
                        ),
                      ),

                      title: Text(
                        record.date,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),

                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4),

                        child: Text(
                          subtitle,
                          style: const TextStyle(
                            color: Colors.white70,
                          ),
                        ),
                      ),

                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 7,
                        ),

                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(30),
                        ),

                        child: Text(
                          record.status,
                          style: const TextStyle(
                            color: Colors.white,
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

    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: 18,
        horizontal: 10,
      ),

      decoration: BoxDecoration(
        color: const Color.fromARGB(255, 134, 32, 32),
        borderRadius: BorderRadius.circular(18),
      ),

      child: Column(
        children: [

          Icon(
            icon,
            color: color,
            size: 30,
          ),

          const SizedBox(height: 10),

          Text(
            count,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 5),

          Text(
            title,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
