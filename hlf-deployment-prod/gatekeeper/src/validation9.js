const dbcon = require('./dbconfig')

async function requirement9(jsondata){
    const query = `SELECT RQMT_3_1.*,RQMT_3_2.* 
	FROM 
	REQUIREMENT_3_1 RQMT_3_1
	JOIN
	REQUIREMENT_3_2 RQMT_3_2
	ON RQMT_3_1.BL_STRING = RQMT_3_2.BL_STRING`
    var validation9array = await dbcon.dbArray(query);
    var isvalidorder = true;
    var count = 0;
    console.log(jsondata)
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation9array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation9array[ac].PAYMENT_ID)
            {
                if(validation9array[ac].NEFT_PYMNT_ACCNT_NO != jsondata[ab].DbtId)
                {
                    count++;
                }
            }
        }
    }
    if(count > 0)
        isvalidorder = false

    return isvalidorder;
}

exports.requirement9 = requirement9;