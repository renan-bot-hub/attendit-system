
import 'package:attendit_mobile/screens/auth/otp_screen.dart';
import 'package:flutter/material.dart';

import '../../widgets/custom_textfield.dart';
import '../../services/api_service.dart';
import '../dashboard/dashboard_screen.dart';
import '../../models/user_model.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  int loginAttempts = 0;
  final int maxAttempts = 3;

  bool isLoading = false;
  bool obscurePassword = true;

  Future<void> login() async {
    if (loginAttempts >= maxAttempts) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Too many login attempts. Please try again later.",
          ),
        ),
      );
      return;
    }

    if (emailController.text.trim().isEmpty ||
        passwordController.text.trim().isEmpty) {
      setState(() => loginAttempts++);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Please fill all fields (${loginAttempts}/3)",
          ),
        ),
      );

      return;
    }

    setState(() => isLoading = true);

    final response = await ApiService.login(
      emailController.text.trim(),
      passwordController.text.trim(),
    );

    if (!mounted) return;

    if (response['success'] != true) {
      setState(() {
        loginAttempts++;
        isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "${response['message'] ?? 'Login failed'} (${loginAttempts}/3)",
          ),
        ),
      );

      return;
    }

    final data = response['data'] ?? response;
    final userData = data['user'] ?? {};

    UserModel user = UserModel(
      id: userData['id'] ?? userData['_id'] ?? '',
      email: userData['email'] ?? '',
      role: userData['role'] ?? '',
      name: userData['name'] ?? '',
      token: data['token'] ?? '',
      parentId: userData['parentId'],
      studentId: userData['studentId'],
      studentNumber: userData['studentNumber'],
      contactNumber: userData['contactNumber'],
      birthdate: userData['birthdate'],
      gradeSection: userData['gradeSection'],
    );

    final otpResponse = await ApiService.sendOTP(user.email);

    setState(() => isLoading = false);

    if (otpResponse['success'] != true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            otpResponse['message'] ?? "Failed to send OTP",
          ),
        ),
      );

      return;
    }

    if (!mounted) return;

    final verified = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OtpScreen(
          email: user.email,
        ),
      ),
    );

    if (verified == true && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => DashboardScreen(
            user: user,
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 128, 36, 36),

      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: 25,
              vertical: 20,
            ),

            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [

                // LOGO
                Container(
                  width: 95,
                  height: 95,

                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 3,
                    ),
                  ),

                  child: ClipOval(
                    child: Image.asset(
                      'assets/logo.png',
                      fit: BoxFit.cover,
                    ),
                  ),
                ),

                const SizedBox(height: 25),

                // TITLE
                const Text(
                  "ATTEND-IT",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),

                const SizedBox(height: 10),

                const Text(
                  "Attendance Monitoring System",
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 15,
                  ),
                ),

                const SizedBox(height: 45),

                // EMAIL
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),

                  child: CustomTextField(
                    icon: Icons.email_outlined,
                    hint: "Email",
                    controller: emailController,
                  ),
                ),

                const SizedBox(height: 18),

                // PASSWORD
                // PASSWORD
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: TextField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.lock_outline),
                      hintText: "Password",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () {
                          setState(() {
                            obscurePassword = !obscurePassword;
                          });
                        },
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 35),

                // LOGIN BUTTON
                SizedBox(
                  width: double.infinity,
                  height: 55,

                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor:
                          const Color.fromARGB(255, 128, 36, 36),

                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),

                      elevation: 4,
                    ),

                    onPressed: isLoading ? null : login,

                    child: isLoading
                        ? const SizedBox(
                            width: 25,
                            height: 25,
                            child: CircularProgressIndicator(
                              color: Color.fromARGB(255, 128, 36, 36),
                              strokeWidth: 3,
                            ),
                          )
                        : const Text(
                            "LOGIN",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 25),

                const Text(
                  "Secure OTP Verification Enabled",
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
