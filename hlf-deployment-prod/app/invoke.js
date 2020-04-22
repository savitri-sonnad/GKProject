'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const ccpPath = path.resolve(__dirname,'..','network-config' ,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath,'utf-8')
const ccp = JSON.parse(ccpJSON)

async function main() {
    try {
        console.log(ccp)
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        var objarray = [
            {EndToEndId:"EP100025",Amt:'21012.00',CrdtId:"SBI00001",DbtId:"ICICI00001",CreDt:"20-8-19",Ack:"ACCP",Scroll:"SETTLED"},
            
        ]
        var data =JSON.stringify(objarray);
        console.log('data = ', data)
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('admin');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // var chr = 
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'admin' ,discovery: {enabled: false}});

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('mycc');

        // Submit the specified transaction.
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        
        var result = await contract.submitTransaction('saveDetailsToLedger', data);
        console.log('Transaction has been submitted\n Result::',JSON.parse(result));
        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();