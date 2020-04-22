const dbcon = require('./dbconfig')

async function requirement6(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_2_4;'
    var validation6array = await dbcon.dbArray(query);
    var allaccountssame = true;
    var count = 0;
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation6array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation6array[ac].PAYMENT_ID)
            {
                if(jsondata[ab].CrdtId != validation6array[ac].BANK_ACC_NO)
                {
                    count++;
                }
            }
        }
    }
    if(count > 0)
        allaccountssame = false

    return allaccountssame;
}

exports.requirement6 = requirement6;