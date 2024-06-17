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
        if (action.recType) {
            setColumns.push(`rec_type_${round}`);
            queryParams.push(action.recType);
            updateParams.push(action.recType);
        }
        if (action.recTimestamp) {
            setColumns.push(`rec_timestamp_${round}`);
            queryParams.push(action.recTimestamp);
            updateParams.push(action.recTimestamp);
        }

        // // 사용자 선호도 조사 처리 수정
        // for (let i = 1; i <= 5; i++) {
        //     if (action[`preference_${round}_${i}`]) { // 수정된 접근 방식
        //         setColumns.push(`preference_${round}_${i}`);
        //         queryParams.push(action[`preference_${round}_${i}`]);
        //         updateParams.push(action[`preference_${round}_${i}`]);
        //     }
        // }
        // if (action.preferenceTimestamp) {
        //     setColumns.push(`preference_timestamp_${round}`);
        //     queryParams.push(action.preferenceTimestamp);
        //     updateParams.push(action.preferenceTimestamp);
        // }

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

// router.post('/user-preferences', async (req, res) => {
//     const { email, preferences, preferenceTimestamp, round } = req.body;

//     // 컬럼 이름 동적으로 생성
//     const preferenceColumns = [
//         `preference_${round}_1`,
//         `preference_${round}_2`,
//         `preference_${round}_3`,
//         `preference_${round}_4`,
//         `preference_${round}_5`,
//         `preference_timestamp_${round}`
//     ];

//     // ON DUPLICATE KEY UPDATE 절에 사용될 컬럼=값 쌍을 동적으로 생성
//     const onDuplicateKeyUpdate = preferenceColumns
//         .map(column => `${column} = VALUES(${column})`)
//         .join(', ');

//     const query = `
//         INSERT INTO round_answer (
//             email, 
//             ${preferenceColumns.join(', ')}
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?)
//         ON DUPLICATE KEY UPDATE
//             ${onDuplicateKeyUpdate};
//     `;

//     const values = [
//         email,
//         preferences.preference_1,
//         preferences.preference_2,
//         preferences.preference_3,
//         preferences.preference_4,
//         preferences.preference_5,
//         preferenceTimestamp
//     ];

//     try {
//         await db.query(query, values);
//         res.status(200).send('User preferences saved successfully');
//     } catch (error) {
//         console.error('An error occurred', error);
//         res.status(500).send('Failed to save user preferences');
//     }
// });



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
