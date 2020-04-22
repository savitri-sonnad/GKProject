const dbcon = require('./dbconfig')

async function requirement5(jsondata){
    const query = `SELECT RQMT_3_1.*,RQMT_3_2.* 
	FROM 
	REQUIREMENT_3_1 RQMT_3_1
	JOIN
	REQUIREMENT_3_2 RQMT_3_2
	ON RQMT_3_1.BL_STRING = RQMT_3_2.BL_STRING`
    var validation5array = await dbcon.dbArray(query);
    var isbillvalid = true;
    var count = 0;
        for(var ab = 0; ab < jsondata.length; ab++)
        {
            for(var ac =0; ac < validation5array.length; ac++)
            {
                if(jsondata[ab].EndToEndId == validation5array[ac].PAYMENT_ID)
                {
                    if(validation5array[ac].BL_STRING == 0 || validation5array[ac].DDO_CODE == 0 || validation5array[ac].OFFICE_SYSCD == 0)
                    {
                        count++;
                    }
                }
            }
        }
        if(count > 0)
            isbillvalid = false
    return isbillvalid;
}

exports.requirement5 = requirement5;