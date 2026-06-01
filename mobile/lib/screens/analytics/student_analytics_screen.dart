import 'package:flutter/material.dart';
import '../../utils/mock_data.dart';
import '../../utils/constants.dart';

class StudentAnalyticsScreen extends StatelessWidget {
  final String studentId;
  final String studentName;

  const StudentAnalyticsScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  int count(String status) {
    return attendanceRecords
        .where((r) =>
            r.studentId == studentId &&
            r.status.toLowerCase() == status.toLowerCase())
        .length;
  }

  @override
  Widget build(BuildContext context) {
    final present = count("Present");
    final absent = count("Absent");
    final late = count("Late");

    String insight;
    if (absent >= 2) {
      insight = "⚠️ High risk: Needs intervention";
    } else if (late >= 2) {
      insight = "⚠️ Frequently late";
    } else {
      insight = "✅ Good attendance";
    }

    return Scaffold(
      backgroundColor: AppColors.primary,

      appBar: AppBar(
        title: Text(studentName),
        backgroundColor: AppColors.secondary,
      ),

      body: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          children: [
            _card("Present", present),
            _card("Absent", absent),
            _card("Late", late),

            const SizedBox(height: 20),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                insight,
                style: const TextStyle(color: Colors.white),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _card(String title, int value) {
    return Card(
      color: AppColors.secondary,
      child: ListTile(
        title: Text(title, style: const TextStyle(color: Colors.white)),
        trailing: Text(
          value.toString(),
          style: const TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}