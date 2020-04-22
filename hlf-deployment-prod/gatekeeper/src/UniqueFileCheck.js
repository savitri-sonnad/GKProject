var ipfsClient = require('ipfs-http-client');
var ipfs = ipfsClient();
const gkdbcon1 = require('./gkdbconfig');

async function checkUniqueFile(jsondata,filename) {
    return new Promise((resolve, reject) => {
        var hashoption = { onlyHash: true };
        var ipfshash = '';
        var ipfspath = '';
        var uniqueFile = true;
        ipfs.add(Buffer.from(JSON.stringify(jsondata)), hashoption, function (err, file) {
            ipfspath = file[0].path;
            ipfshash = file[0].hash;
            var hashquery = `select hash from EPAYMENTFILE_RECORDS where hash='${ipfshash}';`
            gkdbcon1.query(hashquery, function (err, result) {
                if(err){
                    throw err;
                }
                else if (result.length == 0) {
                    uniqueFile = true;
                    console.log(result)
                    resolve({"filestatus": uniqueFile,"hash":ipfshash})
                }
                else {
                    uniqueFile = false;
                    console.log('Ref found', ipfshash)
                    var duplicatefilequery = `INSERT INTO EPaymentFileDetails.DUPLICATE_FILE
                    (
                    DUPLICATE_FILE_NAME,
                    PROCESSED_FILE_NAME,
                    HASH
                    )
                    VALUES('${filename}','${result[0].FILE_NAME}','${ipfshash}')`
                    gkdbcon1.query(duplicatefilequery, function (err, result) {
                        if (err) {
                          console.log('Duplicate ID in same file', err)
                        }
                        console.log("Duplicate File" + result)
                        resolve({"filestatus": uniqueFile,"hash":ipfshash})
                    });
                }
            })
            // ipfs.refs.local(function (err, refs) {
            //     if (err) {
            //         throw err
            //     }
            //     for (const ref of refs) {
            //         if (ref.err) {
            //             reject('ref error')
            //             console.error(ref.err)
            //         } else {
            //             if(ref.ref == ipfspath){
            //                 uniqueFile = false;
            //                 console.log('Ref found',ref.ref)
            //             }
            //         }                  
            //     }
            //     resolve({"filestatus": uniqueFile,"hash":ipfshash})
            // })
        })
    })
}

exports.checkUniqueFile = checkUniqueFile;
