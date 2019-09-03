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

exports.getDealsForStore = functions.https.onCall((data, context) => {
  console.log("getDealsForStore...")
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
    'while authenticated.');
  }
  return getDealsForStoreHelper(context.auth.uid)
  .then(function(returned){
    return ( returned );
  })
})

//addUpdateUserFunction
exports.addUpdateUser = functions.https.onCall((data, context) => {
  console.log("addUpdateUser...")
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
    'while authenticated.');
  }
  return addUpdateUserFunction(data, context.auth.uid)
  .then(function(returned){
    return ( returned );
  })
})

//getUserProfile
exports.getUserProfile = functions.https.onCall((data, context) => {
  console.log("getUserProfile...")
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
    'while authenticated.');
  }
  return getUserProfileFunction(context.auth.uid)
  .then(function(returned){
    return ( returned );
  })
})

function getUserProfileFunction(uid){
  refGet = db.collection('users').doc(uid);
  return refGet.get()
  .then(doc => {
    if (doc===undefined){
      return {}
    }
    return(doc.data());
  })
}

function addUpdateUserFunction(data, uid){
  var ref;
  data['id'] = uid;
  if (data.hasOwnProperty("id")){
    ref = db.collection('users').doc(data.id);
  }else{
    var newId = makeid(20)
    data['id']=newId;
    ref = db.collection('users').doc(newId);
  }
  return ref.set(
    data
    , { merge: true })
    .then(function(snapshot) {
      return {success:true, data : data}
    }).catch(err => {
      console.log('error addUpdateUserFunction:', err);
      return {error: 'error addUpdateUserFunction:' +  err.toString()};
    })
  }

  exports.getDeals = functions.https.onCall((data, context) => {
    console.log("getDeals...")
    var uid = ""
    if (!context.auth) {
      uid=""
    }else{
      uid = context.auth.uid
    }
    return getDealsHelper(uid, data)
    .then(function(returned){
      return ( returned );
    })
  })

  exports.updateLikes = functions.https.onCall((data, context) => {
    console.log("updateLikes...")
    if (!context.auth) {
      throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
      'while authenticated.');
    }

    return updateLikesHelper(data)
    .then(function(returned){
      return ( returned );
    })
  })

  exports.updateViewsForDeal = functions.https.onCall((data, context) => {
    console.log("updateViewsForDeal...")
    if (!context.auth) {
      throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
      'while authenticated.');
    }
    return updateViewsForDealHelper(data)
    .then(function(returned){
      return ( returned );
    })
  })
  //

  function updateViewsForDealHelper(data, uid){
    var ref;
    ref = db.collection('deals').doc(data.id);
    return ref.set(
      {
        views : data.views
      }
      , { merge: true })
      .then(function(snapshot) {
        return {success:true, views : data.views}
      }).catch(err => {
        console.log('error updateViewsForDealHelper:', err);
        return {error: 'error updateViewsForDealHelper:' +  err.toString()};
      })
    }

  //updateLikes
  function updateLikesHelper(data, uid){
    var ref;
    ref = db.collection('deals').doc(data.id);
    return ref.set(
      {
        user_likes : data.user_likes,
        likes : data.likes
      }
      , { merge: true })
      .then(function(snapshot) {
        return {success:true}
      }).catch(err => {
        console.log('error updateLikesHelper:', err);
        return {error: 'error updateLikesHelper:' +  err.toString()};
      })
    }


  function getDealsHelper(uid, data){
    console.log("getDealsHelper uid:"+uid)
    return new Promise(function (resolve, reject) {
      var refGet;
      var deals=[]

      if (data !== null){
        if(data.hasOwnProperty('city')){
          //    var refGet = db.collection('deals').where('uid', '==', uid).orderBy('utc_time', 'desc');
          refGet = db.collection('deals').where('store_data.city', '==', data.city).orderBy('utc_time', 'desc');
          return refGet.get()
          .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
              deals.push(doc.data())
            })
            console.log("deals:"+JSON.stringify(deals))
            return resolve(deals)
          })
        }else if(data.hasOwnProperty('store_name')){
          refGet = db.collection('deals').where('store_data.store_name', '==', data.store_name).orderBy('utc_time', 'desc');
          return refGet.get()
          .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
              deals.push(doc.data())
            })
            console.log("deals:"+JSON.stringify(deals))
            return resolve(deals)
          })

        }else if(data.hasOwnProperty('id')){
          refGet = db.collection('deals').doc(data.id);
          return refGet.get()
          .then(doc => {
            return(resolve(doc.data()));
          })
        }
      }else{
        refGet = db.collection('deals').orderBy('utc_time', 'desc');
        return refGet.get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            deals.push(doc.data())
          })
          console.log("deals:"+JSON.stringify(deals))
          return resolve(deals)
        })
      }
    }).catch(err => {
      console.log('getDealsForHelper - ERROR', err);
      return {success : false, error : err}
    })
  }

  function getDealsForStoreHelper(uid){
    console.log("getDealsForStoreHelper uid:"+uid)
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
      console.log('getDealsForStoresHelper - ERROR', err);
      return {success : false, error : err}
    })
  }

  exports.getStores = functions.https.onCall((data, context) => {
    console.log("getStores...")
    if (!context.auth) {
      throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
      'while authenticated.');
    }
    return getStoresHelper(context.auth.uid)
    .then(function(returned){
      return ( returned );
    })
  })

  function getStoresHelper(uid){
    console.log("getStoresHelper uid:"+uid)
    return new Promise(function (resolve, reject) {
      var refGet = db.collection('stores').where('uid', '==', uid);
      var stores=[]
      return refGet.get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          stores.push(doc.data())
        })
        console.log("stores:"+JSON.stringify(stores))
        return resolve(stores)
      })
    }).catch(err => {
      console.log('getStoresHelper - ERROR', err);
      return {success : false, error : err}
    })
  }

  exports.addUpdateDeal = functions.https.onCall((data, context) => {
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

  exports.addUpdateStore = functions.https.onCall((data, context) => {
    console.log("addUpdateStore call...")
    if (!context.auth) {
      throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
      'while authenticated.');
    }

    return addUpdateStoreFunction(data, context.auth.uid)
    .then(function(returned){
      return ( returned );
    })
  })

  function addUpdateStoreFunction(data, uid){
    var ref;
    data['uid'] = uid;
    if (data.hasOwnProperty("id")){
      ref = db.collection('stores').doc(data.id);
    }else{
      var newId = makeid(20)
      data['id']=newId;
      ref = db.collection('stores').doc(newId);
    }
    return ref.set(
      data
      , { merge: true })
      .then(function(snapshot) {
        return {success:true}
      }).catch(err => {
        console.log('error addUpdateStoreFunction:', err);
        return {error: 'error addUpdateStoreFunction:' +  err.toString()};
      })
    }

    exports.deleteDeal = functions.https.onCall((data, context) => {
      console.log("deleteDeal call...")
      if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
        'while authenticated.');
      }
      return deleteDealFunction(data, context.auth.uid)
      .then(function(returned){
        return ( returned );
      })
    })

    exports.deleteStore = functions.https.onCall((data, context) => {
      console.log("deleteStore call...")
      if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
        'while authenticated.');
      }
      return deleteStoreFunction(data, context.auth.uid)
      .then(function(returned){
        return ( returned );
      })
    })

    function deleteStoreFunction(data, uid){
      console.log("DELETING:"+data.id)
      return new Promise(function (resolve, reject) {
        var refToId = db.collection('stores').doc(data.id)
        refToId.delete()
        .then(function() {
          console.log("Remove succeeded.")
          return resolve({success : true})
        })
        .catch(function(err) {
          console.log("Remove failed: " + err)
          return resolve({success : false, error : err})
        });
      }).catch(err => {
        console.log('deleteStoreFunction - ERROR', err);
        return {success : false, error : err}
      })
    }


    function deleteDealFunction(data, uid){
      console.log("DELETING:"+data.id)
      return new Promise(function (resolve, reject) {
        var refToId = db.collection('deals').doc(data.id)
        refToId.delete()
        .then(function() {
          console.log("Remove succeeded.")
          return resolve({success : true})
        })
        .catch(function(err) {
          console.log("Remove failed: " + err)
          return resolve({success : false, error : err})
        });
        //.then(function(returned) {
      }).catch(err => {
        console.log('deleteDealFunction - ERROR', err);
        return {success : false, error : err}
      })

    }

    function addUpdateDealFunction(data, uid){
      var ref;
      if (data.hasOwnProperty("id")){
        ref = db.collection('deals').doc(data.id);
      }else{
        var newId = makeid(20)
        data['id']=newId;
        ref = db.collection('deals').doc(newId);
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

      function makeid(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
      }
