async function dbArray(query, treasurydbcon){
    return new Promise((resolve,reject) =>{

        treasurydbcon.query(query,function(err) {
            if (err) throw err;
            treasurydbcon.query(query, function (err, result) {
                if (err) throw err;
                    resolve(result)
                });
        });   
    });    
}
exports.dbArray = dbArray;