const dbcon = require('./dbconfig')

async function requirement4(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_2_4;'
    var validation4array = await dbcon.dbArray(query);
    var payidexists = true;
    var amt101;
    var count202 = 0;
    console.log(jsondata)
    for(var i =0; i<jsondata.length;i++)
    {
        for( var j=0; j< validation4array.length;j++)
        {
            amt101 = 0;
            if(jsondata[i].EndToEndId == validation4array[j].PAYMENT_ID)
            {
                bill = validation4array[j].BL_ID;
                for(var zx = 0; zx < validation4array.length; zx++)
                {
                    if(bill == validation4array[zx].BL_ID)
                    {
                        amt101 = +amt101 + +validation4array[zx].PMNT_AMT;
                        console.log("amount is :  "+amt101)
                    }
                }
                console.log("Total amount:  "+amt101)
                if(jsondata[i].Amt > amt101)
                {
                    count202++;
                }
            }
        }
    }
    if(count202 > 0)
    {
        return false
    }
    else{
        return true
    }
}
exports.requirement4 = requirement4;