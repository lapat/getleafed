const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = admin.initializeApp();
const bucket = admin.storage().bucket();
const db = admin.firestore();
var myRequest = require("request");
const sgClient1 = require('@sendgrid/mail');
sgClient1.setApiKey('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');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });



exports.testSomething = functions.https.onRequest((req, res) => {
  console.log("TESTSOMETHING........")
  return createAirtableOrdersLinked();
})



      exports.getDeals = functions.https.onCall((data, context) => {
        console.log("getDeals...")
        if (!context.auth) {
          throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
          'while authenticated.');
        }
        return getDealsHelper(context.auth.uid)
        .then(function(returned){
          return ( returned );
        })
      })

      function getDealsHelper(uid){
        console.log("getDealsHelper uid:"+uid)
        return new Promise(function (resolve, reject) {
          var refGet = db.collection('deals').where('uid', '==', uid).orderBy('utc_time', 'desc');
          var deals=[]
          return refGet.get()
          .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
              deals.push(doc.data())
            })
            console.log("deals:"+JSON.stringify(deals))
            return resolve(deals)
          })
        }).catch(err => {
          console.log('getDealsHelper - ERROR', err);
          return {success : false, error : err}
        })
      }

exports.addDeal = functions.https.onCall((data, context) => {
  console.log("addDeal call...")
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
    'while authenticated.');
  }

  return addUpdateDealFunction(data, context.auth.uid)
  .then(function(returned){
    return ( returned );
  })
})

function addUpdateDealFunction(data, uid){
  var ref;
  if (data.hasOwnProperty("id")){
    ref = db.collection('deals').doc(data.id);
  }else{
    ref = db.collection('deals').doc();
  }
  return ref.set(
    data
    , { merge: true })
  .then(function(snapshot) {
    return {success:true}
  }).catch(err => {
    console.log('error addDealFunction:', err);
    return {error: 'error addDealFunction:' +  err.toString()};
  })
}
