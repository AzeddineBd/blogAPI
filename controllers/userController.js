const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/User");
const bcrypt = require("bcryptjs");

/**--------------------------------------------------- 
 * @desc   Get All Users Profile
 * @router /api/users/profile
 * @method GET
 * @access private (only admin)
-----------------------------------------------------*/

module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  // verify token
  // console.log(req.headers.authorization.split(" ")[1]);
  const users = await User.find().select("-password");
  res.status(200).json(users);
});

/**--------------------------------------------------- 
 * @desc   Get User Profile 
 * @router /api/users/profile/:id
 * @method GET
 * @access public
-----------------------------------------------------*/

module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  res.status(200).json(user);
});

/**--------------------------------------------------- 
 * @desc   Get User Profile 
 * @router /api/users/profile/:id
 * @method GET
 * @access public (only user himself)
-----------------------------------------------------*/

module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  //* 1.validation
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //* 2.Password encryption
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  //* 3.Update User
  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(updateUser);
});

/**--------------------------------------------------- 
 * @desc   Get Users Count
 * @router /api/users/count
 * @method GET
 * @access private (only admin)
-----------------------------------------------------*/

module.exports.getUsersCountCtrl = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.status(200).json(count);
});

/**--------------------------------------------------- 
 * @desc   Get Users Count
 * @router /api/users/profile/profile-photo-upload
 * @method POST
 * @access private (only logged in user)
-----------------------------------------------------*/

module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no fille provided" });
  }

  res.status(200).json({ message: "your profile photo uploaded successfully" });
});
