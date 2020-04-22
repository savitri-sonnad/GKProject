var ipfsClient = require('ipfs-http-client');
var ipfs = ipfsClient();

async function addFiletoIPFS(jsondata){
    return new Promise((resolve,reject) =>{
        ipfs.add(Buffer.from(JSON.stringify(jsondata)),{onlyHash : false},function(err, file){ resolve(file[0].path)})
    });
}
exports.addFiletoIPFS = addFiletoIPFS;
