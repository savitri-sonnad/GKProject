	
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyparser = require('body-parser')
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const fileparser = require('./src/FileParser')
const ipfsclient = require('./src/UniqueFileCheck')
const addtoipfs = require('./src/IPFSAddFile')
const allvalidations = require('./src/validations')
const gkdbcon = require('./src/gkdbconfig')

const ccpPath = path.resolve(__dirname, '..', 'network-config', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const portnumber = 7077;

async function saveDuplicateIdDetails(endtoendid,filename,processed_filename,ack,scroll){
    return new Promise((resolve, reject) => {
        var duplicateidquery=`INSERT INTO EPaymentFileDetails.DUPLICATE_ID
        (
        DUPLICATE_ENDTOENDID,
        FILE_NAME,
        PROCESSED_FILENAME,
        ACKNOWLEDGEMENT,
        SCROLL)
        VALUES
        ('${endtoendid}',
        '${filename}',
        '${processed_filename}',
        '${ack}',
        '${scroll}');`
        gkdbcon.query(duplicateidquery,function(err,res){
            if(err){
                throw err;
            }
            console.log('Duplicate id details saved');
            resolve("Duplicate id details saved");
        });
    });
}


async function fileProcessing(filename) {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var date_today = year + '-' + month + '-' + day;
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var miliseconds = date.getMilliseconds();
    var time = hours + '-' + minutes + '-' + miliseconds;
    var gkquery = `INSERT INTO EPAYMENTFILE_RECORDS (FILE_NAME,DATE,TIME,HASH,TREASURY_NAME,STATUS,REASON) values ('${filename}','${date_today}','${time}',`;
    console.log('Filename = ' + filename)
    var destinationpath = `/data/RBI/Processed_files/`;
    var filestatus = '';
    try {
        var dup_id = '';
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('gatekeeper');
        // Submit the specified transaction.
        var filedata = await fileparser.FileParser(filename).catch((err) => { console.log('file parser error', err) })
        var isuniquefile = await ipfsclient.checkUniqueFile(filedata,filename).catch((err) => { console.log('ipfs error', err) })
        gkquery += `'${isuniquefile.hash}',`;
        var a = JSON.parse(filedata)
        console.log("Begin time >> ", date.getHours() + " " + date.getMinutes() + ":" + date.getSeconds())
        gkquery += `'${a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm}',`
        console.log('Treasury =' + a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm)
        destinationpath += ''
        if (isuniquefile.filestatus) {
            var pmtinfarray = [];
            if(Object.values(a).length == 0){
                destinationpath+=`Empty_EP/${filename}`
                filestatus='failed'
                console.log(destinationpath)
            }
            else if (Array.isArray(a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)) {
                for (var i = 0; i < a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.length; i++) {
                    var pmtob = { FileName: filename, EndToEndId: "", Amt: "", CrdtId: "", DbtId: "", CreDt: "", Ack: "", Scroll: "", billNo: "" };
                    pmtob.EndToEndId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].PmtId.EndToEndId;
                    pmtob.Amt = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].Amt.InstdAmt.Amt;
                    pmtob.CrdtId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].CdtrAcct.Id.Othr.Id;
                    pmtob.DbtId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
                    pmtob.CreDt = a.RequestPayload.AppHdr.CreDt;;
                    pmtinfarray.push(pmtob);
                }
            }
            else {
                var pmtob = { 
                    FileName : filename,
                    EndToEndId: a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId,
                    Amt: a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt,
                    CrdtId: a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
                    DbtId: a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
                    CreDt: a.RequestPayload.AppHdr.CreDt,
                    Ack: "",
                    Scroll: "",
                    billNo: "" 
                };
                pmtinfarray.push(pmtob);
            }
            var isidunique = await contract.evaluateTransaction('checkEndToEndIdExists', JSON.stringify(pmtinfarray)).catch((err) => {
                console.log('Network error')
            })
            if (isidunique !== undefined && isidunique.toString() == "true") {
                console.log('Not duplicate id')
                console.log('Transaction has been submitted', pmtinfarray[0].EndToEndId);
                var allvalidationspassed = await allvalidations.allValidations(pmtinfarray,filename).catch((e) => { console.log('R4 error', e) })
                console.log('allvalidationspassed = ', allvalidationspassed)
                // saving file to ledger
                if (allvalidationspassed.validationresult == true) {
                    var filetoledgerresult = await contract.submitTransaction('saveDetailsToLedger', JSON.stringify(pmtinfarray)).catch((e) => { console.log('ledger error', e) })
                    await gateway.disconnect();
                    console.log("filetoledgerresult", filetoledgerresult.toString())
                    // var addtoipfsstatus = await addtoipfs.addFiletoIPFS(filedata).catch((e) => { console.log('ipfs add error', e) })
                    // console.log(`${filename} added to ipfs with hash ${addtoipfsstatus}`)
                    gkquery += `'passed',''`
                    destinationpath += `EP_Passed/${filename}`
                    filestatus='passed'
                }
                else {
                    console.log('allvalidationspassed=\n', allvalidationspassed)
                    await gateway.disconnect();
                    gkquery += `'failed','${allvalidationspassed.failurereason}'`;
                    destinationpath += `EP_Failed/${filename}`
                    filestatus='failed'
                }
            }
            else {
                gkquery += `'failed','Duplicate EndToEndId'`;
                destinationpath += `EP_Failed/${filename}`
                filestatus='failed';
                dup_id+='1';
                var b = JSON.parse(isidunique)
                await saveDuplicateIdDetails(b.EndToEndId,filename,b.FileName,b.Ack,b.Scroll).catch((e)=>{console.log('Duplicate file details not saved')});
                console.log(`\n${destinationpath}=========\nDuplicate Id\n=========\n`)
                await gateway.disconnect();
            }
        }
        else {
            gkquery += `'failed','DUPLICATE FILE'`;
            destinationpath += `EP_Failed/${filename}`
            filestatus='failed'
            console.log(filename+' Not a unique file')
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        destinationpath += `EP_Error/${filename}`
        filestatus='failed'
        return { err: error.message ,file:filename, path: destinationpath };
    }
    gkquery +=`);`
    gkdbcon.query(gkquery, function (err, result) {
        if (err) {
            console.log('2nd DB ERROR', err)
        }
    });
    console.log("path" + destinationpath)
    var date = new Date();
    console.log("End time >> ", date.getHours() + " " + date.getMinutes() + ":" + date.getSeconds())
    return { err: '', file:filename, status: filestatus, path: destinationpath };
}
async function ackFileProcessing(filename) {
    var destinationpath = `/data/RBI/Processed_files/`;
    console.log('ackFileProcessing')
    try {
        // Check to see if we've already enrolled the user.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('gatekeeper');
        // Submit the specified transaction.
        var filestring = await fileparser.FileParser(filename);
        var jsondata = JSON.parse(filestring)
        var pmtinfarray = [];
        console.log('A')
        if(Object.values(jsondata).length == 0){
            console.log('B')
            destinationpath+=`ACK_Failed/${filename}`
            return {err:'',file : filename, path: destinationpath}
        }
        else if(Array.isArray(jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts)){
            console.log('C')

            for (var i = 0; i < jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts.length; i++) {
                var pmtob = { OrgnlEndToEndId: "", GrpSts: "" };
                pmtob.OrgnlEndToEndId = jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts[i].OrgnlEndToEndId;
                pmtob.GrpSts = jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlGrpInfAndSts.GrpSts;
                pmtinfarray.push(pmtob);
            }
        }
        else{
            console.log('D')
            var pmtob = { 
                OrgnlEndToEndId: jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts.OrgnlEndToEndId,
                GrpSts: jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlGrpInfAndSts.GrpSts
            }
                pmtinfarray.push(pmtob);
        }
        console.log('E')
        var ackupdate = await contract.submitTransaction('saveAckDetailsToLedger', JSON.stringify(pmtinfarray)).catch((e) => { console.log('ledger error', e) })
        await gateway.disconnect();
        if (ackupdate.toString() == "true") {
            console.log("Acknowledgement File processed")
            destinationpath += `ACK_Processed/${filename}`
            console.log('F')
        }
        else {
            console.log("Acknowledgement File failed to process.")
            destinationpath += `ACK_Failed/${filename}`
            return {err:'Cannot process '+filename, path:destinationpath}
        }
        return { err: '',file : filename,  path: destinationpath }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        destinationpath+=`ACK_Failed/${filename}`
        return { err: error, file: filename, path: destinationpath }
    }
}
async function scrollFileProcessing(filename) {
    var destinationpath = `/data/RBI/Processed_files/`;
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('gatekeeper');
        // Submit the specified transaction.
        var filestring = await fileparser.FileParser(filename);
        var jsondata = JSON.parse(filestring)
        var pmtinfarray = [];
        if(Object.values(jsondata).length == 0){
            destinationpath+=`DN_Failed/${filename}`
            return {err:'', file:filename, path: destinationpath}
        }
        else if(Array.isArray(jsondata.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry)){
            for (var i = 0; i < jsondata.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry.length; i++) {
                var pmtob = { EndToEndId: "", Prtry: "" };
                pmtob.EndToEndId = jsondata.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry[i].NtryDtls.TxDtls.Refs.EndToEndId;
                pmtob.Prtry = jsondata.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry[i].BkTxCd.Prtry;
                pmtinfarray.push(pmtob);
            }
        }
        else{
            var pmtob = { 
                EndToEndId: jsondata.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry.NtryDtls.TxDtls.Refs.EndToEndId,
                Prtry: jsondata.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry.BkTxCd.Prtry
            }
                pmtinfarray.push(pmtob);
        }
        console.log(pmtinfarray)
        var dnupdate = await contract.submitTransaction('saveScrollDetailsToLedger', JSON.stringify(pmtinfarray)).catch((e) => { console.log('ledger error', e) })
        if (dnupdate.toString() == "true") {
            console.log("Scroll File processed")
            destinationpath += `DN_Processed/${filename}`
        }
        else{
            console.log("Scroll File failed to process.")
            destinationpath+=`DN_Failed/${filename}`
            return {err:'', file:filename, path: destinationpath}
        }
        await gateway.disconnect();
        return { err: '', file: filename, path: destinationpath }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        destinationpath += `DN_Failed/${filename}`
        return { err: error, file: filename, path: '' }
    }
}
// send info blockwise
async function getBlockInfo(startDate, endDate, pagenumber) {
    return new Promise(async (resolve, reject) => {
        try {
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = new FileSystemWallet(walletPath);
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');
            var channel = network.getChannel('mychannel');
            var bcinfo = await channel.queryInfo();
            var lastest_block = await channel.queryBlockByHash(bcinfo.currentBlockHash)
            var blocknumber = parseInt(lastest_block.header.number)
            var paymentsinblock = []
            var rowsperpage = 50;
            var beginindex = (pagenumber - 1) * rowsperpage;
            var endindex = pagenumber * rowsperpage;
            var inputday = startDate.split('-')[0];
            var inputmonth = startDate.split('-')[1];
            var inputyear = startDate.split('-')[2];
            var minDate = new Date(inputyear, inputmonth - 1, inputday);
            inputday = endDate.split('-')[0];
            inputmonth = endDate.split('-')[1];
            inputyear = endDate.split('-')[2];
            var maxDate = new Date(inputyear, inputmonth - 1, inputday);
            var currentdate;
            while (blocknumber > 1) {
                let c = true;
                var blockitem = await channel.queryBlock(blocknumber)
                console.log(blocknumber)
                var thiblocksize = blockitem.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes.length
                for (var i = 0; i < thiblocksize; i++) {
                    let d = false
                    var paymentob = blockitem.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes[i];
                    var blocktimestamp = JSON.parse(paymentob.value).CreDt;
                    var blockdate = blocktimestamp.substr(0, 10)
                    inputday = blockdate.split('-')[2];
                    inputmonth = blockdate.split('-')[1];
                    inputyear = blockdate.split('-')[0];
                    currentdate = new Date(inputyear, inputmonth - 1, inputday);                    
                    if (currentdate.getTime() >= minDate.getTime() && currentdate.getTime() <= maxDate.getTime()) {
                        paymentsinblock.push(paymentob);
                    }
                    else {
                        console.log('Out of Range Date')
                        d = false;
                        break;
                    }
                }
                if(currentdate < minDate){
                    break;
                }
                blocknumber = blocknumber - 1;
                console.log(blocknumber)
            }
            await gateway.disconnect();
            var paymentslist = [];
            if (paymentsinblock.length < endindex) {
                for (var i = beginindex; i < paymentsinblock.length; i++)
                    paymentslist.push(paymentsinblock[i])
            }
            else {
                for (var i = beginindex; i <= endindex; i++)
                    paymentslist.push(paymentsinblock[i])
            }
            // return array of payments in block
            resolve({ data: paymentslist, totalitems: paymentsinblock.length })
        } catch (err) {
            console.log(err)
            reject("Could Not Get Block info\n", err)
        }
    });
}

