const fs = require('fs');
const path = require('path');
var ibmdb2 = require('ibm_db2');
const xml2json = require('xml2json')
const tdb = require('./src/dbconfig')
const ipfsclient = require('./src/UniqueFileCheck')
const fileparser = require('./src/FileParser')
const gkdbcon1 = require('./src/gkdbconfig')

async function dbArray(query) {
  return new Promise((resolve, reject) => {

    tdb.query(query, function (err) {
      if (err) throw err;
      tdb.query(query, function (err, result) {
        if (err) throw err;
        resolve(result)
      });
    });
  });
}
async function Unique_id_in_file(jsondata, filename) {
  for (var i = 0; i < jsondata.length; i++) {
    var count91 = 0;
    for (var j = 1; j < jsondata.length; j++) {
      if (i != j && jsondata[i].EndToEndId == jsondata[j].EndToEndId) {
        count91++;
      }
    }
    if (count91 > 0) {
      var failquery = `INSERT INTO EPaymentFileDetails.duplicate_id_same_file(filename,endtoendid,count)
                    VALUES
                    (
                    "${filename}",
                    "${jsondata[i].EndToEndId}",
                    "${count91}");`
      // gkdbcon1.query(failquery, function (err, result) {
      //   if (err) {
      //     console.log('Duplicate ID in same file', err)
      //   }
      //   console.log("Duplicate ID in same file" + result)
      // });
      console.log("Duplicate EndtoEnd in same file: " + jsondata[i].EndToEndId);
      console.log("Number of times it got repeated : " + count91)
      return { validationresult: false, failurereason: 'Duplicate id same file', paymentid: jsondata[i] };
    }
  }
  return { validationresult: true, failurereason: '' };
}
async function requirement3(jsondata, filename) {
  var query = `select * from kifms.BILL_APP_STATUS_GATE_VW where PAYMENT_ID in('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`
  var validation3array = await dbArray(query);
  console.log(jsondata)
  console.log(validation3array)
  for (var i = 0; i < jsondata.length; i++) {
    for (var j = 0; j < validation3array.length; j++) {
      if (validation3array[j].PAYMENT_ID == jsondata[i].EndToEndId) {
        if (validation3array[j].VOUCHER_NO == null || validation3array[j].VOUCHER_NO == 0 || validation3array[j].VOUCHER_NO == 'null' || validation3array[j].VOUCHER_NO == '' || validation3array[j].VOUCHER_NO == undefined) {
          var failquery = `INSERT INTO EPaymentFileDetails.VOUCHER_NUMBER_IS_NULL(FILE_NAME,PAYMENT_ID,VOUCHER_NO)
                    VALUES
                    (
                    "${filename}",
                    "${jsondata[i].EndToEndId}",
                    "${validation3array[j].VOUCHER_NO}");`
          // gkdbcon1.query(failquery, function (err, result) {
          //   if (err) {
          //     console.log('VOUCHER_NUMBER_IS_NULL ERROR', err)
          //   }
          //   console.log("VOUCHER_NUMBER_IS_NULL db result" + result)
          // });
          console.log("EndToEndID : " + jsondata[i].EndToEndId)
          console.log("Voucher Number in DB : " + validation3array[j].VOUCHER_NO)
          return { validationresult: false, failurereason: 'Bill not approved: Voucher number is null.', paymentid: validation3array[j].PAYMENT_ID };
        }
      }
    }
  }
  return { 'validationresult': true, failurereason: '' };
}

