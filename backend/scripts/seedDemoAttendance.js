require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");

const PASSWORD = "AttendIT123";
const HASH_ROUNDS = 10;

const sections = [
  {
    gradeLevel: "Grade 7",
    section: "Grade 7 - A",
    realStudent: "Renan Turno",
    realEmail: "renan.turno.cgroup@gmail.com",
    prefix: "G7",
    teacherName: "Grade 7 Teacher",
    teacherEmail: "teacher.grade7@gmail.com",
  },
  {
    gradeLevel: "Grade 8",
    section: "Grade 8 - A",
    realStudent: "Nash Tongco",
    realEmail: "nashtongco25@gmail.com",
    prefix: "G8",
    teacherName: "Grade 8 Teacher",
    teacherEmail: "teacher.grade8@gmail.com",
  },
  {
    gradeLevel: "Grade 9",
    section: "Grade 9 - A",
    realStudent: "Mika Manimbo",
    realEmail: "mikaangela02@gmail.com",
    prefix: "G9",
    teacherName: "Grade 9 Teacher",
    teacherEmail: "teacher.grade9@gmail.com",
  },
  {
    gradeLevel: "Grade 10",
    section: "Grade 10 - A",
    realStudent: "Ace Espejo",
    realEmail: "aetheramma@gmail.com",
    prefix: "G10",
    teacherName: "Grade 10 Teacher",
    teacherEmail: "teacher.grade10@gmail.com",
  },
  {
    gradeLevel: "Grade 11",
    section: "Grade 11-A ABM",
    realStudent: "Ranjet Hussein",
    realEmail: "desurefu@gmail.com",
    prefix: "G11",
    teacherName: "Grade 11 Teacher",
    teacherEmail: "teacher.grade11@gmail.com",
  },
  {
    gradeLevel: "Grade 12",
    section: "Grade 12-A GAS",
    realStudent: "Mariel Naval",
    realEmail: "annemrl04@gmail.com",
    prefix: "G12",
    teacherName: "Lucio Tongco",
    teacherEmail: "luciostongco9@gmail.com",
  },
];

const fakeNames = [
  "Joshua Santos",
  "Andrea Cruz",
  "Mark Dela Cruz",
  "Samantha Reyes",
  "John Paul Garcia",
  "Angela Mendoza",
  "Miguel Bautista",
  "Princess Ramos",
  "Christian Lopez",
  "Nicole Flores",
  "Aaron Villanueva",
  "Sophia Aquino",
  "Gabriel Torres",
  "Bianca Navarro",
  "Daniel Castillo",
  "Trisha Salazar",
  "Kevin Gonzales",
  "Alyssa Romero",
  "Jerome Santiago",
];

const patterns = {
  low: ["Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Late", "Present"],
  moderate: ["Present", "Present", "Present", "Late", "Present", "Absent", "Present", "Late", "Present", "Absent"],
  high: ["Absent", "Present", "Late", "Absent", "Absent", "Late", "Present", "Absent", "Late", "Absent"],
};

function pad(num) {
  return String(num).padStart(3, "0");
}

function studentId(prefix, index) {
  return `${prefix}-${pad(index)}`;
}

function parentEmail(prefix, index) {
  return `parent.${prefix.toLowerCase()}.${pad(index)}@demo.com`;
}

async function upsertUser(filter, data) {
  return User.findOneAndUpdate(
    filter,
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const password = await bcrypt.hash(PASSWORD, HASH_ROUNDS);

  for (const group of sections) {
    console.log(`\nSeeding ${group.gradeLevel} - ${group.section}`);

    const teacher = await upsertUser(
      { email: group.teacherEmail },
      {
        name: group.teacherName,
        email: group.teacherEmail,
        password,
        role: "teacher",
        section: group.section,
        gradeLevel: group.gradeLevel,
        gradeSection: group.section,
        department: group.gradeLevel.includes("Grade 11") || group.gradeLevel.includes("Grade 12") ? "SHS" : "JHS",
        teacherNumber: `${group.prefix}-T001`,
        isActive: true,
      }
    );

    const sessions = [];

    for (let day = 1; day <= 10; day++) {
      const date = new Date(`2026-06-${String(day).padStart(2, "0")}T08:00:00.000Z`);

      const session = await Session.findOneAndUpdate(
        {
          className: `${group.section} Homeroom ${day}`,
          section: group.section,
          date,
        },
        {
          $set: {
            className: `${group.section} Homeroom ${day}`,
            section: group.section,
            subject: "Homeroom",
            date,
            active: day === 10,
            teacherId: teacher._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      sessions.push(session);
    }

    for (let i = 1; i <= 20; i++) {
      const isReal = i === 1;
      const sid = studentId(group.prefix, i);
      const sName = isReal ? group.realStudent : `${fakeNames[i - 2]} ${group.prefix}`;
      const pEmail = isReal ? group.realEmail : parentEmail(group.prefix, i);

      const parent = await upsertUser(
        { email: pEmail },
        {
          name: `${sName} Parent`,
          email: pEmail,
          password,
          role: "parent",
          studentId: sid,
          studentNumber: sid,
          section: group.section,
          gradeLevel: group.gradeLevel,
          gradeSection: group.section,
          parentName: `${sName} Parent`,
          parentEmail: pEmail,
          parentPhone: `0917${String(i).padStart(7, "0")}`,
          contactNumber: `0917${String(i).padStart(7, "0")}`,
          department: group.gradeLevel.includes("Grade 11") || group.gradeLevel.includes("Grade 12") ? "SHS" : "JHS",
          isActive: true,
        }
      );

      const student = await upsertUser(
        { role: "student", studentId: sid },
        {
          name: sName,
          email: `student.${sid.toLowerCase()}@demo.com`,
          password,
          role: "student",
          studentId: sid,
          studentNumber: sid,
          qrCode: sid,
          section: group.section,
          gradeLevel: group.gradeLevel,
          gradeSection: group.section,
          parentName: parent.name,
          parentEmail: pEmail,
          parentPhone: parent.parentPhone,
          department: group.gradeLevel.includes("Grade 11") || group.gradeLevel.includes("Grade 12") ? "SHS" : "JHS",
          isActive: true,
        }
      );

      let patternName = "low";
      if (i % 3 === 2) patternName = "moderate";
      if (i % 3 === 0) patternName = "high";

      if (isReal) {
        if (group.prefix === "G8") patternName = "high";
        else if (group.prefix === "G9" || group.prefix === "G11") patternName = "moderate";
        else patternName = "low";
      }

      const pattern = patterns[patternName];

      for (let day = 0; day < sessions.length; day++) {
        await Attendance.findOneAndUpdate(
          {
            studentId: student._id,
            sessionId: sessions[day]._id,
          },
          {
            $set: {
              studentId: student._id,
              sessionId: sessions[day]._id,
              status: pattern[day],
              markedBy: "Manual",
              notes: "",
              timeIn: pattern[day] === "Absent" ? "" : "08:00 AM",
              timestamp: new Date(`2026-06-${String(day + 1).padStart(2, "0")}T08:00:00.000Z`),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    console.log(`Done: ${group.section}`);
  }

  console.log("\nDemo data seeded successfully.");
  console.log(`Default password for demo accounts: ${PASSWORD}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
});