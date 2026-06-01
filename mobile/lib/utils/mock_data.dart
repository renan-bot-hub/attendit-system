class Student {
  final String id;
  final String name;
  final String parentId;
  final String parentEmail;
  final String teacherEmail;
  final String gradeLevel;
  final String section;
  final String strand;

  Student({
    required this.id,
    required this.name,
    required this.parentId,
    required this.parentEmail,
    required this.teacherEmail,
    required this.gradeLevel,
    required this.section,
    this.strand = "",
  });
}

class Teacher {
  final String id;
  final String name;
  final String teacherNumber;
  final String email;
  final List<String> handledGradeLevels;
  final List<String> handledSections;

  Teacher({
    required this.id,
    required this.name,
    required this.teacherNumber,
    required this.email,
    required this.handledGradeLevels,
    required this.handledSections,
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

String _normalize(String? value) {
  return (value ?? "").trim().toLowerCase();
}

final teachers = [
  Teacher(
    id: "T1",
    name: "Lucio Tongco",
    teacherNumber: "T1",
    email: "luciostongco9@gmail.com",
    handledGradeLevels: ["Grade 12"],
    handledSections: ["Grade 12-A GAS"],
  ),
];

final List<Student> students = [
  // =========================
  // GRADE 7-A - JHS
  // =========================
  Student(
    id: "G7-001",
    name: "Renan Turno",
    parentId: "P7-001",
    parentEmail: "renan.turno.cgroup@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-002",
    name: "Joshua Santos",
    parentId: "P7-002",
    parentEmail: "parent.g7.002@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-003",
    name: "Andrea Cruz",
    parentId: "P7-003",
    parentEmail: "parent.g7.003@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-004",
    name: "Mark Dela Cruz",
    parentId: "P7-004",
    parentEmail: "parent.g7.004@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-005",
    name: "Samantha Reyes",
    parentId: "P7-005",
    parentEmail: "parent.g7.005@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-006",
    name: "John Paul Garcia",
    parentId: "P7-006",
    parentEmail: "parent.g7.006@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-007",
    name: "Angela Mendoza",
    parentId: "P7-007",
    parentEmail: "parent.g7.007@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-008",
    name: "Miguel Bautista",
    parentId: "P7-008",
    parentEmail: "parent.g7.008@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-009",
    name: "Princess Ramos",
    parentId: "P7-009",
    parentEmail: "parent.g7.009@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-010",
    name: "Christian Lopez",
    parentId: "P7-010",
    parentEmail: "parent.g7.010@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-011",
    name: "Nicole Flores",
    parentId: "P7-011",
    parentEmail: "parent.g7.011@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-012",
    name: "Aaron Villanueva",
    parentId: "P7-012",
    parentEmail: "parent.g7.012@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-013",
    name: "Sophia Aquino",
    parentId: "P7-013",
    parentEmail: "parent.g7.013@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-014",
    name: "Gabriel Torres",
    parentId: "P7-014",
    parentEmail: "parent.g7.014@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-015",
    name: "Bianca Navarro",
    parentId: "P7-015",
    parentEmail: "parent.g7.015@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-016",
    name: "Daniel Castillo",
    parentId: "P7-016",
    parentEmail: "parent.g7.016@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-017",
    name: "Trisha Salazar",
    parentId: "P7-017",
    parentEmail: "parent.g7.017@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-018",
    name: "Kevin Gonzales",
    parentId: "P7-018",
    parentEmail: "parent.g7.018@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-019",
    name: "Alyssa Romero",
    parentId: "P7-019",
    parentEmail: "parent.g7.019@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),
  Student(
    id: "G7-020",
    name: "Jerome Santiago",
    parentId: "P7-020",
    parentEmail: "parent.g7.020@gmail.com",
    teacherEmail: "teacher.grade7@gmail.com",
    gradeLevel: "Grade 7",
    section: "Grade 7-A",
  ),

  // =========================
  // GRADE 8-A - JHS
  // =========================
  Student(
    id: "G8-001",
    name: "Nash Tongco",
    parentId: "P8-001",
    parentEmail: "nashtongco25@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-002",
    name: "Sean Mercado",
    parentId: "P8-002",
    parentEmail: "parent.g8.002@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-003",
    name: "Erika Valdez",
    parentId: "P8-003",
    parentEmail: "parent.g8.003@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-004",
    name: "Kyle Fernandez",
    parentId: "P8-004",
    parentEmail: "parent.g8.004@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-005",
    name: "Jasmine Rivera",
    parentId: "P8-005",
    parentEmail: "parent.g8.005@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-006",
    name: "Patrick Lim",
    parentId: "P8-006",
    parentEmail: "parent.g8.006@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-007",
    name: "Hannah Sy",
    parentId: "P8-007",
    parentEmail: "parent.g8.007@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-008",
    name: "Lance Ong",
    parentId: "P8-008",
    parentEmail: "parent.g8.008@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-009",
    name: "Camille Padilla",
    parentId: "P8-009",
    parentEmail: "parent.g8.009@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-010",
    name: "Ivan Morales",
    parentId: "P8-010",
    parentEmail: "parent.g8.010@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-011",
    name: "Rhea Angeles",
    parentId: "P8-011",
    parentEmail: "parent.g8.011@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-012",
    name: "Nathan Cruz",
    parentId: "P8-012",
    parentEmail: "parent.g8.012@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-013",
    name: "Ella Villamor",
    parentId: "P8-013",
    parentEmail: "parent.g8.013@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-014",
    name: "Renz Alvarez",
    parentId: "P8-014",
    parentEmail: "parent.g8.014@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-015",
    name: "Katrina Santos",
    parentId: "P8-015",
    parentEmail: "parent.g8.015@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-016",
    name: "Harvey Tan",
    parentId: "P8-016",
    parentEmail: "parent.g8.016@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-017",
    name: "Mica Domingo",
    parentId: "P8-017",
    parentEmail: "parent.g8.017@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-018",
    name: "Jomar Reyes",
    parentId: "P8-018",
    parentEmail: "parent.g8.018@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-019",
    name: "Bea Manalo",
    parentId: "P8-019",
    parentEmail: "parent.g8.019@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),
  Student(
    id: "G8-020",
    name: "Carl Pascual",
    parentId: "P8-020",
    parentEmail: "parent.g8.020@gmail.com",
    teacherEmail: "teacher.grade8@gmail.com",
    gradeLevel: "Grade 8",
    section: "Grade 8-A",
  ),

  // =========================
  // GRADE 9-A - JHS
  // =========================
  Student(
    id: "G9-001",
    name: "Mika Manimbo",
    parentId: "P9-001",
    parentEmail: "mikaangela02@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-002",
    name: "Leo Hernandez",
    parentId: "P9-002",
    parentEmail: "parent.g9.002@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-003",
    name: "Sarah Molina",
    parentId: "P9-003",
    parentEmail: "parent.g9.003@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-004",
    name: "Ethan Co",
    parentId: "P9-004",
    parentEmail: "parent.g9.004@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-005",
    name: "Julia Mercado",
    parentId: "P9-005",
    parentEmail: "parent.g9.005@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-006",
    name: "Ralph Gutierrez",
    parentId: "P9-006",
    parentEmail: "parent.g9.006@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-007",
    name: "Christine Laurel",
    parentId: "P9-007",
    parentEmail: "parent.g9.007@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-008",
    name: "Marco Villanueva",
    parentId: "P9-008",
    parentEmail: "parent.g9.008@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-009",
    name: "Dianne Perez",
    parentId: "P9-009",
    parentEmail: "parent.g9.009@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-010",
    name: "Oliver Chua",
    parentId: "P9-010",
    parentEmail: "parent.g9.010@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-011",
    name: "Megan Soriano",
    parentId: "P9-011",
    parentEmail: "parent.g9.011@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-012",
    name: "Vincent Ramos",
    parentId: "P9-012",
    parentEmail: "parent.g9.012@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-013",
    name: "Alexa Bautista",
    parentId: "P9-013",
    parentEmail: "parent.g9.013@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-014",
    name: "Cedric Santiago",
    parentId: "P9-014",
    parentEmail: "parent.g9.014@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-015",
    name: "Faith Gonzales",
    parentId: "P9-015",
    parentEmail: "parent.g9.015@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-016",
    name: "Justin Lim",
    parentId: "P9-016",
    parentEmail: "parent.g9.016@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-017",
    name: "Denise Aquino",
    parentId: "P9-017",
    parentEmail: "parent.g9.017@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-018",
    name: "Francis Navarro",
    parentId: "P9-018",
    parentEmail: "parent.g9.018@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-019",
    name: "Janelle Flores",
    parentId: "P9-019",
    parentEmail: "parent.g9.019@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),
  Student(
    id: "G9-020",
    name: "Bryan Castillo",
    parentId: "P9-020",
    parentEmail: "parent.g9.020@gmail.com",
    teacherEmail: "teacher.grade9@gmail.com",
    gradeLevel: "Grade 9",
    section: "Grade 9-A",
  ),

  // =========================
  // GRADE 10-A - JHS
  // =========================
  Student(
    id: "G10-001",
    name: "Ace Espejo",
    parentId: "P10-001",
    parentEmail: "aetheramma@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-002",
    name: "Adrian Salazar",
    parentId: "P10-002",
    parentEmail: "parent.g10.002@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-003",
    name: "Patricia Gomez",
    parentId: "P10-003",
    parentEmail: "parent.g10.003@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-004",
    name: "Noel Tan",
    parentId: "P10-004",
    parentEmail: "parent.g10.004@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-005",
    name: "Kimberly Reyes",
    parentId: "P10-005",
    parentEmail: "parent.g10.005@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-006",
    name: "Ryan Dizon",
    parentId: "P10-006",
    parentEmail: "parent.g10.006@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-007",
    name: "Clarisse Yu",
    parentId: "P10-007",
    parentEmail: "parent.g10.007@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-008",
    name: "Jericho Santos",
    parentId: "P10-008",
    parentEmail: "parent.g10.008@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-009",
    name: "Lara Mendoza",
    parentId: "P10-009",
    parentEmail: "parent.g10.009@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-010",
    name: "Paolo Garcia",
    parentId: "P10-010",
    parentEmail: "parent.g10.010@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-011",
    name: "Janine Lopez",
    parentId: "P10-011",
    parentEmail: "parent.g10.011@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-012",
    name: "Gian Ramos",
    parentId: "P10-012",
    parentEmail: "parent.g10.012@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-013",
    name: "Monica Cruz",
    parentId: "P10-013",
    parentEmail: "parent.g10.013@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-014",
    name: "Carlo Rivera",
    parentId: "P10-014",
    parentEmail: "parent.g10.014@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-015",
    name: "Angelica Torres",
    parentId: "P10-015",
    parentEmail: "parent.g10.015@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-016",
    name: "Kurt Bautista",
    parentId: "P10-016",
    parentEmail: "parent.g10.016@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-017",
    name: "Rica Gonzales",
    parentId: "P10-017",
    parentEmail: "parent.g10.017@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-018",
    name: "Marlon Aquino",
    parentId: "P10-018",
    parentEmail: "parent.g10.018@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-019",
    name: "Celine Navarro",
    parentId: "P10-019",
    parentEmail: "parent.g10.019@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),
  Student(
    id: "G10-020",
    name: "Julius Flores",
    parentId: "P10-020",
    parentEmail: "parent.g10.020@gmail.com",
    teacherEmail: "teacher.grade10@gmail.com",
    gradeLevel: "Grade 10",
    section: "Grade 10-A",
  ),

  // =========================
  // GRADE 11-A ABM - SHS
  // =========================
  Student(
    id: "G11-001",
    name: "Ranjet Hussein",
    parentId: "P11-001",
    parentEmail: "desurefu@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-002",
    name: "Shaira Mendoza",
    parentId: "P11-002",
    parentEmail: "parent.g11.002@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-003",
    name: "Dominic Reyes",
    parentId: "P11-003",
    parentEmail: "parent.g11.003@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-004",
    name: "Elaine Santos",
    parentId: "P11-004",
    parentEmail: "parent.g11.004@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-005",
    name: "James Castillo",
    parentId: "P11-005",
    parentEmail: "parent.g11.005@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-006",
    name: "Aira Bautista",
    parentId: "P11-006",
    parentEmail: "parent.g11.006@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-007",
    name: "Kenji Tan",
    parentId: "P11-007",
    parentEmail: "parent.g11.007@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-008",
    name: "Lorraine Cruz",
    parentId: "P11-008",
    parentEmail: "parent.g11.008@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-009",
    name: "Cedrick Ramos",
    parentId: "P11-009",
    parentEmail: "parent.g11.009@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-010",
    name: "Mae Villanueva",
    parentId: "P11-010",
    parentEmail: "parent.g11.010@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-011",
    name: "Alfred Garcia",
    parentId: "P11-011",
    parentEmail: "parent.g11.011@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-012",
    name: "Krisha Lopez",
    parentId: "P11-012",
    parentEmail: "parent.g11.012@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-013",
    name: "Ronald Perez",
    parentId: "P11-013",
    parentEmail: "parent.g11.013@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-014",
    name: "Jessa Navarro",
    parentId: "P11-014",
    parentEmail: "parent.g11.014@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-015",
    name: "Luis Aquino",
    parentId: "P11-015",
    parentEmail: "parent.g11.015@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-016",
    name: "Rochelle Flores",
    parentId: "P11-016",
    parentEmail: "parent.g11.016@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-017",
    name: "Arvin Salazar",
    parentId: "P11-017",
    parentEmail: "parent.g11.017@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-018",
    name: "Trixie Morales",
    parentId: "P11-018",
    parentEmail: "parent.g11.018@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-019",
    name: "Brylle Manalo",
    parentId: "P11-019",
    parentEmail: "parent.g11.019@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),
  Student(
    id: "G11-020",
    name: "Daphne Romero",
    parentId: "P11-020",
    parentEmail: "parent.g11.020@gmail.com",
    teacherEmail: "teacher.grade11@gmail.com",
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    strand: "ABM",
  ),

  // =========================
  // GRADE 12-A GAS - SHS
  // Teacher Lucio Tongco handles this section only.
  // =========================
  Student(
    id: "G12-001",
    name: "Mariel Naval",
    parentId: "P12-001",
    parentEmail: "annemrl04@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-002",
    name: "Charles Santos",
    parentId: "P12-002",
    parentEmail: "parent.g12.002@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-003",
    name: "Angelica Reyes",
    parentId: "P12-003",
    parentEmail: "parent.g12.003@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-004",
    name: "Miguel Cruz",
    parentId: "P12-004",
    parentEmail: "parent.g12.004@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-005",
    name: "Bianca Garcia",
    parentId: "P12-005",
    parentEmail: "parent.g12.005@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-006",
    name: "Paolo Mendoza",
    parentId: "P12-006",
    parentEmail: "parent.g12.006@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-007",
    name: "Sofia Ramos",
    parentId: "P12-007",
    parentEmail: "parent.g12.007@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-008",
    name: "Daniel Torres",
    parentId: "P12-008",
    parentEmail: "parent.g12.008@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-009",
    name: "Nicole Bautista",
    parentId: "P12-009",
    parentEmail: "parent.g12.009@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-010",
    name: "Jerome Villanueva",
    parentId: "P12-010",
    parentEmail: "parent.g12.010@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-011",
    name: "Trisha Aquino",
    parentId: "P12-011",
    parentEmail: "parent.g12.011@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-012",
    name: "Kevin Navarro",
    parentId: "P12-012",
    parentEmail: "parent.g12.012@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-013",
    name: "Alyssa Flores",
    parentId: "P12-013",
    parentEmail: "parent.g12.013@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-014",
    name: "Christian Castillo",
    parentId: "P12-014",
    parentEmail: "parent.g12.014@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-015",
    name: "Ella Salazar",
    parentId: "P12-015",
    parentEmail: "parent.g12.015@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-016",
    name: "Gabriel Morales",
    parentId: "P12-016",
    parentEmail: "parent.g12.016@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-017",
    name: "Camille Manalo",
    parentId: "P12-017",
    parentEmail: "parent.g12.017@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-018",
    name: "Lance Romero",
    parentId: "P12-018",
    parentEmail: "parent.g12.018@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-019",
    name: "Princess Santiago",
    parentId: "P12-019",
    parentEmail: "parent.g12.019@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
  Student(
    id: "G12-020",
    name: "Ivan Pascual",
    parentId: "P12-020",
    parentEmail: "parent.g12.020@gmail.com",
    teacherEmail: "luciostongco9@gmail.com",
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    strand: "GAS",
  ),
];

Student? findStudentForParent({
  required String parentEmail,
  String? parentId,
  String? studentId,
  String? parentName,
}) {
  final cleanParentEmail = _normalize(parentEmail);
  final cleanParentId = _normalize(parentId);
  final cleanStudentId = _normalize(studentId);
  final cleanParentName = _normalize(parentName);

  for (final student in students) {
    final emailMatches = cleanParentEmail.isNotEmpty &&
        _normalize(student.parentEmail) == cleanParentEmail;

    final parentIdMatches = cleanParentId.isNotEmpty &&
        _normalize(student.parentId) == cleanParentId;

    final studentIdMatches =
        cleanStudentId.isNotEmpty && _normalize(student.id) == cleanStudentId;

    final parentNameMatches = cleanParentName.isNotEmpty &&
        _normalize(student.name).contains(cleanParentName);

    if (emailMatches || parentIdMatches || studentIdMatches || parentNameMatches) {
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

List<Student> findStudentsBySection(String section) {
  final cleanSection = _normalize(section);

  return students.where((student) {
    return _normalize(student.section) == cleanSection;
  }).toList();
}

List<Student> findStudentsByGradeLevel(String gradeLevel) {
  final cleanGradeLevel = _normalize(gradeLevel);

  return students.where((student) {
    return _normalize(student.gradeLevel) == cleanGradeLevel;
  }).toList();
}

String getStudentName(String studentId) {
  final student = students.firstWhere(
    (student) => _normalize(student.id) == _normalize(studentId),
    orElse: () => Student(
      id: studentId,
      name: "Unknown Student",
      parentId: "",
      parentEmail: "",
      teacherEmail: "",
      gradeLevel: "",
      section: "",
    ),
  );

  return student.name;
}

Student? getStudentById(String studentId) {
  try {
    return students.firstWhere(
      (student) => _normalize(student.id) == _normalize(studentId),
    );
  } catch (_) {
    return null;
  }
}

List<Attendance> attendanceRecords = _generateAttendanceRecords();

List<Attendance> _generateAttendanceRecords() {
  final List<Attendance> records = [];

  final statusesPattern = [
    "Present",
    "Absent",
    "Late",
    "Present",
    "Present",
    "Late",
    "Absent",
    "Present",
    "Present",
    "Present",
  ];

  for (final student in students) {
    for (int day = 1; day <= 10; day++) {
      final statusIndex = (day + student.id.hashCode.abs()) % statusesPattern.length;

      records.add(
        Attendance(
          studentId: student.id,
          date: "2025-01-${day.toString().padLeft(2, '0')}",
          status: statusesPattern[statusIndex],
        ),
      );
    }
  }

  return records;
}

List<Attendance> getAttendanceByStudentId(String studentId) {
  return attendanceRecords.where((record) {
    return _normalize(record.studentId) == _normalize(studentId);
  }).toList();
}

List<Attendance> getAttendanceForTeacher(String teacherEmail) {
final teacherStudents = findStudentsForTeacher(
  teacherEmail: teacherEmail,
);  

final teacherStudentIds = teacherStudents.map((student) => student.id).toSet();

  return attendanceRecords.where((record) {
    return teacherStudentIds.contains(record.studentId);
  }).toList();
}

Map<String, int> getAttendanceSummaryByStudentId(String studentId) {
  final records = getAttendanceByStudentId(studentId);

  return {
    "Present": records.where((record) => record.status == "Present").length,
    "Absent": records.where((record) => record.status == "Absent").length,
    "Late": records.where((record) => record.status == "Late").length,
  };
}

Map<String, int> getAttendanceSummaryForTeacher(String teacherEmail) {
  final records = getAttendanceForTeacher(teacherEmail);

  return {
    "Present": records.where((record) => record.status == "Present").length,
    "Absent": records.where((record) => record.status == "Absent").length,
    "Late": records.where((record) => record.status == "Late").length,
  };
}

void addAttendance(String studentId, {String status = "Present"}) {
  attendanceRecords.add(
    Attendance(
      studentId: studentId,
      date: DateTime.now().toString().split(" ")[0],
      status: status,
    ),
  );
}
