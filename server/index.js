'use strict';

const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`BrainGenius listening on http://localhost:${PORT}`);
});
