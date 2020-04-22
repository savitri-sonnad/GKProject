/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';


const { FileSystemWallet, Gateway } = require('fabric-network');
var fabric_network = require('fabric-network')
const fs = require('fs');
const path = require('path');
const xmljson = require('xml2json')
var hfc = require('fabric-client')
const gkdbcon = require('./src/gkdbconfig')
const ccpPath = path.resolve(__dirname, '..', 'network-config', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

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
        });
    });
}

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        // // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('admin');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: false } });

        // // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // // Get the contract from the network.
        const contract = network.getContract('gatekeeper');
        var channel = network.getChannel('mychannel')
        // Evaluate the specified transaction.
        var date = new Date();
        console.log("Begin time >> ", date.getDate(), ' ', date.getTime())
        var xmldata = fs.readFileSync('/data/RBI/Unprocessed_files/EP/EP011000000000000020180315059833.xml')
        var jsonstring = xmljson.toJson(xmldata);
        var a = JSON.parse(jsonstring)
        var pmtinfarray = [];
        if (Object.values(a).length == 0) {
            console.log(destinationpath)
        }
        else if (Array.isArray(a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)) {
            console.log(a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[2289])
            for (var i = 0; i < a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.length; i++) {
                var pmtob = { filename: 'EP011000000000000020180315059833.xml', EndToEndId: "", Amt: "", CrdtId: "", DbtId: "", CreDt: "", Ack: "", Scroll: "", billNo: "" };
                pmtob.EndToEndId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].PmtId.EndToEndId;
                pmtob.Amt = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].Amt.InstdAmt.Amt;
                pmtob.CrdtId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].CdtrAcct.Id.Othr.Id;
                pmtob.DbtId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
                console.log( a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i])
                pmtob.CreDt = a.RequestPayload.AppHdr.CreDt;
                pmtinfarray.push(pmtob);
            }
        }
        else {
            console.log('File has no array')
            var pmtob = {
                filename:'EP011000000000000020180315059833.xml',
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
        console.log(pmtinfarray)
        var result = await contract.submitTransaction('saveDetailsToLedger', JSON.stringify(pmtinfarray))
        var b=JSON.parse(result)
        console.log(b);
        // if (b !== undefined && b.toString() == "true") {
        //     console.log(b.toString())
        // }else{
        //     var c = await saveDuplicateIdDetails(b.EndToEndId,pmtinfarray[0].filename,b.FileName,b.Ack,b.Scroll).catch((e)=>{console.log('Duplicate file details not saved')});
        //     console.log(c)
        // }
        date = new Date();
        console.log("End time >> ", date.getHours() + " " + date.getMinutes() + ":" + date.getSeconds())
        // var block2 = await channel.queryBlock(3);
        // // var block3 = await channel.queryBlock(3);
        // var bcinfo = await channel.queryInfo();
        // var block1 = await channel.queryBlock(17504);
        // console.log(bcinfo)
        // var blockitem = await channel.queryBlockByHash(bcinfo.currentBlockHash)
        // var blockitem1 = await channel.queryBlockByHash(blockitem.previousBlockHash)
        // console.log(bcinfo)
        // for(var i=0;i<block1.data.data.length;i++){
        //     for(var j=0;j<block1.data.data[i].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.reads.length;j++){
        //         console.log('row',i)
        //         console.log(block1.data.data[i].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.reads[j])
        //     }
        // }
        // for (var i = 0; i < jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts.length; i++) {
        //     myob.OrgnlEndToEndId = jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts[i].OrgnlEndToEndId;
        //     myob.GrpSts = jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlGrpInfAndSts.GrpSts;
        //     pmtinfarray.push(myob);
        // }
        // console.log( blockitem.header)
        // console.log('\n------\n')
        // console.log( blockitem.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes)
        // console.log('\n------\n')
        // console.log(block1.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes)
        // console.log('\n------\n')
        await gateway.disconnect()
    } catch (error) {
        console.log(`\n======================================\n Failed to evaluate transaction: ${error.message}`);
        process.exit(1);
    }
}


main();
