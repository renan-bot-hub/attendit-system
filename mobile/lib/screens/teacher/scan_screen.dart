import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../utils/mock_data.dart';
import '../../models/user_model.dart';

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

    try {
      final student = students.firstWhere(
        (s) => s.id == qrCode,
      );

      addAttendance(student.id);

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Attendance Recorded"),
          content: Text(
            "${student.name} marked PRESENT successfully.",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);

                setState(() {
                  isProcessing = false;
                });
              },
              child: const Text("OK"),
            ),
          ],
        ),
      );
    } catch (e) {
      setState(() {
        isProcessing = false;
      });

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Invalid QR"),
          content: const Text(
            "Student record not found.",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text("OK"),
            ),
          ],
        ),
      );
    }
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

              if (code != null) {
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

          // LOADING
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
