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
const ccpPath = path.resolve(__dirname, '../network-config/connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        // console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('admin');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('mycc');
        var channel = network.getChannel('mychannel')
        // Evaluate the specified transaction.
        // var date = new Date();
        // console.log("Begin time >> ",date.getDate(),' ',date.getTime())
        // var xmldata = fs.readFileSync('../gatekeeper/files/EP011000000000000020190218093279.xml')
        // var jsonstring = xmljson.toJson(xmldata);
        // var jsondata = JSON.parse(jsonstring)
        // var pmtinfarray = [];
        // for (var i = 0; i < jsondata.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.length; i++) {
        //     var myob = { EndToEndId: "", Amt: "", CrdtId: "", DbtId: "", CreDt: "", Ack: "ACCP", Scroll: "RETURN" };
        //     // var myob = { OrgnlEndToEndId: "", GrpSts: "ACCEPTED" };
        //     myob.EndToEndId = jsondata.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].PmtId.EndToEndId;
        //     myob.Amt = jsondata.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].Amt.InstdAmt.Amt;
        //     myob.CrdtId = jsondata.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].CdtrAcct.Id.Othr.Id;
        //     myob.DbtId = jsondata.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
        //     myob.CreDt = jsondata.RequestPayload.AppHdr.CreDt;
        //     // myob.OrgnlEndToEndId= jsondata.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].PmtId.EndToEndId;

        //     // console.log("myobj",myob)
        //     pmtinfarray.push(myob);
        // }
        // var result = await contract.submitTransaction('saveDetailsToLedger',JSON.stringify(pmtinfarray))
        // console.log(`result is: ${result}`);
        // date = new Date();
        // console.log("End time >> ",date.getHours()+" "+date.getMinutes()+":"+date.getSeconds())
        // var block1 = await channel.queryBlock(0);
        // var block3 = await channel.queryBlock(2);
        var bcinfo = await channel.queryInfo();
        console.log(bcinfo)
        var blockitem = await channel.queryBlock(bcinfo.currentBlockHash);
        var prevblockitem = await channel.queryBlockByHash(bcinfo.previousBlockHash)
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
        // console.log( blockitem.data)
        // console.log('\n------\n')
        // // working withdataset for block7
        // for(var i=0;i<block3.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset.length;i++){
        //     console.log(block3.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[i].rwset.writes)
        // }
        // working withdataset for block8
        // console.log( block3.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes)
        console.log(blockitem.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes)
        // console.log('\n------\n')
        await gateway.disconnect()
    } catch (error) {
        console.log(`\n======================================\n Failed to evaluate transaction: ${error.message}`);
        process.exit(1);
    }
}


main();
