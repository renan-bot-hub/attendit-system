import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../widgets/app_layout.dart';

class DashboardScreen extends StatelessWidget {
  final UserModel user;

  const DashboardScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return AppLayout(user: user);
  }
}