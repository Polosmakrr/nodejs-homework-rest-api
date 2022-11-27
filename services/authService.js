const { User } = require("../db/userModel");
const { Conflict, Unauthorized, NotFound, BadRequest } = require("http-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const jimp = require("jimp");
const gravatar = require("gravatar");
const sgMail = require("@sendgrid/mail");
const { nanoid } = require("nanoid");

const { JWT_SECRET, SEND_GRID_KEY } = process.env;

sgMail.setApiKey(SEND_GRID_KEY);

const register = async (email, password) => {
  const verificationToken = nanoid();
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const avatar = gravatar.url(email, {
    s: "200",
    r: "pg",
    d: "404",
  });

  const msgVerification = {
    to: email,
    from: "polosmakrr@gmail.com",
    subject: "Please Verefi Your Account",
    text: `Let's verify your email. Click on the link to confirm email http://localhost:3000/api/users/verify/${verificationToken}`,
    html: `<h2> Let's verify your email. </h2> <p>Click on the link to confirm email http://localhost:3000/api/users/verify/${verificationToken}</p>`,
  };

  const user = new User({
    email,
    password: hashedPassword,
    avatarURL: avatar,
    verificationToken,
  });
  try {
    await user.save();
  } catch (eror) {
    if (eror.message.includes("duplicate key error collection")) {
      throw new Conflict("Email in use");
    }
    throw eror;
  }
  sgMail.send(msgVerification);

  return user;
};

const login = async (email, password) => {
  const user = await User.findOne({ email, verify: true });

  // if (!user.verify) {
  //   throw new Unauthorized("Please confirm Email");
  // }
  if (!user) {
    throw new Unauthorized("Email or password is wrong");
  }
  const comparedPassword = await bcrypt.compare(password, user.password);
  if (!comparedPassword) {
    throw new Unauthorized("Email or password is wrong");
  }
  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  const userInfo = await User.findByIdAndUpdate(
    user._id,
    { token },
    { new: true }
  );

  return userInfo;
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { token: null }, { new: true });
};

const changeAvatar = async (user, file) => {
  const newPath = path.join(__dirname, "../public/avatars", file.filename);

  const image = await jimp.read(file.path);
  await image.resize(250, 250);
  await image.writeAsync(newPath);

  await User.findByIdAndUpdate(user._id, { avatarURL: newPath });

  return newPath;
};

const verification = async (verificationToken) => {
  const user = await User.findOneAndUpdate(
    { verificationToken },
    { verificationToken: null, verify: true }
  );

  if (!user) {
    throw new NotFound("User not found");
  }

  const msgRegistration = {
    to: user.email,
    from: "polosmakrr@gmail.com",
    subject: "Registration successfull!",
    text: "Thanks for the choose our service. Have a good one!",
    html: "<strong>Thanks for the chose our service. And have a good one!</strong>",
  };

  sgMail.send(msgRegistration);
};

const resendVerificationCode = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new NotFound("User not found");
  }

  if (user.verify) {
    throw new BadRequest("Verification has already been passed");
  }

  const msgVerification = {
    to: email,
    from: "polosmakrr@gmail.com",
    subject: "Please Verefi Your Account",
    text: `Let's verify your email. Click on the link to confirm email http://localhost:3000/api/users/verify/${user.verificationToken}`,
    html: `<h2> Let's verify your email. </h2> <p>Click on the link to confirm email http://localhost:3000/api/users/verify/${user.verificationToken}</p>`,
  };

  sgMail.send(msgVerification);
};

module.exports = {
  register,
  login,
  logout,
  changeAvatar,
  verification,
  resendVerificationCode,
};
