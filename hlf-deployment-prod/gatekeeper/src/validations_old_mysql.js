var tdb = require('./dbconfig.js');

async function dbArray(query){
    return new Promise((resolve,reject) =>{

        tdb.query(query,function(err) {
            if (err) throw err;
            tdb.query(query, function (err, result) {
                if (err) throw err;
                resolve(result)
            });
        });   
    });    
}

// exports.dbArray = dbArray;
async function requirement3(jsondata){
    const query = 'SELECT PAYMENT_ID FROM GateKeeper.REQUIREMENT_1;'
    var validation3array = await dbArray(query);
    for(var i =0; i<jsondata.length;i++)
    {
        for( var j=0; j< validation3array.length;j++)
        {
            if(validation3array[j].PAYMENT_ID == jsondata[i].EndToEndId){
                return {validationresult:true,failurereason:'requirement3',paymentid:validation3array[j].PAYMENT_ID};
            }
        }
    }
    return {'validationresult':true,failurereason:''};
}

async function requirement4(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_2_4;'
    var validation4array = await dbArray(query);
    var amt101;
    // console.log(jsondata)
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
                        // console.log("amount is :  "+amt101)
                    }
                }
                // console.log("Total amount:  "+amt101)
                if(jsondata[i].Amt > amt101)
                {
                    return {'validationresult':false,failurereason:'requirement4', 'paymentid':jsondata[i].EndToEndId};
                }
            }
        }
    }
    return {'validationresult':true,failurereason:''};
}

async function requirement5(jsondata){
    const query = `SELECT RQMT_3_1.*,RQMT_3_2.* 
	FROM 
	REQUIREMENT_3_1 RQMT_3_1
	JOIN
	REQUIREMENT_3_2 RQMT_3_2
	ON RQMT_3_1.BL_STRING = RQMT_3_2.BL_STRING`
    var validation5array = await dbArray(query);
        for(var ab = 0; ab < jsondata.length; ab++)
        {
            for(var ac =0; ac < validation5array.length; ac++)
            {
                if(jsondata[ab].EndToEndId == validation5array[ac].PAYMENT_ID)
                {
                    if(validation5array[ac].BL_STRING == 0 || validation5array[ac].DDO_CODE == 0 || validation5array[ac].OFFICE_SYSCD == 0)
                    {
                        return {'validationresult':false,failurereason:'requirement5', 'paymentid':jsondata[ab].EndToEndId};
                    }
                }
            }
        }
        return {'validationresult':true,failurereason:''};
}

async function requirement6(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_2_4;'
    var validation6array = await dbArray(query);
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation6array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation6array[ac].PAYMENT_ID)
            {
                if(jsondata[ab].CrdtId != validation6array[ac].BANK_ACC_NO)
                {
                    return {'validationresult':false,failurereason:'requirement6', 'paymentid':jsondata[ab].EndToEndId};
                }
            }
        }
    }
    return {'validationresult':true,failurereason:''};
}

async function requirement7(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_5'
    var validation7array = await dbArray(query);
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation7array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation7array[ac].PAYMENT_ID)
            {
                if(validation7array[ac].SANCTION_ORDER_NO == 0)
                {
                    return {'validationresult':false,failurereason:'requirement7', 'paymentid':jsondata[ab].EndToEndId};
                }
            }
        }
    }
    return {'validationresult':true,failurereason:''};
}

async function requirement8(jsondata){
    const query = 'SELECT * FROM GateKeeper.REQUIREMENT_6'
    var validation8array = await dbArray(query);
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation8array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation8array[ac].PAYMENT_ID)
            {
                var date9 = jsondata[ab].CreDt;
                var date10 = new Date(date9)
                // console.log(date10)
                var voucher_date1 = new Date(validation8array[ac].VOUCHER_DATE);
                // console.log("voucher_date1 "+voucher_date1);

                var diffMs = (voucher_date1 - date10); // milliseconds between now & voucher_date1
                // console.log("diffMs "+diffMs);

                var diffDays = Math.floor(diffMs / 86400000); // days
                // console.log("diffDays "+diffDays);

                var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
                // console.log("diffHrs "+diffHrs);

                var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
                // console.log("diffMins "+diffMins);

                var diffsec = Math.round(((diffMs % 86400000) % 3600000) / 3600000); // seconds
                // console.log("diffsec "+diffsec);

                // console.log(diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes " + diffsec+ " diffsec");
                
                if(diffDays > 1)
                {
                    // // console.log("greater than 24 hours")
                    count9++;
                }
                else if(diffDays == 0)
                {
                    // // console.log("less than 24 hours")
                }
                else if(diffDays == 1 && diffHrs == 0 && diffMins == 0 && diffsec == 0)
                {
                    // // console.log("lesser than 24hours");
                }
                else
                {
                    // console.log("greater than 24 hours")
                    return {'validationresult':false,failurereason:'requirement8', 'paymentid':jsondata[ab].EndToEndId};
                }
            }
        }
    }
    return {'validationresult':true,failurereason:''};
}

async function requirement9(jsondata){
    const query = `SELECT RQMT_3_1.*,RQMT_3_2.* 
	FROM 
	REQUIREMENT_3_1 RQMT_3_1
	JOIN
	REQUIREMENT_3_2 RQMT_3_2
	ON RQMT_3_1.BL_STRING = RQMT_3_2.BL_STRING`
    var validation9array = await dbArray(query);
    for(var ab = 0; ab < jsondata.length; ab++)
    {
        for(var ac =0; ac < validation9array.length; ac++)
        {
            if(jsondata[ab].EndToEndId == validation9array[ac].PAYMENT_ID)
            {
                if(validation9array[ac].NEFT_PYMNT_ACCNT_NO != jsondata[ab].DbtId)
                {
                    return {'validationresult':false,failurereason:'requirement9', 'paymentid':jsondata[ab].EndToEndId};
                }
            }
        }
    }
    return {'validationresult':true,failurereason:''};
}

async function allValidations(jsondata){
    var validation3result = await requirement3(jsondata)
    if(validation3result.validationresult == true){
        console.log('Validation 3 success')
        var validation4result = await requirement4(jsondata)
        if(validation4result.validationresult == true){
            console.log('Validation 4 success')
            var validation5result = await requirement5(jsondata)
            if(validation5result.validationresult == true){
                console.log('Validation 5 success')
                var validation6result = await requirement6(jsondata)
                if(validation6result.validationresult == true){
                    console.log('Validation 6 success')
                    var validation7result = await requirement7(jsondata)
                    if(validation7result.validationresult == true){
                        console.log('Validation 7 success')
                        var validation8result = await requirement8(jsondata)
                        if(validation8result.validationresult == true){
                            console.log('Validation 8 success')
                            var validation9result = await requirement9(jsondata)
                            if(validation9result.validationresult == true){
                                return validation9result;
                            }else{
                                return validation9result;
                            }
                        }else{
                            return validation8result
                        }
                    }else{
                        return validation7result
                    }
                }else{
                    return validation6result
                }
            }else{
                return validation5result
            }
        }else{
            return validation4result
        }
    }else{
        return validation3result
    }
}

exports.allValidations = allValidations;
