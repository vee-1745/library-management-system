require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: node scripts/createAdmin.js "Name" email password');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.error("A user with that email already exists");
      process.exit(1);
    }

    await User.create({ name, email, password, role: "admin" });
    console.log(`Admin created: ${email}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();