import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../models/user_model.dart';
import '../../services/api_service.dart';

class ScanScreen extends StatefulWidget {
  final UserModel user;

  const ScanScreen({super.key, required this.user});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  bool isProcessing = false;

  Future<void> handleScan(String qrCode) async {
    if (isProcessing) return;

    setState(() {
      isProcessing = true;
    });

    final token = widget.user.token;

    if (token == null || token.trim().isEmpty) {
      setState(() {
        isProcessing = false;
      });

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Login Required"),
          content: const Text("Your login session is missing. Please log in again."),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("OK"),
            ),
          ],
        ),
      );
      return;
    }

    final response = await ApiService.markAttendance(token, qrCode);

    if (!mounted) return;

    setState(() {
      isProcessing = false;
    });

    final bool success = response['success'] == true;
    final String message = response['message']?.toString() ??
        (success ? "Attendance recorded successfully." : "Unable to record attendance.");

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(success ? "Attendance Recorded" : "Scan Failed"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFFF44336),
        centerTitle: true,
        title: const Text("QR Attendance Scanner"),
      ),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (capture) {
              if (isProcessing) return;

              final barcode = capture.barcodes.first;
              final String? code = barcode.rawValue;

              if (code != null && code.trim().isNotEmpty) {
                handleScan(code);
              }
            },
          ),

          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.white,
                  width: 4,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),

          if (isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              ),
            ),
        ],
      ),
    );
  }
}