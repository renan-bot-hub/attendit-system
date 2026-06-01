import 'package:flutter/material.dart';

class RoleSelector extends StatelessWidget {
  final String selectedRole;
  final Function(String) onSelect;

  const RoleSelector({
    super.key,
    required this.selectedRole,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    List<String> roles = ["Parent", "Teacher"]; 
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: roles.map((role) {
        return ChoiceChip(
          label: Text(role),
          selected: selectedRole == role,
          onSelected: (_) => onSelect(role),
        );
      }).toList(),
    );
  }
}