function getTotalFilesProcessed(query, totalfilesprocessed) {
    gkdbcon.query(query, (err, result) => {
        if (err) {
            console.log('2nd DB ERROR', err)
        }
        return totalfilesprocessed(result[0].FILESTATUS)
    })
}
app.use(express.static("gatekeeper_frontend"))
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json())


var server = app.listen(portnumber, () => {
    console.log('server started on port' + server.address().port);
})
app.get('/dashboard', async function (req, res) {
    res.sendFile(path.join(__dirname, 'gatekeeper_frontend/dashboard.html'))
})
app.get('/report', async function (req, res) {
    res.sendFile(path.join(__dirname, 'gatekeeper_frontend/filereport.html'))
})

app.post('/processFiles', async function (request, response) {
    request.setTimeout(10 * 60 * 60 * 1000)
    //passsing directoryPath and callback function
    var mvfileslist = []
    console.log("New Request Received")
    var filestoprocess = request.body.files
    for (var i = 0; i < filestoprocess.length; i++) {
        var file = filestoprocess[i]
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>\n"+file+"\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
        let filetype = file.charAt(0)
        switch (filetype) {
            case 'E': console.log('ePayment File =>', file)
                var a = await fileProcessing(file)
                if (a.err == '')
                    mvfileslist.push(a)
                break;
            case 'A': console.log('Ack File')
                var b = await ackFileProcessing(file)
                if (b.err == '')
                    mvfileslist.push(b)
                break;
            case 'D': console.log('Scroll File');
                var c = await scrollFileProcessing(file)
                if (c.err == '')
                    mvfileslist.push(c)
                break;
            default: console.log('Ignoring other file ', file)
        }
    }
    response.send(mvfileslist)
})

