
const router = require('express').Router();
const url = require('url');

// read the contents of the initial file address
// for each directory, if it's a directory search
// the directory. If it's a file, check if the file
// name is the same as the file we're looking for.
search = (path, file) => {
    const fs = require('fs');
    let localFiles = fs.readdirSync(path);

    for(let dir of localFiles) {
        let fileData = fs.lstatSync(`${path}/${dir}`);
        if(fileData.isDirectory()) {
            let possibleMatch = search(`${path}/${dir}`, file);
            if(possibleMatch !== null) {
                return possibleMatch;
            }
        } else if(fileData.isFile()) {
            if(dir === file) {
                return fs.readFileSync(`${path}/${dir}`, 'utf-8');
            }
        }
    }

    return null;
}

// list all files in a path and it's subpaths
list = (path, regex=undefined, files=[]) => {
    const fs = require('fs');
    let localFiles = fs.readdirSync(path);

    for(let dir of localFiles) {
        let fileData = fs.lstatSync(`${path}/${dir}`);

        if(fileData.isDirectory()) {
            list(`${path}/${dir}`, regex, files);
        } else if(fileData.isFile()) {
            if(regex === undefined) {
                files.push(dir);
            } else if(regex.test(dir)) {
                files.push(dir);
            }
        }
    }

    return files;
}

// function to return a blacklist
// files that cannot be looked at
// from the browser by any means
function getBlackList() {
    return list('./files/secret');
}

// @GET    gets file in server
// @DESC   uses the file param to find the file
// @ACCESS public
router.get('/', (req, res) => {
    const query = url.parse(req.url, true).query;
    const file = query['file'];
    const path = './files/public';
    
    // if the file is secret, return forbidden
    if(getBlackList().includes(file)) {
        return res.sendStatus(403);
    }

    if(typeof(file) === 'undefined') {
        return res.sendStatus(200);
    }

    if(typeof(file) !== 'string') {
        return res.sendStatus(500);
    }

    let contents = search(path, file);

    if(contents) {
        return res.send(contents);
    }

    return res.sendStatus(404);
});

// @GET    lists files in the server using regex
// @DESC   searches through files to list all
// @ACCESS public
router.get('/list', (req, res) => {
    const query = url.parse(req.url, true).query;
    const filter = query['filter'];
    const path = './files/public';
    let requireCalled = false;

    function require() {
        requireCalled = true;
        return res.send("don't you fucking dare");
    }
    
    if(typeof(filter) !== 'string') {
        let files = list(path);
        return res.send(files.join(', '));
    }

    // intentionally broken regex
    try {
        let regex = eval(`(/${filter}/)`);

        if(requireCalled) {
            return;
        }

        if(!(regex instanceof RegExp)) {
            return res.sendStatus(500);
        }

        let files = list(path, regex);
        return res.send(files.join(', '));
    }
    catch(err) {
        console.log(err);
        if(!res.headersSent) {
            return res.sendStatus(500);
        }
        return;
    }
})

module.exports = router;