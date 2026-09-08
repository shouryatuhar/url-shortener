import express from 'express';
import dotenv from 'dotenv';


dotenv.config();

const app = express();


app.use(express.json());
app.use(express.static('public'));

import urlRoutes from './routes/urls.js';
app.use('/', urlRoutes);

const PORT = process.env.PORT || 3000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
