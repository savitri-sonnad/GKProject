const fs = require('fs');
const path = require('path');
var ibmdb2 = require('ibm_db2');
const xml2json = require('xml2json')

async function getDBConnection(){
    ibmdb2.openSync("DATABASE=prodrepl;HOSTNAME=172.16.11.170;UID=gatekeeper1;PWD=Discodancer@5;PORT=51112;PROTOCOL=TCPIP")   
}
getDBConnection();