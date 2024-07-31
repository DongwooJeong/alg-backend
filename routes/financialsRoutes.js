const express = require('express');
const router = express.Router();
const db = require('./db'); // db.js 파일에서 프로미스 기반의 db 객체를 가져옴


router.get('/financials/:round', async (req, res) => {
  const round = parseInt(req.params.round, 10);
  const offset = (round - 1) * 5;
  
  const query = 'SELECT * FROM stock_table WHERE base_price_date = "2024-01-02" LIMIT 5 OFFSET ?';
  try {
    const [results] = await db.query(query, [offset]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 동적으로 라운드에 따른 ai 추천 주식 정보 조회
router.get('/aiRecommendations/:round', async (req, res) => {
  const round = parseInt(req.params.round, 10);
  const offset = round - 1;
  
  const query = 'SELECT company_id FROM stock_table WHERE Ticker = (SELECT symbol FROM ai_rec LIMIT 1 OFFSET ?)';
  try {
    const [results] = await db.query(query, [offset]);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'No data found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-selected-stock/:userId/:round', async (req, res) => {
  const { userId, round } = req.params;
  try {
    const columnName = `selected_stock_${round}`;
    const query = `SELECT ${columnName} FROM round_answers WHERE email = ?`;

    const [rows] = await db.query(query, [userId]);
    if (rows.length > 0) {
      const stock = rows[0][columnName];
      res.json({ stock: stock });
    } else {
      res.status(404).json({ message: 'User not found or stock not selected' });
    }
  } catch (error) {
    console.error('Error fetching user selected stock:', error);
    res.status(500).json({ error: 'Failed to fetch user selected stock' });
  }
});

module.exports = router;
