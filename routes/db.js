const mysql = require('mysql2/promise');


const createPool = config => {
  return mysql.createPool({
    user: process.env.DB_USER || 'root', // 기본값을 로컬 환경용으로 설정
    password: process.env.DB_PASS || 'password', // 기본값을 로컬 환경용으로 설정
    host: process.env.DB_HOST || 'localhost', // 기본값을 로컬 환경용으로 설정
    database: process.env.DB_NAME || 'myprojectdb', // 데이터베이스 이름
    ...config,
  });
}

const db = createPool({});

db.getConnection()
.then(conn => {
  console.log('Connected to the MySQL Server.');
  conn.release();
})
.catch(err => {
  console.error('Unable to connect to the MySQL Server:', err);
});

module.exports = db;