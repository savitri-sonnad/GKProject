const fs = require('fs');
const axios = require('axios');

var enddate = '20190331'

function getNextDateStr(year, month, day) {
    // month should be 1 less than month number because month is stored as array
    var startdate = new Date(year, month - 1, day)
    var nextdate = startdate;
    nextdate.setDate(nextdate.getDate() + 1);
    var datestr = nextdate.getFullYear().toString()
    datestr += (nextdate.getMonth() + 1) < 10 ? '0' + (nextdate.getMonth() + 1).toString() : (nextdate.getMonth() + 1).toString()
    datestr += nextdate.getDate() < 10 ? '0' + nextdate.getDate().toString() : nextdate.getDate().toString();
    return datestr;
}


async function sendScrollFiles(date) {
    var tdate = new Date();
    console.log("Begin time >> ", tdate.getHours() + " " + tdate.getMinutes() + ":" + tdate.getSeconds())
    var dndir = '/data/RBI/Unprocessed_files/DN'
    var fd = date;
    var filesinday = 0;
    var dnfilelist = fs.readdirSync(dndir);
    var filearray = [];
    for (var i = 0; i < dnfilelist.length; i++) {
        var filenameprop = dnfilelist[i].split('.')
        var filedate = filenameprop[0].substr(18, 8)
        if (fd == filedate) {
            filesinday++;
            filearray.push(dnfilelist[i])            
        }
    }
    var axiosConfig = {
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    }
    var result = await axios.post('http://10.25.2.2:7077/processFiles', {
        files: filearray
    }, axiosConfig).catch((e)=>{console.log('axios error');process.exit(1)})
    console.log(result.data)
    await moveFiles(result.data, date).catch((e) => {
        console.log("Scrollerror\n" + e)
        process.exit(1)
    })
    console.log(filearray)
    console.log('Files in a day = '+filesinday)
    tdate = new Date();
    console.log("End time >> ", tdate.getHours() + " " + tdate.getMinutes() + ":" + tdate.getSeconds())
    return false // No more files. return false to change date
}

async function start(startfilestr, i) {
    var filestr = startfilestr;
    b = await sendScrollFiles(filestr).catch((e) => {
        console.log(e)
    })
    var year = parseInt(filestr.substr(0, 4));
    var month = parseInt(filestr.substr(4, 2))
    var day = parseInt(filestr.substr(6, 2))
    filestr = getNextDateStr(year, month, day)
    console.log(filestr)
    if (filestr != enddate) {
        start(filestr, i + 1)
    }
    else {
        process.exit(1)
    }
}
var beginfilestr = getNextDateStr(2017, 3, 1 )
start(beginfilestr, 0).catch((e) => {
    process.exit(1)
    console.log(e)
});