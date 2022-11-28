const express = require("express");
const { asyncWrapper } = require("../../helpers/apiHelpers");
const {
  registerController,
  loginController,
  logoutController,
  currentUserController,
  changeAvatarController,
  verificationController,
  resendVerificationCodeController,
} = require("../../controllers/authController");
const {
  addUserValidation,
  resendVerifycationCodeValidation,
} = require("../../middlewares/validationMiddleware");
const { auth } = require("../../middlewares/auth");
const { upload } = require("../../middlewares/uploadFile");

const router = express.Router();

router.post("/register", addUserValidation, asyncWrapper(registerController));
router.post("/login", addUserValidation, asyncWrapper(loginController));
router.post("/logout", asyncWrapper(auth), asyncWrapper(logoutController));
router.get("/current", asyncWrapper(auth), asyncWrapper(currentUserController));

router.get("/verify/:verificationToken", asyncWrapper(verificationController));
router.post(
  "/verify",
  resendVerifycationCodeValidation,
  asyncWrapper(resendVerificationCodeController)
);

router.patch(
  "/avatars",
  asyncWrapper(auth),
  asyncWrapper(upload.single("avatar")),
  asyncWrapper(changeAvatarController)
);

module.exports = router;
