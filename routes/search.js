var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');
var helper = require(__dirname + '/helpers/ipfsOriginHelper');
var fs = require('fs');
var archiver = require('archiver');
var async = require('async');

/* GET home page. */
router.get('/', function (req, res, next) {
    //todo: errors and searchresults
    res.render('search', {
        loggedin: req.session.loggedin,
        search: true,
        errors: req.session.errors,
        results: req.session.results
    });
    req.session.errors = null;
    req.session.results = null;
    /*    getDatasetData(req)
        getArticleData(req)*/
});

router.post('/handle', async function (req, res, next) {
    // console.log('reqbod: ')
    // console.log(req.body.searchtxt)
    if (req.body.selection == 0) {
        if (req.body.searchtxt == "") {
            req.session.results = await helper.addDatasetsToArticles(
                await getArticleData(req), await getDatasetData(req))

        } else {
            req.session.results = await helper.addDatasetsToArticles(
                await search(req.body.searchtxt, req, await getArticleData(req)), await getDatasetData(req));
        }
    } else if (req.body.selection == 1) {
        if (req.body.searchtxt == "") {
            req.session.results = await getDatasetData(req)
        } else {
            req.session.results = await search(req.body.searchtxt, req, await getDatasetData(req));
        }
    } else {
        var datasets = await getDatasetData(req);
        var articles = await helper.addDatasetsToArticles(await getArticleData(req), datasets)
        if (req.body.searchtxt == "") {
            req.session.results = (articles).concat(datasets);
        } else {
            req.session.results = await search(req.body.searchtxt, req, (articles).concat(datasets),
                [{name: '_id', weight: 0.1},
                    {name: 'abstract', weight: 0.1},
                    {name: 'tags', weight: 0.1},
                    {name: 'authors', weight: 0.6},
                    {name: 'metadata.originalName', weight: 0.1}])
        }
    }
    res.redirect('/search')
})

router.get('/download/:id/:name', async function (req, res, next) {
    const ipfs = req.app.get('ipfs');
    // console.log(req.body)
    const stream = await ipfs.files.catReadableStream(req.params.id)
    res.attachment(req.params.name)
    stream.pipe(res)
})

router.get('/downloadReviewFiles/:id', async function (req, res, next) {
    try {
        const orbitdb = req.app.get('orbit');
        const docdb = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
        await docdb.load()
        var docdbres = await docdb.get(req.params.id)
        docdb.close()

        if (docdbres[0] == null) return new Error('No article found to zip review files.')

        const ipfs = req.app.get('ipfs');
// console.log('before truncate')

        var zip = require("node-native-zip");
        var archive = new zip();

        async.forEachOf(docdbres[0].reviews, async function (rev, key) {
            var res = await ipfs.files.get(rev.ipfsAddress)
            archive.add(rev.metadata.originalName, res[0].content);
        }, function (err) {
            if (err) console.error(err.message);
            console.log('after archiving')
            var buffer = archive.toBuffer();
            console.log('before write')
            fs.writeFile(__dirname + '/../download_files/' + docdbres[0].title + '_reviewFiles.zip', buffer, function () {
                console.log('finisihed')
                res.attachment(docdbres[0].title + '_reviewFiles.zip')
                res.download(__dirname + '/../download_files/' + docdbres[0].title + '_reviewFiles.zip', (err) => {
                    console.log('truncate')
                    fs.unlink(__dirname + '/../download_files/' + docdbres[0].title + '_reviewFiles.zip');
                });


            });
        });
    } catch (err) {
        console.log('error in reviewFilesZipper: ' + err)
    }
})

async function getDatasetData(req) {
    const orbitdb = req.app.get('orbit');
    const filedb = await orbitdb.docstore('files_storage_UI', {overwrite: true})//,
    await filedb.load()
    // filedb.drop()
    var filedbres = await filedb.get("")
    // console.log(filedbres)
    filedb.close()
    return filedbres;
}

async function getArticleData(req) {
    const orbitdb = req.app.get('orbit');
    const docdb = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
    await docdb.load()
    // docdb.drop()
    var docdbres = await docdb.get("")
    // console.log(docdbres)
    docdb.close()
    return docdbres;
}

async function search(key, req, data, weight =
    ["_id", "abstract", "tags", "authors", "metadata.originalName"]) {
    var options = {
        shouldSort: true,
        tokenize: true,
        matchAllTokens: true,
        findAllMatches: true,
        threshold: 1,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
    };
    options.keys = weight
    // console.log('options: ' + JSON.stringify(options))
    var fuse = await new Fuse(data, options)
    var result = await fuse.search(key)
    // console.log('result: ' + JSON.stringify(result))
    return result;

}


module.exports = router;