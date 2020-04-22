const dbcon = require('./dbconfig')

async function requirement3(jsondata) {
    const query = 'SELECT PAYMENT_ID FROM GateKeeper.REQUIREMENT_1;'
    var validation3array = await dbcon.dbArray(query);
    var payidexists = true;
    for (var i = 0; i < jsondata.length; i++) {
        var found = false;
        for (var j = 0; j < validation3array.length; j++) {
            if (validation3array[j].PAYMENT_ID == jsondata[i].EndToEndId) {
                found = true;
                break;
            }
        }

        if (!found) {
            payidexists = false;
            console.log('Failed at row' + i + '  +++' + jsondata[i].EndToEndId)
            break;
        }
    }
    return payidexists;
}

console.log(requirement3({}))


//exports.requirement3 = requirement3;
