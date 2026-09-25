const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // =========================================================
    // PERSONAL INFORMATION
    // =========================================================

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    // =========================================================
    // USER ROLE
    // =========================================================

    role: {
      type: String,
      enum: ["customer", "agent", "property_manager", "admin", "super_admin"],
      default: "customer",
      index: true,
    },

    // =========================================================
    // ACCOUNT STATUS
    // =========================================================

    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // =========================================================
    // PROFILE
    // =========================================================

    avatar: {
      url: String,
      publicId: String,
    },

    address: {
      addressLine: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: "Nigeria",
      },
    },

    // =========================================================
    // SECURITY
    // =========================================================

    passwordChangedAt: Date,

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

// =============================================================
// PASSWORD HASHING
// =============================================================

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// =============================================================
// PASSWORD COMPARISON
// =============================================================

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
