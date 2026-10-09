// One-time bootstrap utility. Run only on a trusted machine with the correct Atlas URI.
// 1) Register the intended account through /api/auth/register.
// 2) Set BOOTSTRAP_ADMIN_EMAIL in your local .env to that account's email.
// 3) Run: node scripts/setInitialSuperAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    if (!process.env.MONGODB_URI || !process.env.BOOTSTRAP_ADMIN_EMAIL) {
      throw new Error('MONGODB_URI and BOOTSTRAP_ADMIN_EMAIL are required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) throw new Error('No account found for BOOTSTRAP_ADMIN_EMAIL. Register it first.');
    user.role = 'super_admin';
    user.status = 'active';
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    console.log(`Promoted ${email} to super_admin. Log in again to obtain a token with the updated role.`);
  } catch (error) {
    console.error(`Bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
