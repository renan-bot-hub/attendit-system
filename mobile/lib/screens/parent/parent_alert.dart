import 'package:flutter/material.dart';

class ParentAlertScreen extends StatelessWidget {
  const ParentAlertScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final List<Map<String, dynamic>> notifications = [
      {
        "date": "2025-01-02",
        "status": "Absent",
        "message":
            "Renan Turno was marked ABSENT today. Please contact the adviser if needed.",
      },
      {
        "date": "2025-01-03",
        "status": "Late",
        "message":
            "Renan Turno arrived LATE to class today.",
      },
      {
        "date": "2025-01-04",
        "status": "Absent",
        "message":
            "Renan Turno was marked ABSENT today.",
      },
      {
        "date": "2025-01-05",
        "status": "Absent",
        "message":
            "Attendance Warning: Renan Turno now has multiple absences.",
      },
      {
        "date": "2025-01-06",
        "status": "Late",
        "message":
            "Renan Turno arrived LATE again today.",
      },
      {
        "date": "2025-01-08",
        "status": "Absent",
        "message":
            "Renan Turno was marked ABSENT on this day.",
      },
      {
        "date": "2025-01-09",
        "status": "Late",
        "message":
            "Renan Turno was marked LATE today.",
      },
      {
        "date": "2025-01-10",
        "status": "Absent",
        "message":
            "Final Attendance Reminder: Renan Turno was absent again.",
      },
    ];

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 132, 7, 7),

      appBar: AppBar(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255),
        elevation: 0,
        centerTitle: true,
        title: const Text(
          "Parent Notifications",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),

      body: ListView.builder(
        padding: const EdgeInsets.all(15),
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final notification = notifications[index];

          bool isAbsent = notification["status"] == "Absent";

          return Container(
            margin: const EdgeInsets.only(bottom: 15),
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: const Color.fromARGB(255, 255, 255, 255),
              borderRadius: BorderRadius.circular(20),
            ),

            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor: isAbsent
                      ? Colors.red.withOpacity(0.2)
                      : Colors.orange.withOpacity(0.2),

                  child: Icon(
                    isAbsent
                        ? Icons.warning_amber_rounded
                        : Icons.access_time,

                    color: isAbsent
                        ? Colors.red
                        : Colors.orange,
                    size: 28,
                  ),
                ),

                const SizedBox(width: 15),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification["status"],
                        style: TextStyle(
                          color: isAbsent
                              ? Colors.red[200]
                              : Colors.orange[200],
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 5),

                      Text(
                        notification["message"],
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                        ),
                      ),

                      const SizedBox(height: 8),

                      Text(
                        "Date: ${notification["date"]}",
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
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
}