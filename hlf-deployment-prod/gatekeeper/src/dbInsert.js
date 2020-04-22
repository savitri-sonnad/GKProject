var mysql = require('mysql');
const hash =  require('./src/addFiletoIPFS')
const filename = require('./src/addFiletoIPFS')

const treasurydbcon = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Welcome@123",
    database: "GateKeeper"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "INSERT INTO EPAYMENTFILE_RECORDS (ID, FILE_NAME, HASH, DATE, TIME, TREASURY_NAME, STATUS) VALUES ?";
    var values = [
      
      ['', '']
    ];
    con.query(sql, [values], function (err, result) {
      if (err) throw err;
      console.log("Number of records inserted: " + result.affectedRows);
    });
  });