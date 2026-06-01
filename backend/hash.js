const bcrypt = require("bcryptjs");

async function run() {
  for (let i = 1; i <= 6; i++) {
    const hash = await bcrypt.hash("AttendIT123!", 10);
    console.log(`Hash ${i}:`, hash);
  }
}

run();