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





async function fileProcessing() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var date_today = year + '-' + month + '-' + day;
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var miliseconds = date.getMilliseconds();
    var time = hours + '-' + minutes + '-' + miliseconds;
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
        var xmldata = fs.readFileSync('/data/RBI/Processed_files/EP_Failed/EP011000000000000020150225000005.XML.done')
        var jsonstring = xmljson.toJson(xmldata);
        console.log(jsonstring)
        if (xmldata.toString() == undefined)
            console.log('y' + xmldata.toString().length)
        else
            console.log('n' + xmldata.toString().length)
        var a = JSON.parse(jsonstring)
        gkquery += `'${isuniquefile.hash}',`;
        var a = JSON.parse(filedata)
        console.log("Begin time >> ", date.getHours() + " " + date.getMinutes() + ":" + date.getSeconds())
        gkquery += `'${a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm}',`
        console.log('Treasury =' + a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm)
        destinationpath += ''
        var pmtinfarray = [];
        if (Object.values(a).length == 0) {
            filestatus = 'failed'
            console.log(destinationpath)
        }
        else if (Array.isArray(a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)) {
            for (var i = 0; i < a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.length; i++) {
                var pmtob = { EndToEndId: "", Amt: "", CrdtId: "", DbtId: "", CreDt: "", Ack: "", Scroll: "", billNo: "" };
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
            gkquery += `'failed','Duplicate EndToEndId'`;
            filestatus = 'failed';
            dup_id += '1';
            console.log(`\n${destinationpath}=========\nDuplicate Id\n=========\n`)
        })
        if (isidunique !== undefined && isidunique.toString() == "true") {
            console.log('Not duplicate id')
            console.log('Transaction has been submitted', pmtinfarray[0].EndToEndId);
        }
        else {
            console.log('allvalidationspassed=\n', allvalidationspassed)
            await gateway.disconnect();
        }
    }
catch(e){
console.log("i am a disco dancer" + e)
}
}
fileProcessing().catch((e)=>{console.log("i am a disco dancer" + e)});