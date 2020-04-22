var mysql = require('mysql');

const gkdbconn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Discodancer@1",
    database: "EPaymentFileDetails"
});

module.exports = gkdbconn;