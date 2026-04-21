const requiredVars = ["MONGODB_URI", "JWT_SECRET"];

const getMissingVars = () => requiredVars.filter((name) => !String(process.env[name] || "").trim());

const validateEnv = () => {
  const missing = getMissingVars();
  if (missing.length > 0) {
    const joined = missing.join(", ");
    throw new Error(`Missing required environment variables: ${joined}`);
  }
};

module.exports = {
  validateEnv,
};
