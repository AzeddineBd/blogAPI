const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/User");

/**--------------------------------------------------- 
 * @desc   Register New User
 * @router /api/auth/register
 * @method POST
 * @access public
-----------------------------------------------------*/
module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
  //* 1.validation
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //* 2.is user already exist
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "user already exist" });
  }

  //* 3.hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hashSync(req.body.password, salt);

  //* 4.new user and save it to DB
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  await user.save();

  //TODO - Sending email (verify account)

  //* 5.send res to client
  res
    .status(201)
    .json({ message: "you registered successfully, please log in" });
});

/**--------------------------------------------------- 
 * @desc   Login User
 * @router /api/auth/login
 * @method POST
 * @access public
-----------------------------------------------------*/

module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
  //* 1.validation
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  //* 2.is user exist
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  //* 3.check the password
  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  //TODO - Sending email (verify account if not verified)

  //* 4.generate token (jwt)
  const token = user.generateAuthToken();

  //* 5.res to client
  res.status(200).json({
    _id: user._id,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
  });
});
