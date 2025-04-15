import app from "./app.js";
import connectDB from "./config/database.js";
import { logger } from "./config/logger.js";
import { scheduledTasksService } from "./services/scheduledTasks.js";

const PORT = process.env.PORT || 3000;

connectDB();

scheduledTasksService.init();

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