app.post('/totalFilesProcessed', (request, response) => {
    // fetch total number of files processed
    var passed, failed;
    var failedfilesquery = `select COUNT(STATUS) as FILESTATUS FROM EPaymentFileDetails.EPAYMENTFILE_RECORDS where status='failed';`
    var passedfilesquery = `select COUNT(STATUS) as FILESTATUS FROM EPaymentFileDetails.EPAYMENTFILE_RECORDS where STATUS='passed';`
    getTotalFilesProcessed(passedfilesquery, (result) => {
        passed = result
        getTotalFilesProcessed(failedfilesquery, (result) => {
            failed = result
            response.send({ 'passed': passed, 'failed': failed })
        })
    })
})
app.get('/topreasons', (request, response) => {
    // fetch top reasons
    var query = `select reason,count(REASON) as topreasons from EPaymentFileDetails.EPAYMENTFILE_RECORDS where REASON !='' group by reason order by topreasons desc limit 5;`
    gkdbcon.query(query, function (err, result) {
        if (err) {
            console.log('TOP RESONS ERROR ', err)
        }
        response.send(result)
    })
})

app.get('/filesperday', (request, response) => {
    // fetch total number of files processed per day
    var query = `select DATE,count(DATE) as day from EPaymentFileDetails.EPAYMENTFILE_RECORDS group by DATE order by DATE desc limit 14;`
    gkdbcon.query(query, function (err, result) {
        if (err) {
            console.log('TOP RESONS ERROR ', err)
        }
        response.send(result)
    })
})

