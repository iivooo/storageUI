var ipfsOriginHelper = require(__dirname+'/ipfsOriginHelper');
var orbitHelper = require(__dirname+'/orbitHelper');
var templater=require('json-templater/object');


module.exports = {
/*
* article: takes json object /templates/article.json style.
* */


    async checkArticleUploadMetadata(req){
        var errors = [];
        var article=await orbitHelper.getData(req, 'articles_storage_UI' , e=>e._id == req.file.sha)
        if(typeof article[0] != 'undefined')
            errors.push({msg: 'Article (hash) already existing!', article: article[0]})
        if(typeof req.body.title == 'undefined' || req.body.title == "")
            errors.push({msg: 'No article title provided!'})
        article=await orbitHelper.getData(req, 'articles_storage_UI', e=>e.title == req.body.title)
        if(article[0] != null)
            errors.push({msg: 'Article title already existing!', article:article[0]})
        if(typeof req.body.abstract == 'undefined' || req.body.abstract == "")
            errors.push({msg: 'Abstract field missing!'})


        if(typeof errors[0] == 'undefined'){
             return false;
        }else
            return errors

    },

    async checkAdditionalFileUploadMetadata(req){
        var errors = [];
        var article=await orbitHelper.getData(req, 'files_storage_UI' , e=>e._id == req.file.sha)
        if(typeof article[0] != 'undefined')
            errors.push({msg: 'Additional file (hash) already existing!', file: article[0]})
        if(typeof req.body.title == 'undefined' || req.body.title == "")
            errors.push({msg: 'No additional file title provided!'})
        article=await orbitHelper.getData(req, 'files_storage_UI', e=>e.title == req.body.title)
        if(article[0] != null)
            errors.push({msg: 'Additional file title already existing!', file:article[0]})
        console.log(req.body)
        if(req.body.articleSha){
            article =  await orbitHelper.getData(req, 'articles_storage_UI', e=>e._id == req.body.articleSha)
            console.log(article)
            if(!article[0]){
                errors.push({msg: 'Main article not uploaded yet! Please upload the article first!'})
            }
        }
       /* if(typeof req.body.abstract == 'undefined' || req.body.abstract == "")
            errors.push({msg: 'Abstract field missing!'})*/


        if(typeof errors[0] == 'undefined'){
            return false;
        }else
            return errors

    },

    async checkUploadComment(req){
        var errors = [];

        if(req.body.articleHash != null){
            article =  await orbitHelper.getData(req, 'articles_storage_UI', e=>e._id == req.body.articleHash)
            console.log("article check: ")
            console.log(article)
            if(article[0] == null){
                errors.push({msg: 'Main article not uploaded yet! Please upload the article first!'})
            }
        }else{
            errors.push({msg: 'Main article not uploaded yet! Please upload the article first!'})
        }

        if(req.body.comment == null){
            errors.push({msg: 'No comment provided!'})
        }

        if(req.body.timestampString == null){
            errors.push({msg: 'No string to timestamp provided!'})
        }

        if(typeof errors[0] == 'undefined'){
            return false;
        }else
            return errors

    },

    async checkUploadReviewFiles(req) {

        var errors = [];

        if(req.body.associated_article){
            article =  await orbitHelper.getData(req, 'articles_storage_UI', e=>e._id == req.body.associated_article)
            console.log("article check: ")
            console.log(article)
            if(article[0] == null){
                errors.push({msg: 'Main article not uploaded yet! Please upload the article first!'})
            }
        }else{
            errors.push({msg: 'Main article not uploaded yet! Please upload the article first!'})
        }

        if(typeof errors[0] == 'undefined'){
            return false;
        }else
            return errors

    },

    async addCommentToArticle (req) { //TODO: do only check metadata here
        //create article json
        try {
            const orbitdb = req.app.get('orbit')

                //add fileset to article
                db = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
                await db.load()
                var dbArticle = await db.query(e=>e._id==req.body.articleSha)
                console.log(article);
                if (dbArticle[0] != null) {
                    dbArticle[0].comments.push(req.body.comment)
                    console.log(article[0]);
                    await db.put(dbArticle[0])
                    await db.close()
                    return false

                } else {

                //error
                return new Error("Article not existing.")            }
        } catch (err) {
            console.log('Error in storageApiHelper:writeAdditionalFileToOrbit: ' + err)
            return new Error("Something went wrong at writing to Orbit.")
        }

    },
}