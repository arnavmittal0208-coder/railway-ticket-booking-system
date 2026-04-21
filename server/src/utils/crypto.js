const bcrypt = require("bcryptjs");

const hashPassword = async (plain) => bcrypt.hash(plain, 10);
const comparePassword = async (plain, hash) => {
  if (typeof plain !== "string" || typeof hash !== "string" || !plain || !hash) {
    return false;
  }

  return bcrypt.compare(plain, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
