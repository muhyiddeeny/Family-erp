const SystemSetting = require("../models/SystemSetting");

const DEFAULT_PASSWORD_KEY = "defaultMemberPassword";

// Used only until an administrator sets their own default password
const FALLBACK_DEFAULT_PASSWORD = "WelcomeFamily123!";

// The password given to every newly approved member
const getDefaultMemberPassword = async () => {
  const setting = await SystemSetting.findOne({ key: DEFAULT_PASSWORD_KEY }).lean();
  return setting?.value || FALLBACK_DEFAULT_PASSWORD;
};

module.exports = {
  DEFAULT_PASSWORD_KEY,
  FALLBACK_DEFAULT_PASSWORD,
  getDefaultMemberPassword
};
