const dbcon = require('./dbconfig')

async function requirement7(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_5'
    var validation7array = await dbcon.dbArray(query);
    var isvalidorder = true;
    var count = 0;
    console.log(jsondata)
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation7array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation7array[ac].PAYMENT_ID)
            {
                if(validation7array[ac].SANCTION_ORDER_NO == 0)
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

exports.requirement7 = requirement7;