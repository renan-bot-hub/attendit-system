class UserModel {
  final String id;
  final String email;
  final String role;

  final String? name;
  final String? token;

  // NEW
  final String? parentId;
  final String? studentId;

  final String? studentNumber;
  final String? contactNumber;
  final String? birthdate;
  final String? gradeSection;
  final String? profileImage;

  UserModel({
    required this.id,
    required this.email,
    required this.role,

    this.name,
    this.token,

    this.parentId,
    this.studentId,

    this.studentNumber,
    this.contactNumber,
    this.birthdate,
    this.gradeSection,
    this.profileImage,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? json;

    return UserModel(
      id: user['id'] ?? user['_id'] ?? '',
      email: user['email'] ?? '',
      role: user['role'] ?? '',

      name: user['name'],
      token: json['token'],

      // NEW
      parentId: user['parentId'],
      studentId: user['studentId'],

      studentNumber: user['studentNumber'],
      contactNumber: user['contactNumber'],
      birthdate: user['birthdate'],
      gradeSection: user['gradeSection'],
      profileImage: user['profileImage'],
    );
  }

  UserModel copyWith({
    String? name,
    String? contactNumber,
    String? birthdate,
    String? gradeSection,
    String? profileImage,
  }) {
    return UserModel(
      id: id,
      email: email,
      role: role,

      token: token,

      parentId: parentId,
      studentId: studentId,

      name: name ?? this.name,
      contactNumber: contactNumber ?? this.contactNumber,
      birthdate: birthdate ?? this.birthdate,
      gradeSection: gradeSection ?? this.gradeSection,
      profileImage: profileImage ?? this.profileImage,

      studentNumber: studentNumber,
    );
  }
}