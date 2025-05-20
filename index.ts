import { app } from './src/index.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