app.get('/toptreasuries', (request, response) => {
    // fetch total number of files processed per day
    var query = `select TREASURY_NAME,count(TREASURY_NAME) as treasury from EPaymentFileDetails.EPAYMENTFILE_RECORDS where EPaymentFileDetails.EPAYMENTFILE_RECORDS.STATUS="failed" group by TREASURY_NAME order by treasury desc limit 5;`
    gkdbcon.query(query, function (err, result) {
        if (err) {
            console.log('TOP RESONS ERROR ', err)
        }
        response.send(result)
    })
})

app.post('/paymentsinblock', (request, response) => {
    getBlockInfo(request.body.startDate, request.body.endDate, request.body.pagenumber).then((result) => {
        response.send(result)
    }).catch((err) => { console.log('Could Not Get Block Details ', err) })
})

app.post('/failedfiles', (request, response) => {
    if (request.body.term == "TREASURY_NAME")
        var query = `select * from EPaymentFileDetails.EPAYMENTFILE_RECORDS where ${request.body.term}='${request.body.condition}' and REASON !=''  order by DATE desc`
    else
        var query = `select * from EPaymentFileDetails.EPAYMENTFILE_RECORDS where ${request.body.term}='${request.body.condition}' order by DATE desc;`
    console.log('TERM= ', request.body.term)
    console.log('condition= ', request.body.condition)
    console.log(query)
    gkdbcon.query(query, function (err, result) {
        if (err) {
            console.log('TOP RESONS ERROR ', err)
        }
        response.send(result)
    })
})
