const {
  register,
  login,
  logout,
  verification,
  changeAvatar,
  resendVerificationCode,
} = require("../services/authService");

const registerController = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await register(email, password);

  return res.status(201).json(user);
};

const loginController = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await login(email, password);

  res.json({ data: { user } });
};

const logoutController = async (req, res, next) => {
  const { user } = req;

  await logout(user._id);

  res.status(204).json();
};

const currentUserController = async (req, res, next) => {
  const { user } = req;
  return res.status(200).json(user);
};

const changeAvatarController = async (req, res, next) => {
  const { user, file } = req;

  const path = await changeAvatar(user, file);

  return res.status(200).json({ data: { avatar: path } });
};

const verificationController = async (req, res, next) => {
  const { verificationToken } = req.params;

  await verification(verificationToken);

  return res.status(200).json({ message: "Verification successful" });
};

const resendVerificationCodeController = async (req, res, next) => {
  const { email } = req.body;

  await resendVerificationCode(email);

  return res.status(200).json({ message: "Verification email sent" });
};

module.exports = {
  registerController,
  loginController,
  logoutController,
  currentUserController,
  changeAvatarController,
  verificationController,
  resendVerificationCodeController,
};
