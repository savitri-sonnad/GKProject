/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const xmljson = require('xml2json')
const fileparser =  require('./src/FileParser')

const ccpPath = path.resolve(__dirname, '..', '..', 'basic-network', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main() {
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
        // var file =fs.readFileSync('./files/ACKEP011000000000000020190114088026.XML')
        var filestring = await fileparser.FileParser('DN011000151510111920190207P00001.XML');
        var a = JSON.parse(filestring)
        var pmtinfarray = [];

        for (var i = 0; i < a.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry.length; i++) {
            var myob = { EndToEndId: "", Prtry: "" };
            myob.EndToEndId =  a.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry[i].NtryDtls.TxDtls.Refs.EndToEndId;
            myob.Prtry =  a.RequestPayload.Document.BkToCstmrDbtCdtNtfctn.Ntfctn.Ntry[i].BkTxCd.Prtry;
            pmtinfarray.push(myob);
        }
        var ackupdate = await contract.submitTransaction('saveScrollDetailsToLedger',JSON.stringify(pmtinfarray)).catch((e)=>{console.log('ledger error',e)})
        if(ackupdate.toString() == "true" )
            console.log("Scroll File processed")
        else
            console.log("Scroll File failed to process.")
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
