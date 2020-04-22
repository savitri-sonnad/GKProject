/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const xmljson = require('xml2json')
const fileparser =  require('./src/FileParser')

const ccpPath = path.resolve(__dirname, '..', 'network-config', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function ackFileProcessing() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
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
        var file =fs.readFileSync('/data/RBI/Unprocessed_files/ACK/ACKEP011000000000000020170318029291.XML.consumed',{ object: false })
        console.log(file)
        // var filestring = await fileparser.FileParser('ACKEP011000000000000020160829012063.XML.consumed');
        var filestring = xmljson.toJson(file);
        var jsondata = JSON.parse(filestring)
        var pmtinfarray=[];
        if(Object.values(jsondata).length == 0){
            console.log("Empty ACK File")
            destinationpath+=`ACK_Failed/${filename}`
            return {err:'',file : filename, path: destinationpath}
        }
        else if(Array.isArray(jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts)){
            for (var i = 0; i < jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts.length; i++) {
                var pmtob = { OrgnlEndToEndId: "", GrpSts: "" };
                pmtob.OrgnlEndToEndId = jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts[i].OrgnlEndToEndId;
                pmtob.GrpSts = jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlGrpInfAndSts.GrpSts;
                pmtinfarray.push(pmtob);
            }
        }
        else{
            var pmtob = { 
                OrgnlEndToEndId: jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlPmtInfAndSts.TxInfAndSts.OrgnlEndToEndId,
                GrpSts: jsondata.RequestPayload.Document.CstmrPmtStsRpt.OrgnlGrpInfAndSts.GrpSts
            }
                pmtinfarray.push(pmtob);
        }
        var ackupdate = await contract.submitTransaction('saveAckDetailsToLedger',JSON.stringify(pmtinfarray)).catch((e)=>{console.log('ledger error',e)})
        if(ackupdate.toString() == "true" )
            console.log("Acknowledgement File processed")
        else
            console.log("Acknowledgement File failed to process.")
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

ackFileProcessing();
