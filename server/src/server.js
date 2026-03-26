require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startQueueWorker } = require("./services/queueService");
const { ensureDefaultAdmin } = require("./controllers/adminController");

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();
  await ensureDefaultAdmin();
  startQueueWorker();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
