import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../models/user_model.dart';
import '../../services/api_service.dart';

class EditProfileScreen extends StatefulWidget {
  final UserModel user;

  const EditProfileScreen({
    super.key,
    required this.user,
  });

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController nameController;
  late TextEditingController contactNumberController;
  late TextEditingController birthdateController;
  late TextEditingController gradeSectionController;

  bool isSaving = false;

  @override
  void initState() {
    super.initState();

    nameController = TextEditingController(text: widget.user.name ?? '');
    contactNumberController =
        TextEditingController(text: widget.user.contactNumber ?? '');
    birthdateController = TextEditingController(text: widget.user.birthdate ?? '');
    gradeSectionController =
        TextEditingController(text: widget.user.gradeSection ?? '');
  }

  bool _isValidContactNumber(String number) {
    final regex = RegExp(r'^[0-9]{11}$');
    return regex.hasMatch(number);
  }

  Future<void> _pickBirthdate() async {
    final now = DateTime.now();
    DateTime initialDate = DateTime(2000);

    if (birthdateController.text.trim().isNotEmpty) {
      try {
        initialDate = DateTime.parse(birthdateController.text.trim());
      } catch (_) {
        initialDate = DateTime(2000);
      }
    }

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1950),
      lastDate: now,
      helpText: "Select Birthdate",
      confirmText: "SELECT",
      cancelText: "CANCEL",
    );

    if (pickedDate != null) {
      final formattedDate =
          "${pickedDate.year.toString().padLeft(4, '0')}-"
          "${pickedDate.month.toString().padLeft(2, '0')}-"
          "${pickedDate.day.toString().padLeft(2, '0')}";

      setState(() {
        birthdateController.text = formattedDate;
      });
    }
  }

  Future<void> _save() async {
    final name = nameController.text.trim();
    final contact = contactNumberController.text.trim();
    final birthdate = birthdateController.text.trim();
    final gradeSection = gradeSectionController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Name is required")),
      );
      return;
    }

    if (contact.isNotEmpty && !_isValidContactNumber(contact)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Contact number must contain exactly 11 digits"),
        ),
      );
      return;
    }

    if (birthdate.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select your birthdate")),
      );
      return;
    }

    final token = widget.user.token ?? '';

    if (token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Session expired. Please login again.")),
      );
      return;
    }

    setState(() {
      isSaving = true;
    });

    final result = await ApiService.updateProfile(
      token,
      {
        "name": name,
        "contactNumber": contact,
        "birthdate": birthdate,
        "gradeSection": gradeSection,
      },
    );

    if (!mounted) return;

    setState(() {
      isSaving = false;
    });

    if (result['success'] == true && result['data'] != null) {
      final updatedUserJson = result['data']['user'];

      if (updatedUserJson == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("No updated data received")),
        );
        return;
      }

      final updatedUser = UserModel.fromJson({
        "user": updatedUserJson,
        "token": token,
      });

      Navigator.pop(context, updatedUser);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile updated successfully")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Update failed'),
        ),
      );
    }
  }

  Widget _field({
    required String label,
    required TextEditingController controller,
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? inputFormatters,
    bool readOnly = false,
    VoidCallback? onTap,
    IconData? suffixIcon,
    String? helperText,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        readOnly: readOnly,
        onTap: onTap,
        style: const TextStyle(
          color: Colors.black,
          fontSize: 16,
        ),
        decoration: InputDecoration(
          labelText: label,
          helperText: helperText,
          labelStyle: const TextStyle(
            color: Colors.black87,
          ),
          helperStyle: const TextStyle(
            color: Colors.black54,
          ),
          filled: true,
          fillColor: const Color.fromARGB(255, 245, 245, 245),
          suffixIcon: suffixIcon != null
              ? Icon(
                  suffixIcon,
                  color: const Color.fromARGB(255, 132, 7, 7),
                )
              : null,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: Color.fromARGB(255, 132, 7, 7),
              width: 1.2,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: Color.fromARGB(255, 132, 7, 7),
              width: 2,
            ),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    contactNumberController.dispose();
    birthdateController.dispose();
    gradeSectionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        backgroundColor: const Color.fromARGB(255, 132, 7, 7),
        centerTitle: true,
        title: const Text(
          "EDIT PROFILE",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: const IconThemeData(
          color: Colors.white,
        ),
      ),

      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),

          child: Column(
            children: [
              const SizedBox(height: 10),

              _field(
                label: "Name",
                controller: nameController,
              ),

              _field(
                label: "Contact Number",
                controller: contactNumberController,
                keyboardType: TextInputType.number,
                helperText: "Must be exactly 11 digits",
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(11),
                ],
              ),

              _field(
                label: "Birthdate",
                controller: birthdateController,
                readOnly: true,
                onTap: _pickBirthdate,
                suffixIcon: Icons.calendar_month,
                helperText: "Tap to select your birthdate",
              ),

              _field(
                label: "Grade & Section",
                controller: gradeSectionController,
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromARGB(255, 132, 7, 7),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 3,
                  ),
                  onPressed: isSaving ? null : _save,
                  child: isSaving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          "SAVE CHANGES",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}