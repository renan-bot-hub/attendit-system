import 'package:flutter/material.dart';

import '../../models/user_model.dart';
import 'scan_screen.dart';

class TeacherHome extends StatelessWidget {
  final UserModel user;

  const TeacherHome({
    super.key,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color.fromARGB(255, 255, 255, 255),

      child: Column(
        children: [
          const SizedBox(height: 30),

          const Text(
            "Teacher Dashboard",
            style: TextStyle(
              color: Colors.black,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 10),

          const Text(
            "Manage attendance and monitor students",
            style: TextStyle(
              color: Colors.black54,
            ),
          ),

          const SizedBox(height: 40),

          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ScanScreen(user: user),
                ),
              );
            },

            child: Container(
              width: double.infinity,
              height: 90,

              decoration: BoxDecoration(
                color: const Color.fromARGB(255, 103, 2, 2),
                borderRadius: BorderRadius.circular(20),
              ),

              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.qr_code_scanner,
                    size: 35,
                    color: Colors.white,
                  ),

                  SizedBox(width: 15),

                  Text(
                    "SCAN ATTENDANCE",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}