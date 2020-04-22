var tdb = require('./src/dbconfig')

var query = `select  
pa.PAYMENT_ID,
UPPER(bl.TAG_DOC_NO) as SANCTION_ORDER_NO
from PA_PAYMENT_DTL_TXN pa
join BL_DOCS_TXN bl on pa.PAYMENT_SRC_ID = bl.BL_ID and bl.TAG_DOC_TYPE = 10200119
where pa.PAYMENT_ID in 
('E557B170317000001','E557B170317000002','E557B170317000003','E557B170317000004','E557B170317000005');`

tdb.query(query, function (err,result) {
    if (err) throw err;
    console.log(result)
    console.log(result.length)
});