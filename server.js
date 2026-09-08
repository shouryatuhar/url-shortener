import express from 'express';
import dotenv from 'dotenv';


dotenv.config();

const app = express();


app.use(express.json());
import urlRoutes from './routes/urls.js';
app.use('/', urlRoutes);
app.get('/', (req, res) => {
  res.send('url shortener api is running :)');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
