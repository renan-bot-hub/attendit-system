import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../screens/auth/login_screen.dart';
import '../screens/parent/parent_profile.dart';

import '../screens/parent/parent_home.dart';
import '../screens/parent/parent_attendance.dart';
import '../screens/parent/parent_analytics.dart';
import '../screens/parent/parent_message.dart';
import '../screens/parent/parent_alert.dart';

import '../screens/teacher/teacher_home.dart';
import '../screens/teacher/teacher_attendance.dart';
import '../screens/teacher/teacher_analytics.dart';
import '../screens/teacher/teacher_message.dart';
import '../screens/teacher/teacher_alert.dart';

class AppLayout extends StatefulWidget {
  final UserModel user;

  const AppLayout({
    super.key,
    required this.user,
  });

  @override
  State<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends State<AppLayout> {
  int _selectedIndex = 0;

  late UserModel user;

  @override
  void initState() {
    super.initState();
    user = widget.user;
  }

  String get _title {
    switch (_selectedIndex) {
      case 0:
        return "Home";

      case 1:
        return "Attendance";

      case 2:
        return "Analytics";

      case 3:
        return "Messages";

      default:
        return "AttendIT";
    }
  }

  Widget _getScreen() {
    if (user.role.toLowerCase() == "parent") {
      switch (_selectedIndex) {
        case 0:
          return ParentHome(user: user);

        case 1:
          return ParentAttendance(user: user);

        case 2:
          return ParentAnalytics(user: user);

        case 3:
          return const ParentMessage();

        default:
          return ParentHome(user: user);
      }
    }

    if (user.role.toLowerCase() == "teacher") {
      switch (_selectedIndex) {
        case 0:
          return TeacherHome(user: user);

        case 1:
          return TeacherAttendance(user: user);

        case 2:
          return TeacherAnalytics(user: user);

        case 3:
          return const TeacherMessage();

        default:
          return TeacherHome(user: user);
      }
    }

    return const Center(
      child: Text(
        "Unknown User Role",
        style: TextStyle(
          color: Colors.black,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _onTap(int index) {
    if (index == 4) {
      _showLogoutDialog();
      return;
    }

    setState(() {
      _selectedIndex = index;
    });
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          title: const Text(
            "Logout",
            style: TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          content: const Text(
            "Are you sure you want to logout?",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: const Text("Cancel"),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);

                Future.microtask(() {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const LoginScreen(),
                    ),
                    (route) => false,
                  );
                });
              },
              child: const Text(
                "Logout",
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color.fromARGB(255, 128, 36, 36),
        elevation: 0,
        centerTitle: true,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            bottom: Radius.circular(20),
          ),
        ),
        title: Text(
          _title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              if (user.role.toLowerCase() == "parent") {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ParentAlertScreen(),
                  ),
                );

                return;
              }

              if (user.role.toLowerCase() == "teacher") {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const TeacherAlert(),
                  ),
                );

                return;
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () async {
              final updatedUser = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ProfileScreen(user: user),
                ),
              );

              if (updatedUser != null && updatedUser is UserModel) {
                setState(() {
                  user = updatedUser;
                });
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: _getScreen(),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color.fromARGB(255, 128, 36, 36),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white70,
        selectedFontSize: 12,
        unselectedFontSize: 11,
        currentIndex: _selectedIndex,
        onTap: _onTap,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fact_check),
            label: "Attendance",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart),
            label: "Analytics",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: "Messages",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.logout),
            label: "Logout",
          ),
        ],
      ),
    );
  }
}
