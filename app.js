const FB = require('fb');
const fs = require('fs');
const admin = require('firebase-admin');
const fbvid = require('fbvideos');
const JsonDB = require('node-json-db');
const fbUpload = require('facebook-api-video-upload');
const request = require('request');
const express = require('express')
var cron = require('node-cron');

const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Service Coppy Pages!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
const DBlog = new JsonDB("logs", true, false);
const serviceAccount = require('./facebook-page-01-firebase-adminsdk-viaww-a6f8d65346.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https:///facebook-page-01.firebaseio.com'
})
const db = admin.firestore();
const token = "EAAAAAYsX7TsBAHgmkHZB3dIO4LUO6ayJZBzOhfZApgNYY8Kpa8Oz1D23ju2SXpZAzswnvyzsWG4MLc4PRmOWCOFpHeZAXRoAx8Q0VHvm8QZAPd8oSrr5lAwbS1PgOY8n3DLYZAawqKGoJ8LE1ZCcpuWe5k13HSGAVyFOQF0J64YREauHu31L2VTSDFvMEUxYgz0V3dPUkEPJQO1WkTgAiF8b"
FB.setAccessToken(token);
getPages()

cron.schedule('* * 1 * *', () => {
    getPages()
    console.log('running a CoppyPages every hour');
});
//main()


async function main() {
    let LinkHd = await getLinkHdVdieo("https://www.facebook.com/newsclearvdo/videos/259707048083633/")
    console.log(LinkHd)
    const args = {
        token: token, // with the permission to upload
        id: '274996289820830', //The id represent {page_id || user_id || event_id || group_id}
        stream: fs.createReadStream('./hd.mp4'), //path to the video,
        title: "Sexxxy",
        description: "Sexxxy"
    };

    fbUpload(args).then((res) => {
        console.log('res: ', res.body);
        //res:  { success: true, video_id: '1838312909759132' }
    }).catch((e) => {
        console.error(e);
    });
}
async function CoppyPage(PageID) {

    const noteSnapshot = await db.collection('PageCoppy').get();

    noteSnapshot.forEach(async (doc) => {
        let body = await LoadPage(doc.data().PageID)
        body.data.forEach(async (res) => {
            let temp = await getLogs2(PageID, res.id)
            //let temp =false;
            if (res.type == "video") {
                //console.log(res)
            }
            if (temp == true) {
                FB.api(PageID + '/feed', 'post', { message: res.message, link: res.link, name: res.name, description: res.description }, function (res) {
                    if (!res || res.error) {
                        //console.log(!res ? 'error occurred' : res.error);
                        return;
                    }
                    WriteDB(PageID, res.id)
                    console.log('Post Id: ' + res.id);
                });
            }
        })
    })
}
function getLinkHdVdieo(video) {
    return new Promise((resolve) => {
        fbvid.high(video).then(vid => {
            resolve(vid);
        });
    })
}
async function getPages() {
    const noteSnapshot = await db.collection('Pages').get();

    noteSnapshot.forEach((doc) => {
        CoppyPage(doc.data().PageID)
    })
}
async function getLogs(PageID, PostID) {
    const noteSnapshot = await db.collection('logs').get();
    let ck = true
    await noteSnapshot.forEach((doc) => {
        if (doc.data().PageID == PageID && doc.data().PostID == PostID) {
            ck = false;
            return ck;
        }
    })
    return ck
}
async function getLogs2(PageID, PostID) {
    let ck = true

    let data = DBlog.getData("/");
    await data.data.forEach((res) => {
        if (res.PageID == PageID && res.PostID == PostID) {
            ck = false;
            return ck;
        }
    })
    return ck
}
function WriteDB2(PageID, PostID) {
    db.collection("logs").add({
        PageID: PageID,
        PostID: PostID
    })
        .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
}
function WriteDB(PageID, PostID) {
    DBlog.push("/data[]", { PageID: PageID, PostID: PostID }, true);
    DBlog.save();
}
function LoadPage(PageID) {
    return new Promise((resolve) => {
        FB.api(PageID + '/feed', { fields: ['likes', 'message', 'name', 'type', 'is_published', 'description', 'full_picture', 'comments', 'shares', 'source', 'link'] }, function (res) {
            resolve(res)                        //console.log(!res ? 'error occurred' : res.error);
        });
    })
}


