const fs = require('fs');
const fileparser = require('xml2json');
//const ipfsclient = require('./ipfs')

async function main() {
  var i = 0;
  var date = new Date();
  console.log(`Start Time: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
  var dir = '/data/RBI/Unprocessed_files/DN/';
  var fd ='20150224';
  var filearray = [];
  // fs.readdirSync(dir).forEach(file=>{
  //   if (file.substr(0,5) == "EP011") {
  //     i = i + 1;
  //     var filenameprop = file.split('.')
  //     var filedate = filenameprop[0].substr(18,8)
  //     if(fd==''){
  //       console.log('from if')
  //       fd= filedate
  //       filearray.push(file);
  //       console.log('fd'+fd)
  //     }
  //     else if(fd == filedate){
  //       console.log('from else if')
  //       filearray.push(file)
  //     }
  //     else{
  //       return true;
  //     }
  //   }
  // })
  // console.log(filearray)
  // var files= fs.readdirSync(dir);
  // for(var i=0;i<10;i++){
  //   console.log(files[i])
  // }
  fs.readdirSync(dir).forEach((file) => {
        var filenameprop = file.split('.')
        var filedate = filenameprop[0].substr(18,8)
        // console.log('Filename = ' + filenameprop[0] + " length = " + filenameprop[0].length)
        console.log(filedate)
        if (filenameprop[0].length != 32 && i<2) {
          console.log('Length changed')
          process.exit(1);
        }
        console.log(++i)
    })
  
  // fs.renameSync('../dbtestdata/file1.txt','../sourcedir/file1.txt',(err)=>{
  //   if(err)console.log('Could not move file')
  // })

  date = new Date();
  console.log(`End Time: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)

  //var a = fileparser.toJson(file, {object:true});

  //     var creditdate= a.RequestPayload.AppHdr.CreDt;
  //     for (var i=0;i<a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.length;i++){
  //         var myob={EndtoEndId:"",Amt:"",CrdtId:"",DbtId:"",CreDt:""};
  //         myob.EndtoEndId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].PmtId.EndToEndId;
  //         myob.Amt = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].Amt.InstdAmt.Amt;
  //         myob.CrdtId = a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf[i].CdtrAcct.Id.Othr.Id;
  //         myob.DbtId =  a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  //         myob.CreDt = creditdate;
  //         pmtinfarray.push(myob);
  //     }

  //     for (var j=0;j<a.RequestPayload.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.length;j++){
  //         console.log("Row"+j+" :: EndtoEndid="+pmtinfarray[j].EndtoEndId+" :: Amt="+pmtinfarray[j].Amt+" :: CreditId="+pmtinfarray[j].CrdtId+" :: DebitId="+pmtinfarray[j].DbtId+"::Date="+pmtinfarray[j].CreDt);
  //     }

  //     var isuniquefile = await ipfsclient.checkUniqueFile(a)
  //     if(isuniquefile){
  //         var addtoipfs = await ipfsclient.addFiletoIPFS(a)
  //         console.log(addtoipfs)
  //     }
} main().catch((e) => { console.log(e) });