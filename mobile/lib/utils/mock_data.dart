class Student {
  final String id;
  final String name;
  final String parentId;
  final String parentEmail;
  final String teacherEmail;

  Student({
    required this.id,
    required this.name,
    required this.parentId,
    required this.parentEmail,
    required this.teacherEmail,
  });
}

class Teacher {
  final String id;
  final String name;
  final String teacherNumber;
  final String Email;
  final String teacherEmail;

  Teacher({
    required this.id,
    required this.name,
    required this.teacherNumber,
    required this.Email,
    required this.teacherEmail,
  });
}

class Attendance {
  final String studentId;
  final String date;
  final String status;

  Attendance({
    required this.studentId,
    required this.date,
    required this.status,
  });
}

final students = [
  Student(
    id: "S1",
    name: "Renan Turno",
    parentId: "P1",
    parentEmail: "renan.turno.cgroup@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
  Student(
    id: "S2",
    name: "Nash Tongco",
    parentId: "P2",
    parentEmail: "nashtongco25@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
  Student(
    id: "S3",
    name: "Ranjet Hussein",
    parentId: "P3",
    parentEmail: "desurefu@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
  Student(
    id: "S4",
    name: "Ace Espejo",
    parentId: "P4",
    parentEmail: "aetheramma@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
  Student(
    id: "S5",
    name: "Mariel Naval",
    parentId: "P5",
    parentEmail: "annemrl04@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
  Student(
    id: "S6",
    name: "Mika Manimbo",
    parentId: "P6",
    parentEmail: "mikaangela02@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
];

final teachers = [
  Teacher(
    id: "T1",
    name: "Ace Espejo",
    teacherNumber: "T1",
    Email: "aceespejo2001@gmail.com",
    teacherEmail: "aceespejo2001@gmail.com",
  ),
];

String _normalize(String? value) {
  return (value ?? "").trim().toLowerCase();
}

Student? findStudentForParent({
  required String parentEmail,
  String? parentId,
  String? studentId,
  String? parentName,
}) {
  final cleanParentEmail = _normalize(parentEmail);
  final cleanParentId = _normalize(parentId);
  final cleanStudentId = _normalize(studentId);

  for (final student in students) {
    final emailMatches = cleanParentEmail.isNotEmpty &&
        _normalize(student.parentEmail) == cleanParentEmail;

    final parentIdMatches = cleanParentId.isNotEmpty &&
        _normalize(student.parentId) == cleanParentId;

    final studentIdMatches =
        cleanStudentId.isNotEmpty && _normalize(student.id) == cleanStudentId;

    if (emailMatches || parentIdMatches || studentIdMatches) {
      return student;
    }
  }

  return null;
}

List<Student> findStudentsForTeacher({
  required String teacherEmail,
}) {
  final cleanTeacherEmail = _normalize(teacherEmail);

  return students.where((student) {
    return _normalize(student.teacherEmail) == cleanTeacherEmail;
  }).toList();
}

String getStudentName(String studentId) {
  final student = students.firstWhere(
    (student) => student.id == studentId,
    orElse: () => Student(
      id: studentId,
      name: "Unknown Student",
      parentId: "",
      parentEmail: "",
      teacherEmail: "",
    ),
  );

  return student.name;
}

List<Attendance> attendanceRecords = [
  // RENAN
  Attendance(studentId: "S1", date: "2025-01-01", status: "Present"),
  Attendance(studentId: "S1", date: "2025-01-02", status: "Absent"),
  Attendance(studentId: "S1", date: "2025-01-03", status: "Late"),
  Attendance(studentId: "S1", date: "2025-01-04", status: "Absent"),
  Attendance(studentId: "S1", date: "2025-01-05", status: "Absent"),
  Attendance(studentId: "S1", date: "2025-01-06", status: "Late"),
  Attendance(studentId: "S1", date: "2025-01-07", status: "Present"),
  Attendance(studentId: "S1", date: "2025-01-08", status: "Absent"),
  Attendance(studentId: "S1", date: "2025-01-09", status: "Late"),
  Attendance(studentId: "S1", date: "2025-01-10", status: "Absent"),

  // NASH
  Attendance(studentId: "S2", date: "2025-01-01", status: "Present"),
  Attendance(studentId: "S2", date: "2025-01-02", status: "Late"),
  Attendance(studentId: "S2", date: "2025-01-03", status: "Present"),
  Attendance(studentId: "S2", date: "2025-01-04", status: "Absent"),
  Attendance(studentId: "S2", date: "2025-01-05", status: "Present"),
  Attendance(studentId: "S2", date: "2025-01-06", status: "Late"),
  Attendance(studentId: "S2", date: "2025-01-07", status: "Present"),
  Attendance(studentId: "S2", date: "2025-01-08", status: "Present"),
  Attendance(studentId: "S2", date: "2025-01-09", status: "Present"),
  Attendance(studentId: "S2", date: "2025-01-10", status: "Present"),

  // RANJET
  Attendance(studentId: "S3", date: "2025-01-01", status: "Absent"),
  Attendance(studentId: "S3", date: "2025-01-02", status: "Absent"),
  Attendance(studentId: "S3", date: "2025-01-03", status: "Present"),
  Attendance(studentId: "S3", date: "2025-01-04", status: "Absent"),
  Attendance(studentId: "S3", date: "2025-01-05", status: "Present"),
  Attendance(studentId: "S3", date: "2025-01-06", status: "Absent"),
  Attendance(studentId: "S3", date: "2025-01-07", status: "Present"),
  Attendance(studentId: "S3", date: "2025-01-08", status: "Absent"),
  Attendance(studentId: "S3", date: "2025-01-09", status: "Present"),
  Attendance(studentId: "S3", date: "2025-01-10", status: "Absent"),

  // ACE
  Attendance(studentId: "S4", date: "2025-01-01", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-02", status: "Absent"),
  Attendance(studentId: "S4", date: "2025-01-03", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-04", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-05", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-06", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-07", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-08", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-09", status: "Present"),
  Attendance(studentId: "S4", date: "2025-01-10", status: "Present"),

  // MARIEL
  Attendance(studentId: "S5", date: "2025-01-01", status: "Absent"),
  Attendance(studentId: "S5", date: "2025-01-02", status: "Absent"),
  Attendance(studentId: "S5", date: "2025-01-03", status: "Absent"),
  Attendance(studentId: "S5", date: "2025-01-04", status: "Present"),
  Attendance(studentId: "S5", date: "2025-01-05", status: "Absent"),
  Attendance(studentId: "S5", date: "2025-01-06", status: "Present"),
  Attendance(studentId: "S5", date: "2025-01-07", status: "Absent"),
  Attendance(studentId: "S5", date: "2025-01-08", status: "Absent"),
  Attendance(studentId: "S5", date: "2025-01-09", status: "Present"),
  Attendance(studentId: "S5", date: "2025-01-10", status: "Absent"),

  // MIKA
  Attendance(studentId: "S6", date: "2025-01-01", status: "Present"),
  Attendance(studentId: "S6", date: "2025-01-02", status: "Absent"),
  Attendance(studentId: "S6", date: "2025-01-03", status: "Present"),
  Attendance(studentId: "S6", date: "2025-01-04", status: "Late"),
  Attendance(studentId: "S6", date: "2025-01-05", status: "Late"),
  Attendance(studentId: "S6", date: "2025-01-06", status: "Present"),
  Attendance(studentId: "S6", date: "2025-01-07", status: "Late"),
  Attendance(studentId: "S6", date: "2025-01-08", status: "Present"),
  Attendance(studentId: "S6", date: "2025-01-09", status: "Present"),
  Attendance(studentId: "S6", date: "2025-01-10", status: "Present"),
];

void addAttendance(String studentId) {
  attendanceRecords.add(
    Attendance(
      studentId: studentId,
      date: DateTime.now().toString().split(" ")[0],
      status: "Present",
    ),
  );
}
