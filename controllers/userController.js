const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/User");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");

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

/**-----------------------------------------------
 * @desc    Profile Photo Upload
 * @route   /api/users/profile/profile-photo-upload
 * @method  POST
 * @access  private (only logged in user)
 ------------------------------------------------*/
module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  // 1. Validation
  if (!req.file) {
    return res.status(400).json({ message: "no file provided" });
  }

  // 2. Get the path to the image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  // 3. Upload to cloudinary
  const result = await cloudinaryUploadImage(imagePath);

  // 4. Get the user from DB
  const user = await User.findById(req.user.id);

  // 5. Delete the old profile photo if exist
  if (user.profilePhoto?.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }

  // 6. Change the profilePhoto field in the DB
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();

  // 7. Send response to client
  res.status(200).json({
    message: "your profile photo uploaded successfully",
    profilePhoto: { url: result.secure_url, publicId: result.public_id },
  });

  // 8. Remvoe image from the server
  fs.unlinkSync(imagePath);
});

/**--------------------------------------------------- 
 * @desc   Delete User Profile (Account)
 * @router /api/users/profile/:id
 * @method DELETE
 * @access private (only admin or user himself)
-----------------------------------------------------*/

module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  // 1.Get the user from Db
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  // Todo : 2.Get all posts from Db
  // Todo : 3.Get the public ids from the posts
  // Todo : 4.Delete all posts image from cloudinary that belong ti this user

  // 5.Delete the profile picture from cloudinary
  await cloudinaryRemoveImage(user.profilePhoto.publicId);

  // Todo : 6.Delete user posts & comment

  // 7.Delete the user himself
  await User.findByIdAndDelete(req.params.id);
  // 8.Send a response to the client
  res.status(200).json({ message: "your profile has been deleted" });
});
