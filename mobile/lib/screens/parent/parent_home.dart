import 'package:flutter/material.dart';
import '../../models/user_model.dart';

class ParentHome extends StatelessWidget {
  final UserModel user;

  const ParentHome({
    super.key,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color.fromARGB(255, 255, 255, 255),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.family_restroom,
            color: Color.fromARGB(255, 0, 0, 0),
            size: 50,
          ),
          const SizedBox(height: 20),
          Text(
            "Welcome, ${user.name ?? "Parent"}!",
            style: const TextStyle(
              color: Color.fromARGB(255, 0, 0, 0),
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            "Monitor your child attendance and analytics.",
            style: TextStyle(
              color: Color.fromARGB(255, 0, 0, 0),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}
