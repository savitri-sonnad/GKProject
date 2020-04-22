const dbcon = require('./dbconfig')

async function requirement8(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_6'
    var validation8array = await dbcon.dbArray(query);
    var isvalidorder = true;
    var count9 = 0;
    console.log(jsondata)
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation8array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation8array[ac].PAYMENT_ID)
            {
                var date9 = jsondata[ab].CreDt;
                var date10 = new Date(date9)
                console.log(date10)
                var voucher_date1 = new Date(validation8array[ac].VOUCHER_DATE);
                console.log("voucher_date1 "+voucher_date1);

                var diffMs = (voucher_date1 - date10); // milliseconds between now & voucher_date1
                console.log("diffMs "+diffMs);

                var diffDays = Math.floor(diffMs / 86400000); // days
                console.log("diffDays "+diffDays);

                var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
                console.log("diffHrs "+diffHrs);

                var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
                console.log("diffMins "+diffMins);

                var diffsec = Math.round(((diffMs % 86400000) % 3600000) / 3600000); // seconds
                console.log("diffsec "+diffsec);

                console.log(diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes " + diffsec+ " diffsec");
                
                if(diffDays > 1)
                {
                    console.log("greater than 24 hours")
                    count9++;
                }
                else if(diffDays == 0)
                {
                    console.log("less than 24 hours")
                }
                else if(diffDays == 1 && diffHrs == 0 && diffMins == 0 && diffsec == 0)
                {
                    console.log("lesser than 24hours");
                }
                else
                {
                    console.log("greater than 24 hours")
                    count9++;
                }
            }
        }
    }
    if(count9 > 0)
        isvalidorder = false

    return isvalidorder;
}
exports.requirement8 = requirement8;