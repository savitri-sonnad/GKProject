var ibmdb2 = require('ibm_db2');

const connstring = "DATABASE=prodrepl;HOSTNAME=172.16.11.170;UID=gatekeeper;PWD=Discodancer@5;PORT=51112;PROTOCOL=TCPIP"
var treasurydbcon = ibmdb2.openSync(connstring)
module.exports = treasurydbcon;