
const fs = require('fs');
const axios = require('axios');
var startdate = '20150201';
var enddate = '20190401'
async function sendFiles(date) {
    var epdir = '/data/RBI/Unprocessed_files/EP';
    var ackdir = '/data/RBI/Unprocessed_files/ACK'
    var epayfileslist = fs.readdirSync(epdir);
    var ackfileslist = fs.readdirSync(ackdir);
    for (var i = 0; i < epayfileslist.length; i++) {
        var filearray = [];
        var filenameprop = epayfileslist[i].split('.')
        var filedate = filenameprop[0].substr(18, 8)
        if (date == filedate) {
            console.log("starting sendFiles = "+epayfileslist[i])
            filearray.push(epayfileslist[i])
            var axiosConfig = {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                }
            }
            var result = await axios.post('http://10.25.2.2:7077/processFiles', {
                files: filearray
            }, axiosConfig)
            console.log(result.data)
            await moveFiles(result.data).catch((e) => {
                console.log(e)
                process.exit(1);
            })           
            if(result.data[0].status == 'passed'){
                var ackarray=[]
                var f = result.data[0].file;
                var fn= f.split('.')
                var ack = 'ACK' + fn[0];
                for (var j = 0; j < ackfileslist.length; j++) {
                    var ackprop = ackfileslist[j].split('.')
                    if (ack == ackprop[0]) {
                        ackarray.push(ackfileslist[j])
                        var axiosConfig = {
                            headers: {
                                'Content-Type': 'application/json;charset=UTF-8'
                            }
                        }
                        console.log(ackarray)
                        var ackresult = await axios.post('http://10.25.2.2:7077/processFiles', {
                            files: ackarray
                        }, axiosConfig)
                        await moveFiles(ackresult.data).catch((e) => {
                            console.log(e)
                            process.exit(1);
                        })           
                        break;
                    }
                }
            }
            else{
                var ack = 'ACK' + filenameprop[0];
                for (var j = 0; j < ackfileslist.length; j++) {
                    var ackprop = ackfileslist[j].split('.')
                    if (ack == ackprop[0]) {
                        fs.renameSync('/data/RBI/Unprocessed_files/ACK/'+ackfileslist[j], '/data/RBI/Processed_files/ACK_EP_Failed/'+ackfileslist[j], (err) => {
                            if (err) console.log('Could not move file')
                        })
                        break;                
                    }
                }
            }
        }
        else if (date < filedate) {
            return true
        }
    }
}
async function sendScrollFiles(date) {
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
    return false // No more files. return false to change date
}
async function moveFiles(filelist) {
    for (var i = 0; i < filelist.length; i++) {
        var sourcepath = `/data/RBI/Unprocessed_files/`
        var filepath = filelist[i].path
        var fileprops = filelist[i].file.split('.');
        console.log(filelist[i].file)
        if (filelist[i].file[0] == 'A')
            sourcepath += `ACK/` + filelist[i].file;
        else if (filelist[i].file[0] == 'D')
            sourcepath += `DN/` + filelist[i].file;
        else if( filelist[i].file[0] == 'E')
            sourcepath += `EP/` + filelist[i].file;
        else
            console.log('Incorect Path')

        var destinationpath = filepath
        fs.renameSync(sourcepath, destinationpath, (err) => {
            if (err) console.log('Could not move file')
        })
        console.log(sourcepath + "\n" + destinationpath)
    }
}
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
async function start(startfilestr,i) {
    var filestr = startfilestr;
    a = await sendFiles(filestr).catch((e) => {
        console.log(e)
        process.exit(1);
    });
    b = await sendScrollFiles(filestr).catch((e) => {
        console.log(e)
    })
    var year = parseInt(filestr.substr(0, 4));
    var month = parseInt(filestr.substr(4, 2))
    var day = parseInt(filestr.substr(6, 2))
    filestr = getNextDateStr(year, month, day)
    console.log(filestr)
    if (filestr != enddate) {
        start(filestr,i+1)
    }
    else {
        process.exit(1)
    }
}
var beginfilestr = getNextDateStr(2017, 03, 17)
start(beginfilestr,0).catch((e) => {
    console.log(e)
    process.exit(1)
});