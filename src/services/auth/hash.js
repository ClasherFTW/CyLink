const bcrypt = require("bcryptjs");

const getSaltRounds = () => {
  const configuredRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  return Number.isFinite(configuredRounds) ? configuredRounds : 12;
};

const hashPassword = async (plainPassword) => {
  const saltRounds = getSaltRounds();
  return bcrypt.hash(plainPassword, saltRounds);
};

const comparePassword = async (plainPassword, hash) =>
  bcrypt.compare(plainPassword, hash);

module.exports = {
  hashPassword,
  comparePassword,
};
