import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';

const app = express();

await connectDB();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('Server is running'));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/post', postRouter);
app.use('/api/story', storyRouter);
app.use('/api/message', messageRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));