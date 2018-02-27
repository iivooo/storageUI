var express = require('express');
var router = express.Router();
var sha256 = require('sha256')
var multer = require('multer')
var upload = multer({dest: __dirname + '/uploads'});

var loginHelper = require(__dirname + '/helpers/loginRegisterHelper');
var ipfsHelper = require(__dirname + '/helpers/ipfsOriginHelper');
var storageHelper = require(__dirname + '/helpers/storageApiHelper');
var orbitHelper = require(__dirname + '/helpers/orbitHelper');


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {loggedin: req.session.loggedin, home: true});
});

/*check sha256 hashed username and password*/
router.post('/checkPassword/', async function (req, res, next) {
    if (typeof req.body.usr == 'undefined') {
        req.body.usr = ""
    }
    if (typeof req.body.pwd == 'undefined') {
        req.body.pwd = ""
    }
    console.log('password: '+ await sha256('testitesti'))
    console.log('bodypw: ' + await sha256(req.body.usr))
    var errors = await loginHelper.checkLoginSubmit(req, await sha256(req.body.usr), await sha256(req.body.pwd))
    res.send({errors: errors})
});

router.post('/register', async function (req, res, next) {
    if (typeof req.body.usr == 'undefined') {
        req.body.usr = ""
    }
    if (typeof req.body.pwd == 'undefined') {
        req.body.pwd = ""
    }
    if (typeof req.body.pwd2 == 'undefined')
        req.body.pwd2 = ""

    var errors = await loginHelper.checkRegisterSubmit(req, sha256(req.body.usr), sha256(req.body.pwd), sha256(req.body.pwd2))
    if(!errors){
        errors = await loginHelper.userToDb(req, sha256(req.body.usr), sha256(req.body.pwd))

    }
    res.send({errors: errors})
})


router.post('/uploadArticle', upload.single('file_contents'), async function (req, res, next) {
    try {
        //check login data
        var errors = [];
        var err
        if (typeof req.body.usr == 'undefined') {
            req.body.usr = ""
        }
        if (typeof req.body.pwd == 'undefined') {
            req.body.pwd = ""
        }
        if (err = await loginHelper.checkLoginSubmit(req, await sha256(req.body.usr), await sha256(req.body.pwd))) {
            res.send({errors: err})
            console.log('err: checkloginsubmit')
            return
        }

        //check if incoming file
        if (typeof req.file == 'undefined') {
            errors.push({msg: "No incoming file!"})
            res.send({errors: errors})
            console.log('err: incoming file')

            return
        }
        req.file.sha = await ipfsHelper.hash256(req.file.path);

        //check metadata for integrity
        if (err = await storageHelper.checkArticleUploadMetadata(req)) {
            res.send({errors: err});
            console.log('err: check metadata')

            return
        }

        //upload to ipfs and cluster and check
        var ipfsHash = await ipfsHelper.addToIPFS(req);
        if (ipfsHash instanceof Error) {
            errors.push({msg: ipfsHash.message})
            console.log('err: upload to ipfs')

            res.send({errors: errors})
            return
        }

        //upload to orbit (need templater and the other stuff.)
        var templater = require('json-templater/object')
        var article = templater(require(__dirname + '/../templates/article.json'),
            {
                "id": req.file.sha,
                "title": req.body.title,
                "abstract": req.body.abstract,
                "tags": req.body.tags,
                "authors": req.body.authors,
                "owner": await sha256(req.body.usr),
                "filesets": [],
                "ipfsAddress": ipfsHash,
                "originalName": req.file.originalname,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "sha256": req.file.sha
            }
        )

        //store filedata to orbit
        err = await orbitHelper.writeArticleToOrbit(req, article)
        if (err instanceof Error) {
            console.log('err: toorbit')
            errors.push({msg: err.message})
            res.send({errors: errors})
            return
        }
        // article.errors = false;
        res.send({'article': article, 'errors': false})
        return false


    } catch (err) {
        console.log('modifyArticle error : ' + err)
        res.send({
            errors: {
                msg: 'Something internally went wrong! We try to fix this.',
                err: err.message
            }
        })
        return;
    }

})

