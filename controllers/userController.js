const asyncHandler = require("express-async-handler");
const { User } = require("../models/User");

/**--------------------------------------------------- 
 * @desc   Get All Users Profile
 * @router /api/users/profile
 * @method GET
 * @access public (only admin)
-----------------------------------------------------*/

module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  // verify token
  // console.log(req.headers.authorization.split(" ")[1]);
  const users = await User.find();
  res.status(200).json(users);
});
