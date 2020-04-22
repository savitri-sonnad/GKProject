const fs = require('fs');
const path = require('path');
const xml2json = require('xml2json')
const mysql = require('mysql')
const gkdbconn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Discodancer@1",
    database: "EPaymentFileDetails"
});
const gkdbconn1 = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Discodancer@1",
    database: "EPaymentFileDetails"
});

async function main() {
    //for(var x=0;x < 9;x++){
    var begintime = new Date();
    console.log(`Begin time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)
    //var file_name='EP01100000000000002019032910274'+x+'.xml'
    //console.log(file_name)  
    //var filedata = fs.readFileSync('/data/RBI/PY004/request_consumed/'+file_name, 'utf8')
    var filedata = fs.readFileSync(`/data/RBI/Processed_files/EP_Failed/EP011000000000000020170428033564.xml`)
    var a = xml2json.toJson(filedata, { object: true })
    console.log(a.RequestPayload.AppHdr.BizMsgIdr)
    var pmtinfarray = [];
    if (Object.values(a).length == 0) {
        destinationpath += `Empty_EP/${filename}`
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
    console.log('Total items = ' + pmtinfarray.length)
    // var result = await allValidations(pmtinfarray).catch((err) => {
    //   console.log("DB error \n" + err)
    // })
    // console.log(result);
    await gkdbconn.query(`SELECT * FROM EPaymentFileDetails.PAYMENT_MISMATCH where endtoendid="E572E100417003614";`, function (err, res) {
        var pmt_amt_file = res[0].pmt_amt_file;
        var pmt_amt_db = res[0].pmt_amt_db;
        var net_amt = res[0].net_amt;
        await gkdbconn1.query(`SELECT * FROM EPaymentFileDetails.PAYMENT_MISMATCH where endtoendid="E572E100417003614";`, function (err, res) {
            console.log('gkdbconn1')
            var pmt_amt_file = res[0].pmt_amt_file;
            var pmt_amt_db = res[0].pmt_amt_db;
            var net_amt = res[0].net_amt;
            if (parseFloat(pmt_amt_file).toFixed(2) != parseFloat(pmt_amt_db).toFixed(2)) {
                console.log('diffrent amt')
            }
            else if (pmt_amt_file != net_amt) {
                console.log('net_amt is different')
            }
            else {
                console.log('all ok')
            }
            gkdbconn1.end();
        })
        console.log('gkdbconn')
        if (parseFloat(pmt_amt_file).toFixed(2) != parseFloat(pmt_amt_db).toFixed(2)) {
            console.log('diffrent amt')
        }
        else if (pmt_amt_file != net_amt) {
            console.log('net_amt is different')
        }
        else {
            console.log('all ok')
        }
        // gkdbcon.end();
    })
    begintime = new Date();
    console.log(`End time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)
    //  }
    //c8onsole.log('i= '+x)
}
main();




