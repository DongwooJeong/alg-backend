const express = require('express');
const router = express.Router();
const db = require('./db');

router.post('/round-actions', async (req, res) => {
    const { email, round, action } = req.body;

    try {
        let setColumns = [];
        let queryParams = [email];
        let updateParams = [];

        // 컬럼 이름과 파라미터 추가
        if (action.recCheck !== undefined) {
            setColumns.push(`rec_check_${round}`);
            queryParams.push(action.recCheck);
            updateParams.push(action.recCheck);
        }
        if (action.recTimestamp) {
            setColumns.push(`rec_timestamp_${round}`);
            queryParams.push(action.recTimestamp);
            updateParams.push(action.recTimestamp);
        }


        const query = `
            INSERT INTO round_answers (email, ${setColumns.join(', ')})
            VALUES (${queryParams.map(() => '?').join(', ')})
            ON DUPLICATE KEY UPDATE ${setColumns.map((column, index) => `${column} = VALUES(${column})`).join(', ')};
        `;

        await db.query(query, [...queryParams, ...updateParams]);

        res.status(200).json({ message: 'User action saved successfully.' });
    } catch (error) {
        console.error('Error saving user action:', error);
        res.status(500).json({ message: 'Failed to save user action.' });
    }
});

router.post('/user-preferences', async (req, res) => {
    const { email, preferences, preferenceTimestamp, round } = req.body;

    const preferenceColumns = [];
    const values = [email];

    Object.keys(preferences).forEach((key, index) => {
        const rankColumn = `preference_${round}_${index + 1}_rank`;
        const prefColumn = `preference_${round}_${index + 1}_pref`;
        preferenceColumns.push(rankColumn, prefColumn);
        values.push(preferences[key].rank || null, preferences[key].preference || null);
    });

    preferenceColumns.push(`preference_timestamp_${round}`);
    values.push(preferenceTimestamp);

    const placeholders = preferenceColumns.map(() => '?').join(', ');
    const query = `
    INSERT INTO round_answers (
        email, 
        preference_1_1_rank, preference_1_1_pref, 
        preference_1_2_rank, preference_1_2_pref, 
        preference_1_3_rank, preference_1_3_pref, 
        preference_1_4_rank, preference_1_4_pref, 
        preference_1_5_rank, preference_1_5_pref, 
        preference_1_6_rank, preference_1_6_pref, 
        preference_timestamp_1
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        preference_1_1_rank = VALUES(preference_1_1_rank), 
        preference_1_1_pref = VALUES(preference_1_1_pref), 
        preference_1_2_rank = VALUES(preference_1_2_rank), 
        preference_1_2_pref = VALUES(preference_1_2_pref), 
        preference_1_3_rank = VALUES(preference_1_3_rank), 
        preference_1_3_pref = VALUES(preference_1_3_pref), 
        preference_1_4_rank = VALUES(preference_1_4_rank), 
        preference_1_4_pref = VALUES(preference_1_4_pref), 
        preference_1_5_rank = VALUES(preference_1_5_rank), 
        preference_1_5_pref = VALUES(preference_1_5_pref), 
        preference_1_6_rank = VALUES(preference_1_6_rank), 
        preference_1_6_pref = VALUES(preference_1_6_pref),
        preference_timestamp_1 = VALUES(preference_timestamp_1);
`;


try {
    await db.query(query, values);
    res.status(200).send('사용자 선호도가 성공적으로 저장되었습니다.');
} catch (error) {
    console.error('선호도 저장 중 에러 발생:', error);
    res.status(500).send('사용자 선호도 저장 실패');
}

});




// 첫번째 투자결정
router.post('/first-decision', async (req, res) => {
    const { email, round, action } = req.body;
  
    let queryParams = [email, action.selectedStock, action.selectTimestamp];
    const query = `
        INSERT INTO round_answers (email, first_selected_stock_${round}, first_select_timestamp_${round})
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE first_selected_stock_${round} = VALUES(first_selected_stock_${round}),
                                first_select_timestamp_${round} = VALUES(first_select_timestamp_${round});
    `;
  
    try {
        await db.query(query, queryParams);
        res.status(200).json({ message: 'Selection and timestamp saved successfully.' });
    } catch (error) {
        console.error('Error saving selection and timestamp:', error);
        res.status(500).json({ message: 'Failed to save selection and timestamp.' });
    }
  });

// 투자 결정 저장
router.post('/invest-decision', async (req, res) => {
    const { email, selectedStock, decisionTimestamp, round } = req.body;

    // 동적으로 컬럼 이름을 생성합니다. 예: round가 2일 경우, selected_stock_2, decision_timestamp_2
    const selectedStockColumn = `selected_stock_${round}`;
    const decisionTimestampColumn = `decision_timestamp_${round}`;

    try {
        const query = `
            INSERT INTO round_answers (
                email, 
                ${selectedStockColumn}, ${decisionTimestampColumn}
            )
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                ${selectedStockColumn} = VALUES(${selectedStockColumn}),
                ${decisionTimestampColumn} = VALUES(${decisionTimestampColumn});
        `;

        // 쿼리 파라미터 준비
        const queryParams = [email, selectedStock, decisionTimestamp];

        // 쿼리 실행
        await db.query(query, queryParams);

        // 성공 응답 전송
        res.status(200).json({ message: 'Investment decision saved successfully for round ' + round });
    } catch (error) {
        // 에러 처리
        console.error('Error saving investment decision for round ' + round + ':', error);
        res.status(500).json({ message: 'Failed to save investment decision for round ' + round });
    }
});


// profit get
router.get('/get-user-profits/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // 데이터베이스에서 사용자의 수익 정보 조회
        const query = 'SELECT * FROM user_profits WHERE email = ?';
        const [rows] = await db.query(query, [userId]);

        if (rows.length === 0) {
            // 사용자의 수익 정보가 데이터베이스에 없는 경우
            return res.status(404).json({ message: 'User profits not found.' });
        }

        // 조회된 사용자 수익 정보를 클라이언트에 반환
        const userProfits = rows[0];
        res.json(userProfits);
    } catch (error) {
        console.error('Error retrieving user profits:', error);
        res.status(500).json({ message: 'Failed to retrieve user profits.' });
    }
});

// profit 저장
router.post('/update-profits', async (req, res) => {
    const { userId, round, profit } = req.body;

    try {
        const profitColumn = `profit_${round}`; // 동적으로 칼럼명 생성
        const updateQuery = `
            UPDATE user_profits
            SET ${profitColumn} = ?
            WHERE email = ?;
        `;

        await db.query(updateQuery, [profit, userId]);
        res.json({ message: 'Profit updated successfully.' });
    } catch (error) {
        console.error('Error updating profit:', error);
        res.status(500).json({ message: 'Failed to update profit.' });
    }
});
  
module.exports = router;
