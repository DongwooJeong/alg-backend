const express = require('express');
const router = express.Router();
const db = require('./db'); // db.js 파일을 불러옴
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// // nodemailer 설정
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'dongwooexperiment@gmail.com',
//         pass: 'dongwooExp'
//     }
// });

router.post('/register', async (req, res) => {
    const { email, password, experimentType } = req.body;  
    
    try {
        // 이메일 중복 검사 쿼리
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length > 0) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        // 이메일이 중복되지 않은 경우, 사용자 등록 진행
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (email, password, experiment_type) VALUES (?, ?, ?)', [email, hashedPassword, experimentType]);

        // 사용자 등록 성공 후 user_profits 테이블에 해당 사용자에 대한 레코드 추가
        await db.query('INSERT INTO user_profits (email, beginning) VALUES (?, 1000.00)', [email]);

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
          return res.status(401).json({ message: 'Login failed' });
      }
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
          // 로그인 성공 처리 (예: JWT 생성 등)
          // 사용자의 고유 ID를 응답에 포함
          res.json({ message: 'Login successful', userId: user.email }); // user.id는 사용자의 고유 ID
      } else {
          res.status(401).json({ message: 'Login failed' });
      }
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
  }
});


router.post('/survey', async (req, res) => {
    const { userEmail, answers } = req.body;
  
    try {
      const query = `
        INSERT INTO survey_responses (
          email, gender, age_range, education_level, occupation,
          ai_experience, ai_helpfulness, ai_trustworthiness,
          investment_experience, ai_investment_awareness, ai_investment_trust
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          gender = VALUES(gender), 
          age_range = VALUES(age_range), 
          education_level = VALUES(education_level), 
          occupation = VALUES(occupation),
          ai_experience = VALUES(ai_experience), 
          ai_helpfulness = VALUES(ai_helpfulness), 
          ai_trustworthiness = VALUES(ai_trustworthiness),
          investment_experience = VALUES(investment_experience),
          ai_investment_awareness = VALUES(ai_investment_awareness), 
          ai_investment_trust = VALUES(ai_investment_trust);
      `;
  
      await db.query(query, [
        userEmail, answers[0], answers[1], answers[2], answers[3],
        answers[4], answers[5], answers[6], answers[7], answers[8], answers[9]
      ]);
  
      res.status(200).json({ message: 'Survey answers saved successfully' });
    } catch (error) {
      console.error('Error saving survey answers:', error);
      res.status(500).json({ message: 'Failed to save survey answers' });
    }
  });

router.post('/survey2', async (req, res) => {
    // 클라이언트로부터 받은 사용자 이메일과 답변 배열
    const { userEmail, answers } = req.body;
  
    try {
      const query = `
      INSERT INTO survey2_responses (
          email, q1, q2, q3, q4,
          q5, q6, q7
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
          q1 = VALUES(q1), 
          q2 = VALUES(q2), 
          q3 = VALUES(q3), 
          q4 = VALUES(q4),
          q5 = VALUES(q5), 
          q6 = VALUES(q6), 
          q7 = VALUES(q7);
  `;
  
        // 사용자 이메일과 답변 배열을 쿼리 파라미터로 전달
        await db.query(query, [
            userEmail, answers[0], answers[1], answers[2], answers[3],
            answers[4], answers[5], answers[6]
        ]);
  
        res.status(200).json({ message: 'Survey answers saved successfully' });
    } catch (error) {
        console.error('Error saving survey answers:', error);
        res.status(500).json({ message: 'Failed to save survey answers' });
    }
  });

router.post('/send-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT password FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        const mailOptions = {
            from: 'yourEmail@gmail.com',
            to: email,
            subject: 'Your Password',
            text: `Your password is: ${user.password}` // 실제 사용시 반드시 비밀번호가 아닌 재설정 링크 전송 권장
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Failed to send email' });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ message: 'Password has been sent to your email' });
            }
        });
    } catch (error) {
        console.error('Error sending password:', error);
        res.status(500).json({ message: 'Failed to send password' });
    }
});


module.exports = router;
