import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class OtpScreen extends StatefulWidget {
  final String email;

  const OtpScreen({
    super.key,
    required this.email,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final otpController = TextEditingController();

  bool isLoading = false;
  bool isResending = false;
  int secondsLeft = 60;
  Timer? timer;

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  void startTimer() {
    timer?.cancel();

    setState(() {
      secondsLeft = 60;
    });

    timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (secondsLeft <= 0) {
        timer.cancel();
      } else {
        setState(() {
          secondsLeft--;
        });
      }
    });
  }

  Future<void> verify() async {
    final otp = otpController.text.trim();

    if (otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter the OTP")),
      );
      return;
    }

    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("OTP must be 6 digits")),
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    final response = await ApiService.verifyOTP(widget.email, otp);

    if (!mounted) return;

    setState(() {
      isLoading = false;
    });

    if (response["success"] == true) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response["message"] ?? "Invalid OTP"),
        ),
      );
    }
  }

  Future<void> resendOTP() async {
    setState(() {
      isResending = true;
    });

    final response = await ApiService.sendOTP(widget.email);

    if (!mounted) return;

    setState(() {
      isResending = false;
    });

    if (response["success"] == true) {
      otpController.clear();
      startTimer();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("New OTP sent successfully")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response["message"] ?? "Failed to resend OTP"),
        ),
      );
    }
  }

  @override
  void dispose() {
    timer?.cancel();
    otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 128, 36, 36),
      appBar: AppBar(
        backgroundColor: const Color.fromARGB(255, 128, 36, 36),
        elevation: 0,
        title: const Text("OTP Verification"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.verified_user,
                  size: 60,
                  color: Color.fromARGB(255, 227, 93, 93),
                ),
                const SizedBox(height: 15),
                const Text(
                  "Verify Your Account",
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  "A 6-digit verification code was sent to ${widget.email}",
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 25),
                TextField(
                  controller: otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    letterSpacing: 8,
                    fontWeight: FontWeight.bold,
                  ),
                  decoration: const InputDecoration(
                    counterText: "",
                    labelText: "Enter OTP",
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : verify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(255, 227, 93, 93),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            "VERIFY",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 15),
                TextButton(
                  onPressed:
                      secondsLeft == 0 && !isResending ? resendOTP : null,
                  child: isResending
                      ? const Text("Sending...")
                      : Text(
                          secondsLeft == 0
                              ? "Resend OTP"
                              : "Resend OTP in ${secondsLeft}s",
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