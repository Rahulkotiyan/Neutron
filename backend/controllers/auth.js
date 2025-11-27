//It is authentication controller, handle logic for accounts

const bcrypt = require("bcryptjs");//Library used for security(hashing) of password 
const jwt = require("jsonwebtoken");//Library used for sessions(user provided with token instead of storing session data on server)
const User = require("../models/User");

/* REGISTER USER */
const register = async (req, res) => {
  try {
    const { username, email, password, collegeId, department, year } = req.body;

    // 1. Basic Validation: Check for duplicates
    // Note: In a real app, you'd check if email ends with "@college.edu" here
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists." });

    // 2. Encrypt Password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create New User
    const newUser = new User({
      username,
      email,
      password: passwordHash,
      collegeId,
      department,
      year,
      reputationPoints: 0,
      badges: ["Fresher"], // Default badge
      profilePicture: "",
    });

    const savedUser = await newUser.save();

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* LOGIN USER */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find User
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json({ msg: "User does not exist. " });

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

    // 3. Generate Token (JWT)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Remove password before sending
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
