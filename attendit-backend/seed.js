// Wipes the users collection and inserts a demo set (one of each web
// role plus two student records). Destructive — never run in production.
// Run with: npm run seed

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Cleared existing users');

    const hashed = await bcrypt.hash('password123', 10);
    const stub   = await bcrypt.hash(User.generateQrToken(), 10);

    const users = [
      {
        name: 'Admin User', email: 'admin@test.com', password: hashed,
        role: 'admin', department: 'Administration', isActive: true,
      },
      {
        name: 'John Teacher', email: 'teacher@test.com', password: hashed,
        role: 'teacher', department: 'Mathematics', isActive: true,
      },
      {
        name: 'Maria Prefect', email: 'pod@test.com', password: hashed,
        role: 'staff', department: 'Office of the Prefect of Discipline', isActive: true,
      },
      {
        name: 'Jane Student', email: 'jane.student@test.com', password: stub,
        role: 'student', studentId: '2024-0001',
        section: 'Grade 10 - A', gradeLevel: 'Grade 10',
        parentName: 'Maria Santos', parentEmail: 'parent.santos@example.com',
        parentPhone: '+63 917 000 0001',
        qrCode: User.generateQrToken(),
        isActive: true,
      },
      {
        name: 'Pedro Ramos', email: 'pedro.student@test.com', password: stub,
        role: 'student', studentId: '2024-0002',
        section: 'Grade 10 - A', gradeLevel: 'Grade 10',
        parentName: 'Luis Ramos', parentEmail: 'parent.ramos@example.com',
        parentPhone: '+63 917 000 0002',
        qrCode: User.generateQrToken(),
        isActive: true,
      },
    ];

    const saved = await User.insertMany(users);
    console.log('Seeded users:');
    saved.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
    console.log('\nTest credentials (web):');
    console.log('  Admin:   admin@test.com   / password123');
    console.log('  Teacher: teacher@test.com / password123');
    console.log('  Staff:   pod@test.com     / password123');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seedDB();