router.post('/uploadAdditionalData', upload.single('file_contents'), async function (req, res, next) {
    try {
        //check login data
        var errors = [];
        var err
        if (typeof req.body.usr == 'undefined') {
            req.body.usr = ""
        }
        if (typeof req.body.pwd == 'undefined') {
            req.body.pwd = ""
        }
        if (err = await loginHelper.checkLoginSubmit(req, await sha256(req.body.usr), await sha256(req.body.pwd))) {
            res.send({errors: err})
            console.log('err: checkloginsubmit')
            return
        }

        //check if incoming file
        if (typeof req.file == 'undefined') {
            errors.push({msg: "No incoming file!"})
            res.send({errors: errors})
            console.log('err: incoming file')

            return
        }
        req.file.sha = await ipfsHelper.hash256(req.file.path);

        //check metadata for integrity
        if (err = await storageHelper.checkAdditionalFileUploadMetadata(req)) {
            res.send({errors: err});
            console.log('err: check metadata')

            return
        }

        //upload to ipfs and cluster and check
        var ipfsHash = await ipfsHelper.addToIPFS(req);
        if (ipfsHash instanceof Error) {
            errors.push({msg: ipfsHash.message})
            console.log('err: upload to ipfs')

            res.send({errors: errors})
            return
        }

        //upload to orbit (need templater and the other stuff.)
        var templater = require('json-templater/object')
        var fileset = templater(require(__dirname + '/../templates/fileset.json'),
            {
                "id": req.file.sha,
                "title": req.body.title,
                "abstract": req.body.abstract,
                "tags": req.body.tags,
                "authors": req.body.authors,
                "owner": await sha256(req.body.usr),
                "ipfsAddress": ipfsHash,
                "originalName": req.file.originalname,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "sha256": req.file.sha
            }
        )

        //store filedata to orbit
        err = await orbitHelper.writeAdditionalFileToOrbit(req, fileset, req.body.articleSha)
        if (err instanceof Error) {
            console.log('err: toorbit')
            errors.push({msg: err.message})
            res.send({errors: errors})
            return
        }
        // article.errors = false;
        res.send({'file': fileset, 'errors': false})
        return false


    } catch (err) {
        console.log('uploadAdditionalData error : ' + err)
        res.send({
            errors: {
                msg: 'Something internally went wrong! We try to fix this.',
                err: err.message
            }
        })
        return;
    }

})

router.post('/uploadReviewFile', upload.single('file_contents'), async function(req, res, next) {
    try {
        //check login data
        var errors = [];
        var err
        if (typeof req.body.usr == 'undefined') {
            req.body.usr = ""
        }
        if (typeof req.body.pwd == 'undefined') {
            req.body.pwd = ""
        }
        if (err = await loginHelper.checkLoginSubmit(req, await sha256(req.body.usr), await sha256(req.body.pwd))) {
            res.send({errors: err})
            console.log('err: checkloginsubmit')
            return
        }

        //check if incoming file
        if (typeof req.file == 'undefined') {
            errors.push({msg: "No incoming file!"})
            res.send({errors: errors})
            console.log('err: incoming file')

            return
        }
        req.file.sha = await ipfsHelper.hash256(req.file.path);

        //check metadata for integrity
        if (err = await storageHelper.checkUploadReviewFiles(req)) {
            res.send({errors: err});
            console.log('err: check metadata')

            return
        }

        //upload to ipfs and cluster and check
        var ipfsHash = await ipfsHelper.addToIPFS(req);
        if (ipfsHash instanceof Error) {
            errors.push({msg: ipfsHash.message})
            console.log('err: upload to ipfs')

            res.send({errors: errors})
            return
        }

        //upload to orbit (need templater and the other stuff.)
        var templater = require('json-templater/object')
        var revisedfile = templater(require(__dirname + '/../templates/revisedfile.json'),
            {
                "id": req.file.sha,
                "articleHash": req.body.associated_article,
                "date": req.body.date!=null? req.body.date:new Date().getTime() ,
                "authors": req.body.authors!=null?req.body.authors:'no authors' ,
                "from": req.body.from!=null?req.body.from:'no heritage',
                "ipfsAddress": ipfsHash,
                "originalName": req.body.original_filename!=null? req.body.original_filename:req.file.originalname,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "sha256": req.file.sha
            }
        )
        // console.log('file: ');
        // console.log(req.file)
        // console.log('revisedfile: ')
        // console.log(revisedfile);

        //store filedata to orbit
        err = await orbitHelper.writeRevisedFileToOrbit(req, revisedfile)
        if (err instanceof Error) {
            console.log('err: toorbit')
            errors.push({msg: err.message})
            res.send({errors: errors})
            return
        }
        // article.errors = false;
        res.send({'revisedfile': revisedfile, 'errors': false})
        return false


    } catch (err) {
        console.log('modifyArticle error : ' + err)
        res.send({
            errors: {
                msg: 'Something internally went wrong! We try to fix this.',
                err: err.message
            }
        })
        return;
    }

})