async function requirement4(jsondata, filename) {
  var begintime = new Date();
  console.log(`Begin time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)

  var query = `select distinct * from kifms.PAYMENT_AMOUNT_GATE_VW where PAYMENT_ID in ('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`

  var validation4array = await dbArray(query);
  var amt101;
  var billarray=[];
  var amountarray=[];
  console.log(query)
  billarray.push(validation4array[0].BL_ID)
  amountarray.push(0);
  for(var j=0;j<validation4array.length;j++){
    if(billarray.indexOf(validation4array[j].BL_ID)<0){
      billarray.push(validation4array[j].BL_ID)
      amountarray.push(0);
    }
  }
  for(var i=0; i<jsondata.length;i++){
    for(var  j=0;j<validation4array.length;j++){
      if(jsondata[i].EndToEndId == validation4array[j].PAYMENT_ID){
        var billindex= billarray.indexOf(validation4array[j].BL_ID);
        if(jsondata[i].Amt != validation4array[j].PMNT_AMNT){
          console.log('Payment Mismatch')
        }
        else{
          var amt = amountarray[billindex];
          amt+= parseFloat(jsondata[i].Amt);
          if(amt > validation4array[j].NET_AMT){
            console.log('Amount Greater')
          }else{
            amountarray[billindex] = amt
          }
        }
      }
    }
  }

  // for (var i = 0; i < jsondata.length; i++) {
  //   for (var j = 0; j < validation4array.length; j++) {
  //     amt101 = 0;
  //     if (jsondata[i].EndToEndId == validation4array[j].PAYMENT_ID) {
  //       bill = validation4array[j].BL_ID;
  //       if (parseFloat(jsondata[i].Amt).toFixed(2) != parseFloat(validation4array[j].PMNT_AMNT).toFixed(2)) {
  //         console.log("EndToEndID : " + jsondata[i].EndToEndId)
  //         console.log("Amount in file : " + jsondata[i].Amt)
  //         console.log("Amount in DB : " + validation4array[j].PMNT_AMNT)
  //         var failquery = `INSERT INTO EPaymentFileDetails.PAYMENT_MISMATCH
  //             (
  //             filename,
  //             endtoendid,
  //             bill_id,
  //             pmt_amt_file,
  //             pmt_amt_db,
  //             net_amt,reason)
  //             VALUES
  //             ('${FILENAME}','${jsondata[i].EndToEndId}','${bill}','${jsondata[i].Amt}','${validation4array[j].PMNT_AMNT}','${validation4array[j].NET_AMT}',
  //             'Payment Amount Mismatch');`
  //         // gkdbcon1.query(failquery, function (err, result) {
  //         //   if (err) {
  //         //     console.log('PAYMENT_MISMATCH DB ERROR \n', err)
  //         //   }
  //         //   console.log("PAYMENT_MISMATCH db result " + result)
  //         // });
  //         return { 'validationresult': false, failurereason: 'Payment amount greater than total bill amount.', 'paymentid': jsondata[i].EndToEndId };
  //       }
  //       for (var zx = 0; zx < validation4array.length; zx++) {
  //         if (bill == validation4array[zx].BL_ID) {
  //           for (var xz = 0; xz < jsondata.length; xz++) {
  //             if (validation4array[zx].PAYMENT_ID == jsondata[xz].EndToEndId) {
  //               amt101 = +amt101 + +jsondata[xz].Amt;
  //               // console.log("amount is :  "+amt101)
  //             }
  //           }
  //         }
  //       }
  //       //   console.log("Total amount:  "+amt101)
  //       //   console.log(validation4array[j].NET_AMT)
  //       if (amt101 > validation4array[j].NET_AMT) {
  //         console.log("EndtoEndID : " + jsondata[i].EndToEndId)
  //         console.log("Amount sum from file : " + amt101)
  //         console.log("Net Amount in DB : " + validation4array[j].NET_AMT)
  //         var failquery = `INSERT INTO EPaymentFileDetails.PAYMENT_MISMATCH
  //             (
  //             filename,
  //             endtoendid,
  //             bill_id,
  //             pmt_amt_file,
  //             pmt_amt_db,
  //             net_amt,reason)
  //             VALUES
  //             ('${filename}','${jsondata[i].EndToEndId}','${bill}','${jsondata[i].Amt}','${validation4array[j].PMNT_AMNT}','${validation4array[j].NET_AMT}',
  //             'Payment amount greater than total bill amount');`
  //         // gkdbcon1.query(failquery, function (err, result) {
  //         //   if (err) {
  //         //     console.log('PAYMENT_MISMATCH DB ERROR \n', err)
  //         //   }
  //         //   console.log("PAYMENT_MISMATCH db result " + result)
  //         // });
  //         begintime = new Date();
  //         console.log(`End time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)
  //         return { 'validationresult': false, failurereason: 'Payment amount greater than total bill amount.', 'paymentid': jsondata[i].EndToEndId };
  //       }
  //     }
  //   }
  // }
  begintime = new Date();
  console.log(`End time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)
  return { 'validationresult': true, failurereason: '' };
}

async function requirement5(jsondata, filename) {
  var query = `select * from kifms.BL_APP_TRY_ACCNO_GATE_VW where PAYMENT_ID in('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`
  var validation5array = await dbArray(query);
  for (var ab = 0; ab < jsondata.length; ab++) {
    for (var ac = 0; ac < validation5array.length; ac++) {
      if (jsondata[ab].EndToEndId == validation5array[ac].PAYMENT_ID) {
        if (validation5array[ac].DDO_CODE == 0 || validation5array[ac].DDO_CODE == null || validation5array[ac].DDO_CODE == '' || validation5array[ac].OFFICE_SYSCD == 0 || validation5array[ac].OFFICE_SYSCD == null || validation5array[ac].OFFICE_SYSCD == '') {
          var failquery = `INSERT INTO EPaymentFileDetails.BILL_NOT_APPROVED
                    (
                    FILE_NAME,
                    PAYMENT_ID,
                    DDO_CODE,
                    OFFICE_SYSCD)
                    VALUES
                    ('${filename}','${jsondata[i].EndToEndId}','${validation5array[ac].DDO_CODE}','${validation5array[ac].OFFICE_SYSCD}');`
          // gkdbcon1.query(failquery, function (err, result) {
          //   if (err) {
          //     console.log('BILL_NOT_APPROVED DB ERROR \n', err)
          //   }
          //   console.log(result)
          // });
          console.log("EndToEndID : " + jsondata[ab].EndToEndId)
          console.log("DDO CODE in DB : " + validation5array[ac].DDO_CODE)
          console.log("OFFICE SYSCODE in DB : " + validation5array[ac].OFFICE_SYSCD)
          return { 'validationresult': false, failurereason: 'Bill not approved by treasury officer.', 'paymentid': jsondata[ab].EndToEndId };
        }
      }
    }
  }
  return { 'validationresult': true, failurereason: '' };
}

async function requirement6(jsondata, filename) {
  var query = `select * from kifms.BNF_ACCNO_GATE_VW where PAYMENT_ID in('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`
  var validation6array = await dbArray(query);
  for (var ab = 0; ab < jsondata.length; ab++) {
    for (var ac = 0; ac < validation6array.length; ac++) {
      if (jsondata[ab].EndToEndId == validation6array[ac].PAYMENT_ID) {
        var temp1 = jsondata[ab].CrdtId
        temp1 = temp1.trim();
        var temp2 = validation6array[ac].RCPNT_ACC_NO
        temp2 = temp2.trim();
        if (temp1 != temp2) {
          var failquery = `INSERT INTO EPaymentFileDetails.BENEFICIARY_ACC_NO
                    (
                    FILE_NAME,
                    PAYMENT_ID,
                    RCPNT_ACC_NO,
                    ACC_NO_IN_FILE)
                    VALUES
                    ('${filename}','${jsondata[ab].EndToEndId}','${temp2}','${temp1}');
                    `
        //   gkdbcon1.query(failquery, function (err, result) {
        //     if (err) {
        //       console.log('BENEFICIARY_ACC_NO DB ERROR \n', err)
        //     }
        //     console.log("BENEFICIARY_ACC_NO db result " + result)
        //   });
        //   console.log(" EndToEndID : " + jsondata[ab].EndToEndId)
        //   console.log("Account number in File : " + jsondata[ab].CrdtId)
        //   console.log("Account number in DB : " + validation6array[ac].RCPNT_ACC_NO)
        //   return { 'validationresult': false, failurereason: 'Beneficiary Account Number mismatch.', 'paymentid': jsondata[ab].EndToEndId };
        }
      }
    }
  }
  return { 'validationresult': true, failurereason: '' };
}

async function requirement7(jsondata, filename) {
  var query = `select * from kifms.SANCTION_ORDERNO_GATE_VW where PAYMENT_ID in('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`
  var validation7array = await dbArray(query);
  for (var ab = 0; ab < jsondata.length; ab++) {
    for (var ac = 0; ac < validation7array.length; ac++) {
      if (jsondata[ab].EndToEndId == validation7array[ac].PAYMENT_ID) {
        if (validation7array[ac].SANCTION_ORDER_NO == 0 || validation7array[ac].SANCTION_ORDER_NO == null || validation7array[ac].SANCTION_ORDER_NO == '') {
          var failquery = `INSERT INTO EPaymentFileDetails.SANCTION_ORDER
                    (FILE_NAME,
                    PAYMENT_ID,
                    SANCTION_ORDER_NO)
                    VALUES
                    ('${filename}','${jsondata[ab].EndToEndId}','${validation7array[ac].SANCTION_ORDER_NO}');`
        //   gkdbcon1.query(failquery, function (err, result) {
        //     if (err) {
        //       console.log('SANCTION_ORDER DB ERROR \n', err)
        //     }
        //     console.log("SANCTION_ORDER db result " + result)
        //   });
        //   console.log(" EndtoEndID which got failed : " + jsondata[ab].EndToEndId)
        //   console.log("Sanction Order : " + validation7array[ac].SANCTION_ORDER_NO)
        //   return { 'validationresult': false, failurereason: 'Sanction Order not associated with bill.', 'paymentid': jsondata[ab].EndToEndId };
        }
      }
    }
  }
  return { 'validationresult': true, failurereason: '' };
}

async function requirement8(jsondata, filename) {
  var query = `select * from kifms.VOUCHER_DATE_GATE_VW where PAYMENT_ID in('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`
  var validation8array = await dbArray(query);
  // var count9 =0;
  var ab = 0;
  for (ab = 0; ab < jsondata.length; ab++) {
    for (var ac = 0; ac < validation8array.length; ac++) {
      if (jsondata[ab].EndToEndId == validation8array[ac].PAYMENT_ID) {
        var date9 = jsondata[ab].CreDt;
        var date10 = new Date(date9)
        //console.log(date10)
        var voucher_date1 = new Date(validation8array[ac].VOUCHER_DATE);
        //console.log("voucher_date1 "+voucher_date1);
        var diffMs = (date10 - voucher_date1); // milliseconds between now & voucher_date1
        //console.log("diffMs "+diffMs);
        var diffDays = Math.floor(diffMs / 86400000); // days
        //console.log("diffDays "+diffDays);
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        //               console.log("diffHrs "+diffHrs);
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        //console.log("diffMins "+diffMins);

        var diffsec = Math.round(((diffMs % 86400000) % 3600000) / 3600000); // seconds
        //console.log("diffsec "+diffsec);

        //console.log(diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes " + diffsec+ " diffsec");

        if (diffDays > 7) {
          //console.log("greater than 24 hours")
          var failquery = `INSERT INTO EPaymentFileDetails.VOUCHER_DATE
                    (
                    FILE_NAME,
                    PAYMENT_ID,
                    VOUCHER_DATE,
                    FILE_CREATION_DATE)
                    VALUES
                    ('${filename}','${jsondata[ab].EndToEndId}','${voucher_date1}','${date10}');`
          // gkdbcon1.query(failquery, function (err, result) {
          //   if (err) {
          //     console.log('VOUCHER_DATE DB ERROR \n', err)
          //   }
          //   console.log('VOUCHER_DATE result = '+result)
          // });
          console.log(" EndtoEndID : " + jsondata[ab].EndToEndId)
          console.log(" VoucherDate from DB : " + voucher_date1)
          console.log("File Creation Date : " + date10)
          return { 'validationresult': false, failurereason: 'Bill not approved within 7 Days.', 'paymentid': jsondata[ab].EndToEndId };
        }
      }
    }
  }
  //console.log(ab)
  return { 'validationresult': true, failurereason: '' };
}

async function requirement9(jsondata, filename) {
  var query = `select * from kifms.BL_APP_TRY_ACCNO_GATE_VW where PAYMENT_ID in('`;
  query += `${jsondata[0].EndToEndId}'`
  for (var i = 1; i < jsondata.length; i++) {
    query += `,'${jsondata[i].EndToEndId}'`
  }
  query += `);`
  var validation9array = await dbArray(query);
  for (var ab = 0; ab < jsondata.length; ab++) {
    for (var ac = 0; ac < validation9array.length; ac++) {
      if (jsondata[ab].EndToEndId == validation9array[ac].PAYMENT_ID) {
        if (parseInt(validation9array[ac].NEFT_PYMNT_ACCNT_NO) != parseInt(jsondata[ab].DbtId)) {
          var failquery = `INSERT INTO EPaymentFileDetails.TREASURY_ACCOUNT_NUMBER
                    (
                    FILE_NAME,
                    PAYMENT_ID,
                    NEFT_PYMNT_ACCNT_NO,
                    TREASURY_ACC_NO_IN_FILE)
                    
                    VALUES
                    ('${filename}','${jsondata[ab].EndToEndId}','${validation9array[ac].NEFT_PYMNT_ACCNT_NO}','${jsondata[ab].DbtId}');`
          // gkdbcon1.query(failquery, function (err, result) {
          //   if (err) {
          //     console.log('TREASURY_ACCOUNT_NUMBER DB ERROR \n', err)
          //   }
          //   console.log('TREASURY_ACCOUNT_NUMBER result = '+result)
          // });
          console.log("EndToEndID : " + jsondata[ab].EndToEndId)
          console.log('EndToEndId Index: ' + ab);
          console.log("Treasury account number from DB: " + validation9array[ac].NEFT_PYMNT_ACCNT_NO);
          console.log("Treasury account number from file: " + jsondata[ab].DbtId);
          return { 'validationresult': false, failurereason: 'Treasury account number mismatch.', 'paymentid': jsondata[ab].EndToEndId };
        }
      }
    }
  }
  return { 'validationresult': true, failurereason: '' };
}

async function allValidations(jsondata, filename) {
  var repeatedid = await Unique_id_in_file(jsondata, filename)
  if (repeatedid.validationresult == true) {
    console.log('No repeat EndToEndId in File')
    var validation3result = await requirement3(jsondata, filename)
    if (validation3result.validationresult == true) {
      console.log('Validation 3 success')
      var validation4result = await requirement4(jsondata, filename)
      if (validation4result.validationresult == true) {
        console.log('Validation 4 success')
        var validation5result = await requirement5(jsondata, filename)
        if (validation5result.validationresult == true) {
          console.log('Validation 5 success')
          var validation6result = await requirement6(jsondata, filename)
          if (validation6result.validationresult == true) {
            console.log('Validation 6 success')
            var validation7result = await requirement7(jsondata, filename)
            if (validation7result.validationresult == true) {
              console.log('Validation 7 success')
              var validation8result = await requirement8(jsondata, filename)
              if (validation8result.validationresult == true) {
                console.log('Validation 8 success')
                var validation9result = await requirement9(jsondata, filename)
                if (validation9result.validationresult == true) {
                  console.log('Validation 9 success')
                  return validation9result;
                } else {
                  return validation9result;
                }
              } else {
                return validation8result
              }
            } else {
              return validation7result
            }
          } else {
            return validation6result
          }
        } else {
          return validation5result
        }
      } else {
        return validation4result
      }
    } else {
      return validation3result
    }
  }
  else {
    return repeatedid
  }
}

async function main() {
  //for(var x=0;x < 9;x++){
  var begintime = new Date();
  console.log(`Begin time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)
  //var file_name='EP01100000000000002019032910274'+x+'.xml'
  //console.log(file_name)  
  //var filedata = fs.readFileSync('/data/RBI/PY004/request_consumed/'+file_name, 'utf8')
  //gkdbcon1.query(`SELECT * FROM EPaymentFileDetails.EPAYMENTFILE_RECORDS where reason = 'Sanction Order not associated with bill.'`,async function (err, res) {
    // for (var x = 0; x < res.length; x++) {
      var filedata = fs.readFileSync(`/data/RBI/Unprocessed_files/EP/EP011000000000000020180315059833.xml`)
      // console.log(res[x].FILE_NAME)
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
      var result = await allValidations(pmtinfarray,'EP011000000000000020180315059833.xml').catch((err) => {
        console.log("DB error \n" + err)
      })
      console.log(result)
    // }
    console.log('ENd')
  // })
  begintime = new Date();
  console.log(`End time: ${begintime.getHours()}-${begintime.getMinutes()}-${begintime.getSeconds()}`)
  //  }
  //c8onsole.log('i= '+x)
}
main();