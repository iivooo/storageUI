var templater=require('json-templater/object');
module.exports = {

    async writeArticleToOrbit(req, article) {
        //create article json
        try {
            const orbitdb = req.app.get('orbit')
            db = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
            await db.load()
            var res = await db.query(e => e.title == article.title)
            if (res[0] == null) {
                await db.put(article)
                await db.close()

                //add article to user
                db = await orbitdb.docstore('users_storage_UI', {overwrite: true})
                await db.load()
                var user = await db.get(article.owner)
                // console.log('user1: ' + user)
                // console.log('stringify: ' + JSON.stringify(user))
                if (user[0] == null) {
                    user[0] = templater(require(__dirname + '/../../templates/user_w_alldata.json'),
                        {
                            "id_hash": article.owner
                        })
                }

                user[0].articles.push(article._id)
                console.log('user: ' + JSON.stringify(user))
                // user.articles.push(req.body.title)
                await db.put(user[0])
                // console.log(user[0]['id'])
                // console.log('get: '+ await JSON.stringify(db.get(user[0]._id)))
                await db.close()
                return false
            } else {
                //error
                return new Error("Article title already exists.")
            }
        } catch (err) {
            console.log('Error in orbitHelper:writeArticleToOrbit: ' + err)
            return new Error("Something went wrong at writing to Orbit.")
        }

    },

    async writeAdditionalFileToOrbit(req, article, articleSha) {
        //create article json
        try {
            const orbitdb = req.app.get('orbit')
            db = await orbitdb.docstore('files_storage_UI', {overwrite: true})//,
            await db.load()
            var res = await db.query(e => e._id == article._id)
            if (res[0] == null) {
                await db.put(article)
                await db.close()

                //add fileset to user
                db = await orbitdb.docstore('users_storage_UI', {overwrite: true})
                await db.load()
                var user = await db.get(article.owner)
                if (user[0] == null) {
                    user[0] = templater(require(__dirname + '/../../templates/user_w_alldata.json'),
                        {
                            "id_hash": article.owner
                        })
                }

                user[0].filesets.push(article._id)
                await db.put(user[0])
                await db.close()

                //add fileset to article
                db = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
                await db.load()
                var dbArticle = await db.query(e => e._id == req.body.articleSha)
                console.log(article);
                if (dbArticle[0] != null) {
                    dbArticle[0].filesets.push(article._id)
                    console.log(article[0]);
                    await db.put(dbArticle[0])

                }
                await db.close()

                return false
            } else {
                //error
                return new Error("AdditionalFIle title already exists.")
            }
        } catch (err) {
            console.log('Error in storageApiHelper:writeAdditionalFileToOrbit: ' + err)
            return new Error("Something went wrong at writing to Orbit.")
        }

    },

    async writeCommentToOrbit(req, comment) {
        try {
            const orbitdb = req.app.get('orbit')

            //add fileset to article
            db = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
            await db.load()
            var dbArticle = await db.query(e => e._id == comment.articleHash)
            if (dbArticle[0] != null) {
                if(dbArticle[0].comments.find(e => e.ipfsAddress == comment.ipfsAddress) == null){
                    dbArticle[0].comments.push(comment)
                    console.log('comment after inserting revised file: ')
                    console.log(article[0]);
                    await db.put(dbArticle[0])
                }

            } else {
                //error
                return new Error("no matching article. ")
            }
            await db.close()
            return false
        } catch (err) {
            console.log('Error in storageApiHelper:writeCommentToOrbit: ' + err)
            return new Error("Something went wrong at writing comment to Orbit.")
        }

    },

    async writeRevisedFileToOrbit(req, revisedfile) {
        try {
            const orbitdb = req.app.get('orbit')

            //add fileset to article
            db = await orbitdb.docstore('articles_storage_UI', {overwrite: true})//,
            await db.load()
            var dbArticle = await db.query(e => e._id == revisedfile.articleHash)
            if (dbArticle[0] != null) {
                if(dbArticle[0].reviews.find(e => e.ipfsAddress == revisedfile.ipfsAddress) == null){
                dbArticle[0].reviews.push(revisedfile)
                console.log('article after inserting revised file: ')
                console.log(article[0]);
                await db.put(dbArticle[0])
                }

            } else {
                //error
                return new Error("no matching article. ")
            }
            await db.close()
            return false
        } catch (err) {
            console.log('Error in storageApiHelper:writerevisedfiletoorbit: ' + err)
            return new Error("Something went wrong at writing to Orbit.")
        }

    },

    async getData(req, database, mapper) {
        const orbitdb = req.app.get('orbit');
        const docdb = await orbitdb.docstore(database, {overwrite: true})//,
        await docdb.load()
        // docdb.drop()
        var docdbres = await docdb.query(mapper)
        // console.log(docdbres)
        docdb.close()
        return docdbres;
    }


}