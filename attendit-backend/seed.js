const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

// Wipes the users collection and inserts three test accounts (admin/teacher/student)
const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        isActive: true,
      },
      {
        name: 'John Teacher',
        email: 'teacher@test.com',
        password: hashedPassword,
        role: 'teacher',
        department: 'Mathematics',
        isActive: true,
      },
      {
        name: 'Jane Student',
        email: 'student@test.com',
        password: hashedPassword,
        role: 'student',
        studentId: '2024-0001',
        section: 'Grade 10 - Section A',
        gradeLevel: 'Grade 10',
        isActive: true,
      },
    ];

    const savedUsers = await User.insertMany(users);
    console.log('✅ Created test users:');
    savedUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log('\n📝 Test Credentials:');
    console.log('  Admin:   admin@test.com / password123');
    console.log('  Teacher: teacher@test.com / password123');
    console.log('  Student: student@test.com / password123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedDB();
