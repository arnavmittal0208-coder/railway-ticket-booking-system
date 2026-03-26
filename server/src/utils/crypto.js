const bcrypt = require("bcryptjs");

const hashPassword = async (plain) => bcrypt.hash(plain, 10);
const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = {
  hashPassword,
  comparePassword,
};
