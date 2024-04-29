import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './mongodb/connect.js';
import priceRoutes from './routes/priceRoutes.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/v1/price-check', priceRoutes);

app.get('/', async (req, res) => {
    res.send('Hello from my API server');
})

const startServer = async () => {

    try {
        connectDB(process.env.MONGODB_URL);
        app.listen(8080, () => console.log("Server started"));
    } catch (error) {
        console.log(error);
    }
}

startServer();