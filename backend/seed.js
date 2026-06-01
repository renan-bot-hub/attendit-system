// Destructive demo seed. Never enable this in production.
// Run with: $env:ALLOW_DESTRUCTIVE_SEED='true'; $env:SEED_PASSWORD='...'; npm run seed

const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

async function seedDB() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    console.error('Refusing to seed. Set ALLOW_DESTRUCTIVE_SEED=true outside production.');
    process.exit(1);
  }

  try {
    await connectDB();

    await User.deleteMany({});
    console.log('Cleared existing users');

    const seedPassword = process.env.SEED_PASSWORD || User.generateQrToken();
    const hashed = await bcrypt.hash(seedPassword, 10);
    const stub = await bcrypt.hash(User.generateQrToken(), 10);

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
    if (process.env.SEED_PASSWORD) {
      console.log('Seed users use the password supplied in SEED_PASSWORD.');
    } else {
      console.log('Generated a random seed password. Set SEED_PASSWORD when you need known demo credentials.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedDB();