router.post('/uploadComment', async function (req, res, next) {
    try {
        //check login data
        // console.log('body')
        // console.log(req.body);
        var errors = [];
        var err
        if (typeof req.body.usr == 'undefined') {
            req.body.usr = ""
        }
        if (typeof req.body.pwd == 'undefined') {
            req.body.pwd = ""
        }
        if (err = await loginHelper.checkLoginSubmit(req, await sha256(req.body.usr), await sha256(req.body.pwd))) {
            res.send({errors: err})
            console.log('err: checkloginsubmit')
            return
        }


        //check metadata for integrity
        if (err = await storageHelper.checkUploadComment(req)) { //need? check for timestampstring
            res.send({errors: err});
            console.log('err: check metadata')

            return
        }

        req.file = {}
        req.file.sha = await sha256(req.body.timestampString)

        //upload to ipfs and cluster and check
        var ipfsHash = await ipfsHelper.addCommentToIpfs(req);
        if (ipfsHash instanceof Error) {
            errors.push({msg: ipfsHash.message})
            console.log('err: upload to ipfs')

            res.send({errors: errors})
            return
        }
        // console.log('ipfs hash '+ipfsHash)

        //upload to orbit (need templater and the other stuff.)
        var templater = require('json-templater/object')
        var comment = templater(require(__dirname + '/../templates/comment.json'),
            {
                "id": req.file.sha,
                "title": req.body.title!=null?req.body.title:'none',
                "comment": req.body.comment,
                "timestampString": req.body.timestampString,
                "timestampStringContents": req.body.timestampStringContents!=null?req.body.timestampStringContents:'none', //TODO: how to set to null in templater
                "articleHash": req.body.articleHash,
                "date": req.body.date!=null? req.body.date:new Date().getTime() ,
                "authors": req.body.authors!=null?req.body.authors:'none' ,
                "from": req.body.from!=null?req.body.from:'none',
                "ipfsAddress": ipfsHash,
                "originalName": req.body.original_filename!=null? req.body.original_filename:req.file.originalname,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "sha256": req.file.sha
            }
        )
        // console.log('file: ');
        // console.log(req.file)
        // console.log('revisedfile: ')
        // console.log(revisedfile);

        //store filedata to orbit
        err = await orbitHelper.writeCommentToOrbit(req, comment)
        if (err instanceof Error) {
            console.log('err: toorbit')
            errors.push({msg: err.message})
            res.send({errors: errors})
            return
        }
        // article.errors = false;
        res.send({'comment': comment, 'errors': false})
        return false


    } catch (err) {
        console.log('modifyArticle error : ' + err)
        res.send({
            errors: {
                msg: 'Something internally went wrong! We try to fix this.',
                err: err.message
            }
        })
        return;
    }

})





module.exports = router;