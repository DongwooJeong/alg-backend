require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const answerRoutes = require('./routes/answerRoutes');
const financialsRoutes = require('./routes/financialsRoutes');
const app = express();


app.use(cors({
    origin: ['https://alg-experiment.vercel.app', 'https://algorithm-experiment-c09a8ea350bf.herokuapp.com']
}));

// 요청 본문 파싱을 위한 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 등록
app.use('/api/users', userRoutes); // 사용자 관련 라우트
app.use('/api/answerRoutes', answerRoutes);
app.use('/api/financialsRoutes', financialsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});