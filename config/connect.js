var mysql = require('mysql');

// provide credentials for connection
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'roomier',
  password: 'A15081980p',
  database: 'roomier',
  multipleStatements: true
});

// connect to db
connection.connect(function (err) {
  console.log('Atemptig database connection...');
  if (err) {
    console.log('Connection error. Check Database. \n' + err);
  } else {
    console.log('Connection established.');
  }
});

// exports
module.exports = connection;
