const User = require("../models/user");
const generateToken = require("../config/jwt");

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "firstName lastName email phone role status createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Authenticated user no longer exists.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the authenticated user.",
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required login fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user and include password for comparison
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    // Check credentials
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Send successful login response
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again later.",
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
    } = req.body;

    // Check required registration fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "All registration fields are required: firstName, lastName, email, phone, and password.",
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email format
    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create new user
    // Public registration always creates a tenant account
    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password,
      role: "tenant",
    });

    // Safe user information
    // Password is intentionally NOT returned
    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };

    // Registration response
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: safeUser,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
      error: error.message,
    });
  }
};