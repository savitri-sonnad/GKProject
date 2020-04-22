
const fs = require('fs');
const fileparser = require('xml2json');

async function FileParser(filename) {
    return new Promise((resolve, reject) => {
        var convertoptions = { object: false }
        var filepath = `/data/RBI/Unprocessed_files/`
        if (filename[0] == 'A')
            filepath += `ACK/` + filename;
        else if (filename[0] == 'D')
            filepath += `DN/` + filename;
        else
            filepath += `EP/` + filename;
        fs.readFile(filepath, (err, file) => {
            if (err) {
                reject("File error" + err)
            }
            else {
                try {
                    var jsondata = fileparser.toJson(file, convertoptions);
                    resolve(jsondata);
                } catch (fileerror) {
                    console.log("File error", fileerror)
                }
            }
        });
    })
}
exports.FileParser = FileParser;