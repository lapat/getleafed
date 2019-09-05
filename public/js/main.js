var config = {
  apiKey: "AIzaSyDinaRAPYGPqWIg58lrURa_VYJUf_Sl538",
  authDomain: "getleafed-68250.web.app/",
  projectId: "getleafed-68250"
};
if (!firebase.apps.length) {
  console.log("INIT")
  firebase.initializeApp({config});
}else{
  console.log("ALREADY INIT")
}

var lastSortByValue=null;
var lastFilterPressed=null;
var lastFilterPressedDataFilter="*";
var lastSortByValueDataFilter="utcTime";

var $grid;
var filterFns;
var firebase_user_object;
var signedIn = false;
var stores;
var store_selected;
var allDealsRetrieved=null;
var local_lat;
var local_lng;
var testLocal = true;
if(testLocal){
  firebase.functions().useFunctionsEmulator("http://localhost:5001")
  local_lat = 42.0238449
  local_lng = -87.6874041
}
//
var addUpdateDeal = firebase.functions().httpsCallable('addUpdateDeal');
var getDealsForStore = firebase.functions().httpsCallable('getDealsForStore');
var deleteDeal =  firebase.functions().httpsCallable('deleteDeal');
var addUpdateStore = firebase.functions().httpsCallable('addUpdateStore');
var addUpdateUser = firebase.functions().httpsCallable('addUpdateUser');
var getUserProfile = firebase.functions().httpsCallable('getUserProfile');
var getStores = firebase.functions().httpsCallable('getStores');
var deleteStore = firebase.functions().httpsCallable('deleteStore');
var getDeals = firebase.functions().httpsCallable('getDeals');
var updateLikes =  firebase.functions().httpsCallable('updateLikes');
var updateViewsForDeal = firebase.functions().httpsCallable('updateViewsForDeal')

var getLeafed = angular.module('getleafedApp', ['ngRoute', 'ngSanitize']);

getLeafed.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl : 'pages/deals.html',
    controller  : 'dealsController',
  })
  .when('/deal', {
    templateUrl : 'pages/deal.html',
    controller  : 'aSingleDealController',
  })
  .when('/subscribe', {
    templateUrl : 'pages/subscribe.html',
    controller  : 'subscribeController',
  })
  .when('/store_profile', {
    templateUrl : 'pages/store_profile.html',
    controller  : 'storeProfileController',
  })
  .when('/store_deals', {
    templateUrl : 'pages/store_deals.html',
    controller  : 'storeDealsController',
  })
  .when('/post_a_deal', {
    templateUrl : 'pages/post_a_deal.html',
    controller  : 'postDealController',
  })
  .when('/user_profile', {
    templateUrl : 'pages/user_profile.html',
    controller  : 'userDealController',
  })
  //user_profile
  //
})

getLeafed.controller('userDealController', function($scope, $location) {
  console.log("userDealController")
  navBarUser();
  showBody();

  getUserProfileHelper($scope);

  $("#updateUserProfile").on('click', function(e) {
    addUpdateUserFunction($scope)
  })
})

function getUserProfileHelper($scope){
  console.log("getUserProfileHeleper")
  blockIt();
  getUserProfile()
  .then( function(result) {
    console.log('getUserProfileHeleper', result);
    $scope.$apply(function () {
      $scope.user_profile = result.data;
      $.unblockUI();
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function addUpdateUserFunction($scope){
  console.log("addUpdateUserFunction")
  blockIt();
  var data = checkUserData();
  if (data === false){
    $.unblockUI();
    return;
  }
  console.log("sending up this data:"+JSON.stringify(data))
  addUpdateUser(data)
  .then( function(result) {
    console.log('addUpdateUser', result);
    $scope.$apply(function () {
      //$.unblockUI();
      bootbox.alert("Your profile was updated successfully.")
      getUserProfileHelper($scope)
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

getLeafed.controller('postDealController', function($scope, $location) {
  console.log("postDealController")
  document.getElementById("imgInp").files = null;
  navBarStore();
  showBody();
  checkForStores($scope)
  $(function(){
    $(".dealTypeDropDown").on("click", "a", function(event){
      var selected = $(this).html();
      console.log("You clicked the drop downs", selected)
      $('.dealType').text(selected)
    })
  })

  $scope.clickedOnStoreInPostDeal = function(aStore){
    $('.whichStore').text(aStore.store_name);
    $('.whichStore').attr('data-id', aStore.id);
    store_selected = aStore
  }


  $(function(){
    /*$(".whichStoreDropDown").on("click", "a", function(event){
    var selected = $(this).html();
    console.log("You clicked the drop downs", selected, " id:"+$(this).attr("data-id"))
    $('.whichStore').text(selected)
    $('.whichStore').attr('data-id', $(this).attr('data-id'));
    console.log("id is now:" + $('.whichStore').attr("data-id"))
  })*/
})

$( "#addStoreDeal" ).click(function() {
  addUpdateDealFunctionHelper($scope, null)
})
})

function addUpdateDealFunctionHelper($scope, dealToUpdate){
  console.log("add store deal...")
  blockIt();

  let photo = document.getElementById("imgInp").files[0];
  if (photo!==undefined && photo!==null){
    console.log('1')
    var fileName = document.getElementById("imgInp").files[0].name;
    console.log('2')
    var fileType = fileName.split('.').pop();
    console.log('3')
    var storageRef = firebase.storage().ref();
    console.log('4')
    var thisFileId=makeid(9)
    var newFileName = "deal_images/"+"first_name" + "_" +"last_name" + "/" + thisFileId + "." + fileType;
    console.log('5')
    var imageRef = storageRef.child(newFileName);
    console.log('6')
    var image_data={image_name : newFileName}
    console.log('7')
    //var image_file_location = 'https://firebasestorage.googleapis.com/v0/b/cannabis-taxi.web.app/#//o/images%2F'+newFileName+'?alt=media'
    //licenseData = {image_file_location : image_file_location, user_name : cannabis_taxi_user_local.first_name+" "+cannabis_taxi_user_local.last_name}
    var options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 500,
      useWebWorker: true
    }
    if (photo===undefined){
      bootbox.alert("There was an error, please try file upload again, error:"+error.message)
      console.log(error.message);
      $scope.$apply(function () {
        $.unblockUI();
      })
      return;
    }
    console.log("handleImageUpload")
    handleImageUpload(photo, imageRef, $scope, dealToUpdate)

  }else{
    console.log("photo is null")
    addUpdateDealFunction('', $scope, dealToUpdate)
  }
}

function addUpdateDealFunction(imageName, $scope, dealToUpdate){
  console.log("addDeal")
  var data = checkPostADealData(imageName);
  if (data === false){
    $.unblockUI();
    return;
  }
  console.log("sending up this data:"+JSON.stringify(data))
  //return;
  //return;
  $('#modal').modal('hide');
  if (dealToUpdate !==null){
    console.log("DEAL TO UPDATE ID:"+dealToUpdate.id)
    data['id'] = dealToUpdate.id;
  }
  addUpdateDeal(data)
  .then( function(result) {
    console.log('addUpdateDealFunction', result);
    $scope.$apply(function () {
      $.unblockUI();
      if (window.location.href.indexOf('store_deals')!==-1){
        bootbox.alert("Your deal was updated.", function(){
          getDealsForStoreHelper($scope)
        });
      }else{
        bootbox.alert("Your deal was added successfully, go to your store deals tab to check all your deals.")
        clearAddDealInputs();
      }
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function clearAddStoreInputs(){
  $('#first_name').val("")
  $('#last_name').val("")
  $('#phone').val("")
  $('#email').val("")
  $('#store_name').val("")
  $('#street_address').val("")
  $('#suite').val("")
  $('#zip').val("")
  $('#state').val("")
  $('#city').val("")

}

function clearAddDealInputs(){
  $('#deal_name').val("");
  $('#deal_description').val(""),
  $('#previous_price').val(""),
  $('#new_price').val("")
  document.getElementById("imgInp").files = null;
  $('#dealImage').hide();
}

getLeafed.controller('storeDealsController', function($scope, $location) {
  console.log("storeDealsController")
  document.getElementById("imgInp").files = null;
  navBarStore();
  showBody();
  checkForStores($scope)


  $scope.convertToShortStringIfLong = function(str){
    if (str.length > 20){
      return str.substring(0,20)+"..."
    }
    return str;
  }

  $scope.clickedPreviewStoreDeals = function(aDeal, e){
    console.log("aDeal.id:"+aDeal.id)
    //return;
    if (e!==undefined){
      e.stopPropagation();
      e.preventDefault();
    }
    //console.log("HJEREsn:"+aDeal.store_data.store_name)
    window.location.href="/#/deal?d="+aDeal.id

    //return ("/#/?s="+aDeal.store_data.store_name)
  }

  $( ".storeName" ).click(function(event) {
    event.stopPropagation
    //addUpdateDealFunctionHelper($scope, null)
  })

  $scope.handleActive = function(is_active){
    console.log("handleActive")
    if (is_active){
      return '<p style="color:green;">Yes</p>'
    }else{
      return '<p style="color:red;">No</p>'
    }
  }

  $(function(){
    $(".dealTypeDropDown").on("click", "a", function(event){
      var selected = $(this).html();
      console.log("You clicked the drop downs", selected)
      $('.dealType').text(selected)
    })
  })



  $scope.clickedOnStoreInUpdateDeal = function(aStore){
    $('.whichStore').text(aStore.store_name);
    $('.whichStore').attr('data-id', aStore.id);
    store_selected = aStore
  }
  /*$(function(){
  $(".whichStoreDropDown").on("click", "a", function(event){
  var selected = $(this).html();
  console.log("You clicked the drop downs", selected, " id:"+$(this).attr("data-id"))
  $('.whichStore').text(selected)
  $('.whichStore').attr('data-id', $(this).attr('data-id'));
  console.log("id is now:" + $('.whichStore').attr("data-id"))
})
})*/

//deleteDealButton
$( ".deleteDealButton" ).click(function() {
  console.log("deleteDealButton")
  deleteDealHelper($scope, lastDealClickedOn)
})

//set when clicked on row
var lastDealClickedOn=null;
$( ".updateStoreDeal" ).click(function() {
  console.log("updateStoreDeal")
  addUpdateDealFunctionHelper($scope, lastDealClickedOn)
})

$scope.handleImage = function(imageLocation){
  console.log("handleImage")
  if (imageLocation !=='' && imageLocation !==null && imageLocation !==undefined){
    return imageLocation
  }else{
    return "/images/temp.jpg"
  }
}

//handleNull(
$scope.handleNull = function(isNull){
  if (isNull===undefined || isNull === null || isNull===''){
    return 0;
  }
  return isNull
}

$scope.convertToPrettyTime = function(utcTime){
  console.log("convertToPrettyTime")
  //return 1;
  var date = new Date(Number(utcTime)*1000)
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return  monthNames[monthIndex] + ' ' + day + ', ' + year;
}

$(".addDealRow").on('click', function(e) {
  e.preventDefault();
  $('.deleteDealButton').hide();
  store_selected = null;
  document.getElementById("imgInp").files = null;
  $('#dealImage').attr('src', '');
  $('#dealImage').hide();
  $('#modalLabel').text("Add Deal")
  $(document).ready(function(){
    $('#deal_name').val("")
    $('#deal_description').val("")
    $('.dealType').text("Type")
    $('#previous_price').val("")
    $('#new_price').val("")
    $('.whichStore').text("Which Store")
    $('#is_active').prop('checked', true);
    $('#modal').modal('show');
    store_selected = null;

  })
  //console.log("aDeal:"+JSON.stringify(aDeal))
});

$scope.clickedOnDealRow = function(aDeal){
  lastDealClickedOn = aDeal;
  $(document).ready(function(){
    $('#modalLabel').text("Update Deal")
    document.getElementById("imgInp").files = null;
    $('#dealImage').attr('src', '');
    $('#dealImage').hide();
    //dealImage
    $('.deleteDealButton').show();
    console.log("aDeal.type:"+aDeal.type)
    //$('#deal_name').val(aDeal.deal_name)
    $('#deal_name').val(aDeal.deal_name)
    $('#deal_description').val(aDeal.deal_description)
    $('.dealType').text(aDeal.type)
    $('#previous_price').val(aDeal.previous_price)
    $('#new_price').val(aDeal.new_price)
    $('.whichStore').text(aDeal.which_store)
    //store_selected = aStore

    $('.whichStore').attr('data-id', aDeal.store_id);
    if (aDeal.is_active){
      $('#is_active').prop('checked', true);
    }else{
      $('#is_active').prop('checked', false);
    }
    //dealImage
    if (aDeal.image_name !== ''){
      $('#dealImage').attr('src', aDeal.image_name);
      $('#dealImage').show();
    }else{
      $('#dealImage').attr('src', '');
      $('#dealImage').hide();
    }
    $('#modal').modal('show');
  })
  console.log("aDeal:"+JSON.stringify(aDeal))
};

getDealsForStoreHelper($scope);

/*$('#dealsTable').scrollTableBody();*/
})

function deleteStoreHelper($scope, lastStoreClickedOn){
  $('#addStoreModal').modal('hide');
  blockIt();
  deleteStore(lastStoreClickedOn)
  .then( function(result) {
    console.log('deleteStoreHelper', result);
    $scope.$apply(function () {
      //$.unblockUI();
      bootbox.alert("Your store was deleted.", function(){
        getStoresHelper($scope)
      });
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function deleteDealHelper($scope, lastDealClickedOn){
  $('#modal').modal('hide');
  blockIt();
  deleteDeal(lastDealClickedOn)
  .then( function(result) {
    console.log('deleteDealHelper', result);
    $scope.$apply(function () {
      //$.unblockUI();
      bootbox.alert("Your deal was deleted.", function(){
        getDealsForStoreHelper($scope)
      });
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function getDealsForStoreHelper($scope){
  blockIt();
  getDealsForStore()
  .then( function(result) {
    console.log('getDealsForStoreHelper', result);
    $scope.$apply(function () {
      $.unblockUI();
      //$scope.store_deals=[{date : 'kdkdkdk'}, {date : 'kasdfasdfasdfas'}, {date : 'a'}]
      $scope.store_deals=result.data;
      //setTimeout(function () {
      //$('#dealsTable').DataTable( {
      //    "destroy": true,
      //    "paging":   false,
      //    "ordering": true
      //  });
      //}, 2000);
      //})
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function checkForStores($scope){
  getStores()
  .then( function(result) {
    console.log('checkForStores', result);
    $scope.$apply(function () {
      //$.unblockUI();
      //$scope.stores=result.data;
      //})
      stores = result.data;
      if (result.data.length>0){
        //load the stores
        $scope.stores = stores;
        $('#addStoreDeal').prop('disabled', false);
        $('.updateStoreDeal').prop('disabled', false);
        $('.addDealRow').show();
      }else{
        showAlert("You need to add a store on the Store Profile page before you add a deal.", true)
        $('#addStoreDeal').prop('disabled', true);
        $('.addDealRow').hide();
        $('.updateStoreDeal').prop('disabled', true);

      }
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function getStoresHelper($scope){
  blockIt();
  getStores()
  .then( function(result) {
    console.log('getStoresFunction', result);
    $scope.$apply(function () {
      $.unblockUI();
      $scope.stores=result.data;
    })
    if (result.data.length>0){
      $('.showStoreTable').show();
    }else{
      $('.showStoreTable').hide();
    }
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

var storeToUpdate = null;
getLeafed.controller('storeProfileController', function($scope, $location) {
  console.log("storeProfileController")
  navBarStore();
  showBody();

  getStoresHelper($scope);

  console.log("CALLING LOAD GEOCODE...")

  $scope.convertToSearch = function(storeName, e){
    if (e!==undefined){
      e.stopPropagation();
      e.preventDefault();
    }
    setTimeout(
      function() {
        //$('#addStoreModal').modal('hide');
      }, 1000);


      return ("/#/?s="+storeName)
    }

    $scope.clickedOnStoreRow = function(aStore){
      storeToUpdate = aStore;
      $('.deleteDealButton').show();
      $(document).ready(function(){
        $('.modal-title-store').text("Update Store")
        $('#first_name').val(aStore.first_name);
        $('#last_name').val(aStore.last_name);
        $('#email').val(aStore.email);
        $('#phone').val(aStore.phone);
        $('#store_name').val(aStore.store_name);
        $('#street_address').val(aStore.street_address);
        $('#suite').val(aStore.suite);
        $('#zip').val(aStore.zip);
        $('#city').val(aStore.city);
        $('#state').val(aStore.state);
        $('#addStoreModal').modal('show');
      })
    }

    $(".addStore").on('click', function(e) {
      clearAddStoreInputs();
      $('.deleteStoreButton').hide();
      $('.modal-title-store').text("Add Store")
      $('#addStoreModal').modal('show');
    })

    $(".saveStore").on('click', function(e) {

      addUpdateStoreFunction($scope, storeToUpdate)
    })

    $( ".deleteStoreButton" ).click(function() {
      console.log("deleteStoreButton")
      deleteStoreHelper($scope, storeToUpdate)
    })

  })

  function checkLocalDeals(dealId){
    var index;
    for (index in allDealsRetrieved){
      if (allDealsRetrieved[index].id === dealId){
        return allDealsRetrieved[index]
      }
    }
    return null;
  }
  function addUpdateStoreFunction($scope, storeToUpdate){
    console.log("addUpdateStoreFunction")
    blockIt();
    var data = checkStoreData();
    if (data === false){
      $.unblockUI();
      return;
    }
    console.log("sending up this data:"+JSON.stringify(data))
    //return;
    //return;
    $('#modal').modal('hide');
    if (storeToUpdate !==null){
      console.log("Store TO UPDATE ID:"+storeToUpdate.id)
      data['id'] = storeToUpdate.id;
    }
    $('#addStoreModal').modal('hide')
    //  loadGeocoderAndConvertToGps("1103 Mulford Street, Evanston, Illinois, 60202", "Evanston")

    geocoder = new google.maps.Geocoder();


    geocoder.geocode( { 'address': data.store_address}, function(results, status) {
      if (status == 'OK') {
        console.log("GOT IT:"+results[0].geometry.location)
        console.log("lat:"+results[0].geometry.location.lat())

        //data[location]=results[0].geometry.location;
        data['gps_lat'] = results[0].geometry.location.lat();
        data['gps_lng'] = results[0].geometry.location.lng();

        //data['location']= new firebase.firestore.GeoPoint(results[0].geometry.location.lat(), results[0].geometry.location.lng())
        addUpdateStoreHelper(data, $scope)
      } else {
        console.log("could not get GPS")
        addUpdateStoreHelper(data, $scope)
      }
    });

  }

  function addUpdateStoreHelper(data, $scope){
    addUpdateStore(data)
    .then( function(result) {
      console.log('addUpdateStore', result);
      $scope.$apply(function () {
        //$.unblockUI();
        if (storeToUpdate !==null){
          bootbox.alert("Your store was updated successfully.")
        }else{
          bootbox.alert("Your store was added successfully.")

        }
        clearAddStoreInputs();
        getStoresHelper($scope)
      })
    }).catch(function(error) {
      $.unblockUI();
      bootbox.alert("There was an error, please contact support: "+error)
    });
  }

  getLeafed.controller('subscribeController', function($scope, $location) {
    console.log("subscribeController")
    navBarUser();
    showBody();
  })

  function updateViewForDealFunction(aDeal, $scope){

    if (aDeal.hasOwnProperty('views')){
      console.log("has views aDeal.views:"+aDeal.views)
      aDeal['views'] = Number(aDeal.views) + 1;
    }else{
      console.log("no views")

      aDeal['views'] = 1;
    }

    console.log("aDeal:"+JSON.stringify(aDeal))
    updateViewsForDeal(aDeal)
    .then( function(result) {
      console.log('pdateViewForDealFunction storeName', result);
      $scope.$apply(function () {
        aDeal['views'] = result.data.views

      })
    }).catch(function(error) {
      //bootbox.alert("There was an error, please contact support: "+error)
    });
  }

  getLeafed.controller('aSingleDealController', function($scope, $location) {
    console.log("aSingleDealController")
    navBarUser();
    $('#restOfBody').hide();
    //codeGoogleMapAddress(cannabis_taxi_user_local.street_address + ", " + cannabis_taxi_user_local.city + ", "+ cannabis_taxi_user_local.state + " " + cannabis_taxi_user_local.zip)
    var dealId=getParameter("d");
    if(dealId===null || dealId===undefined || dealId===""){
      bootbox.alert("Error, no deal id was specified.");
      return;
    }

    $scope.handleHeartClass = function(aDeal){
      console.log("handleHeartClass")
      return handleHeartClassFunction(aDeal)
    }

    $scope.clickedOnHeart = function(aDeal, e){

      clickedOnHeartFunction(aDeal, $scope, e)
    }


    var localDeal = checkLocalDeals(dealId);
    if (localDeal!==null){
      $scope.deal_picked = localDeal;
      if ($scope.deal_picked.store_data.store_address!==undefined && $scope.deal_picked.store_data.store_address!==null && $scope.deal_picked.store_data.store_address!==""){
        codeGoogleMapAddress($scope.deal_picked.store_data.store_address)
      }
      showBody();
      $('#restOfBody').show();

      getSideBarDealPage($scope, $scope.deal_picked);
    }else{
      blockIt();
      getDeals({id:dealId})
      .then( function(result) {
        console.log('getDeals', result);
        $scope.$apply(function () {
          $.unblockUI();
          $scope.deal_picked = result.data;
          updateViewForDealFunction($scope.deal_picked, $scope);
          codeGoogleMapAddress($scope.deal_picked.store_data.store_address)
          showBody();
          $('#restOfBody').show();
          getSideBarDealPage($scope, $scope.deal_picked);
        })
      }).catch(function(error) {
        $.unblockUI();
        bootbox.alert("There was an error, please contact support: "+error)
      });
    }


    $scope.clickedOnDealAtSameStore = function(aDeal){
      console.log('clickedOnDealOnDealPage aDeal:'+JSON.stringify(aDeal))
      window.location.href="/#/deal?d="+aDeal.id
    }

    $(".printMe").click(function() {
      console.log("PRINT ME")

      window.print();

    })

    $scope.handleCurrency = function(currency){
      return handleCurrencyFun(currency);
    }

    $scope.handleLikesViews=function(viewsLikes){
      if (viewsLikes===undefined || viewsLikes === "" || viewsLikes ==null){
        return Number(0)
      }else{
        return Number(viewsLikes)
      }
    }

  })



  function getSideBarDealPage($scope, deal_picked){
    console.log("getSideBarDealPage deal_picked:"+JSON.stringify(deal_picked))
    getDeals({'store_name':deal_picked.store_data.store_name})
    .then( function(result) {
      console.log('getDeals storeName', result);
      $scope.$apply(function () {
        $scope.dealsAtSameStore = result.data
        //$.unblockUI();
        //$scope.deal_picked = result.data;
        //codeGoogleMapAddress($scope.deal_picked.store_data.store_address)
        //showBody();
      })
    }).catch(function(error) {
      //bootbox.alert("There was an error, please contact support: "+error)
    });
    getDeals({'city':deal_picked.store_data.city})
    .then( function(result) {
      console.log('getDeals city', result);
      $scope.$apply(function () {
        $scope.dealsAtSameCity = result.data

        //$scope.dealsAtSameStore = result.data
        //$.unblockUI();
        //$scope.deal_picked = result.data;
        //codeGoogleMapAddress($scope.deal_picked.store_data.store_address)
        //showBody();
      })
    }).catch(function(error) {
      //bootbox.alert("There was an error, please contact support: "+error)
    });
  }

  getLeafed.controller('dealsController', function($scope, $location, $route) {
    console.log("dealsController")
    navBarUser();
    $('#restOfBody').hide();
    //showBody();
    //$('#restOfBody').show();

    //$('.leafButton').addClass("is-checked")
    //$('.leafButton').addClass("active")
    //return;

    $scope.convertDistanceAway = function(d){
      console.log("ConvertDistanceAway")
      if (d === undefined || d===null){
        return ""
      }
      //console.log("returning miles")
      return d.toFixed(1) +" miles away"
    }

    $("#locationInputDeals").on("keyup", function(){
      // do stuff;
      console.log("key up on location")
      //filterValue = filterFns[ filterValue ] || filterValue;
      console.log("loc:"+$(".locationValue").val())
      var filterValue = cleanString($(".locationValue").val())
      if (filterValue !== ''){
        filterValue = "." + filterValue
      }

      //filterValue = addButtonFilter(filterValue)

      //console.log("filterValue Before:"+filterValue+" String: "+JSON.stringify(filterValue))
      //filterValue = filterFns[ filterValue ] || filterValue;
      //console.log("filterValue After:"+filterValue+" String: "+JSON.stringify(filterValue))
      $grid.isotope({ filter: filterValue });
    });

    $("#otherSearch").on("keyup", function(){
      // do stuff;
      console.log("key up on otherSearchValue")
      //filterValue = filterFns[ filterValue ] || filterValue;
      console.log("otherSearchValue:"+$(".otherSearchValue").val())
      var filterValue = cleanString($(".otherSearchValue").val())
      if (filterValue !== ''){
        filterValue = "." + filterValue
      }

      filterValue = addButtonFilter(filterValue)


      console.log("filterValue Before:"+filterValue+" String: "+JSON.stringify(filterValue))
      //filterValue = filterFns[ filterValue ] || filterValue;
      console.log("filterValue After:"+filterValue+" String: "+JSON.stringify(filterValue))
      $grid.isotope({ filter: filterValue });
    });

    $( ".filtersButton" ).click(function() {
      console.log("FILTER BUTTON")
      var fil = $( this ).attr('data-filter')
      lastFilterPressedDataFilter=$( this ).attr('data-filter')

      console.log("lastFilterPressed:"+fil+ "lastSortByValue:"+lastSortByValue);

      if (fil === "*"){

        lastFilterPressed=null;
        if (lastSortByValue!==null){
          if (lastSortByValue==="distanceaway" && local_lat!==undefined){
            dataUp = {sort_by : "distanceaway", user_lat : local_lat, user_long : local_lng}
          }else{
            dataUp = {sort_by : lastSortByValue}
          }
        }else{
          dataUp = {}
        }
        console.log("calling getDealsFun - dataUp:"+JSON.stringify(dataUp))
        getDealsFunction($scope, searchParameter, dataUp, $route, fil)
        return;
      }
      var filterToSortBy=fil.replace(".","")
      var filterToSendUp = filterToSortBy.charAt(0).toUpperCase() + filterToSortBy.substring(1);
      console.log("fToSendUp:"+filterToSendUp)
      lastFilterPressed = filterToSendUp;
      var dataUp;
      if (lastSortByValue!==null){
          if (lastSortByValue==="distanceaway" && local_lat!==undefined){
            dataUp = {type : lastFilterPressed, sort_by : "distanceaway", user_lat : local_lat, user_long : local_lng}
          }else{
            dataUp = {type : lastFilterPressed, sort_by : lastSortByValue}
          }
      }else{
        dataUp = {type : lastFilterPressed}
      }
      getDealsFunction($scope, searchParameter, dataUp, $route, fil)
      return;
    })

    $( ".sortButton" ).click(function() {
      console.log("SORT BUTTON")
      var sort = $( this ).attr('data-sort-by')
      lastSortByValueDataFilter=$( this ).attr('data-sort-by');
      console.log("sort pressed:"+sort);

      if(sort === "distanceaway"){
        console.log("SORTING distanceAway")
        lastSortByValue = "distanceaway"
        if (navigator.geolocation) {
          console.log('Geolocation is supported!');
        }else {
          bootbox.alert("Could not determine location.")
          return;
        }
        var startPos;
        var geoSuccess = function(position) {
          $.unblockUI();
          console.log("SUCCESS")
          console.log("lat:"+position.coords.latitude+ "lng:" +position.coords.longitude)
          local_lat=position.coords.latitude;
          local_lng=position.coords.longitude;
          console.log("local lat:"+local_lat)
          var dataUp;
          if(lastFilterPressed!==null && lastFilterPressed!==undefined){
             dataUp = {type : lastFilterPressed, sort_by : "distanceaway", user_lat : local_lat, user_long : local_lng}
          }else{
             dataUp = {sort_by : "distanceaway", user_lat : local_lat, user_long : local_lng}
          }

          //          getDealsFunction($scope, searchParameter, dataUp, $route, $( this ))

          getDealsFunction($scope, "", dataUp, $route, $( this ))
          return;

        }
        var geoError = function(error) {
          $.unblockUI();
          switch(error.code) {
            case error.TIMEOUT:
            // The user didn't accept the callout
            console.log("user did not accept")
            break;
          }
        };
        //$('.distanceaway').show();
        //};
        //Uncomment me to add distance away....took it out
        blockIt()
        if(testLocal){
          lastSortByValue = "distanceaway"
          var dataUp = {sort_by : "distanceaway", user_lat : 42.0238449, user_long : -87.6874041}
          getDealsFunction($scope, "", dataUp, $route, $( this ))
          //42.0238449lng:-87.6874041
        }else{
          navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
        }


        //$grid.isotope({
        //  sortBy: sortByValue,
        //  sortAscending: true
        //});
        return;
      }


      if (sort === "*"){

        lastSortByValue=null;
        if (lastFilterPressed!==null){
          dataUp = {type : lastFilterPressed}
        }else{
          dataUp = {}
        }
        console.log("calling getDealsFun - dataUp:"+JSON.stringify(dataUp))
        getDealsFunction($scope, searchParameter, dataUp, $route, $( this ))
        return;
      }
      var sortBy=sort.replace(".","")
      var sortToSendUp = sortBy;//sortBy.charAt(0).toUpperCase() + sortBy.substring(1);
      console.log("sortToSendUp:"+sortToSendUp)
      lastSortByValue = sortToSendUp;
      var dataUp;
      if (lastFilterPressed!==null){
        dataUp = {type : lastFilterPressed, sort_by : lastSortByValue}
      }else{
        dataUp = {sort_by : lastSortByValue}
      }
      getDealsFunction($scope, searchParameter, dataUp, $route, $( this ))
      return;
    })

    var searchParameter = getParameter("s")
    //To Do - search by search parameter if it's a cache load
    showBody();
    if (allDealsRetrieved!==null){
      $.unblockUI();
      $scope.deals=allDealsRetrieved;
      $('#restOfBody').show();
      //jQuery( function() {
      //  loadOtherFunctionsForDeals()
      //})
    }else{
      getDealsFunction($scope, searchParameter, null, $route, null)
    }

    $scope.convertToShortStringIfLong = function(str){
      if (str===undefined){
        return ""
      }
      if (str.length > 35){
        return str.substring(0,35)+"..."
      }
      return str;
    }

    $scope.handleHeartClass = function(aDeal){
      //$scope.$apply(function () {
      return handleHeartClassFunction(aDeal)
      //})
    }

    $scope.clickedOnStoreName  = function(aDeal, e){
      if (e!==undefined){
        e.stopPropagation();
        e.preventDefault();
      }
      //console.log("HJEREsn:"+aDeal.store_data.store_name)
      window.location.href="/#/?s="+aDeal.store_data.store_name
      //return ("/#/?s="+aDeal.store_data.store_name)
    }

    $scope.handleDescription = function(description){
      if (description === undefined){
        return ""
      }
      if (description.length>80){
        return description.substring(0,90)+"..."
      }
      return description;
    }

    $scope.clickedOnHeart = function(aDeal, e){
      clickedOnHeartFunction(aDeal, $scope, e)
    }

    $scope.clickedOnDealOnDealsPage = function(aDeal){
      console.log('clickedOnDealOnDealsPage aDeal:'+JSON.stringify(aDeal))
      window.location.href="/#/deal?d="+aDeal.id
    }

    $scope.cleanString = function(str){
      return cleanString(str)

    }

    $scope.handleDistanceAway=function(d){
      if (d===undefined || d === "" || d ==null){
        return Number(0)
      }else{
        return Number(d)
      }
    }

    $scope.handleLikesViews=function(viewsLikes){
      if (viewsLikes===undefined || viewsLikes === "" || viewsLikes ==null){
        return Number(0)
      }else{
        return Number(viewsLikes)
      }
    }

    $scope.handleCurrency=function(amount){
      return handleCurrencyFun(amount)

    }

  })

  function clickedOnHeartFunction(aDeal, $scope, e){
    console.log("heart")
    e.stopPropagation();
    e.preventDefault();
    if (firebase_user_object!==undefined && firebase_user_object !== null){
      console.log("GOOD")
      handleLikeFunction(aDeal, $scope, e)
    }else{
      bootbox.alert("You have to be signed in to do that.", function(){
        window.location.href = "/signin_user.html"
      });
    }
  }

  function handleHeartClassFunction(aDeal){
    //console.log("handle heart class function")
    if(firebase_user_object===null || firebase_user_object===undefined){
      return "fa-heart-o"
    }
    var index;
    if (thisUserLikesThisDeal(aDeal)){
      return "fa-heart"
    }else{
      return "fa-heart-o"
    }
  }

  function handleCurrencyFun(amount){
    if (amount===undefined || amount === "" || amount ==null){
      return ""
    }
    return "$"+formatMoney(amount)
  }

  function addButtonFilter(filterValue){
    if ($('.leafButton').hasClass('is-checked')){
      filterValue = filterValue + ".leaf"
    }else if ($('.vapeButton').hasClass('is-checked')){
      console.log("YES YES")
      filterValue = filterValue + ".vape"
    }else if ($('.ediblesButton').hasClass('is-checked')){
      filterValue = filterValue + ".edibles"
    }
    return filterValue

  }




  function loadOtherFunctionsForDeals($scope){

    /*if (searchParameter!==""){
    console.log("searchParameter:"+searchParameter)
    searchStrDecoded = decodeURI(searchParameter)
    console.log("searchStrDecoded:"+searchStrDecoded)
    var filterValue = cleanString(searchStrDecoded)
    if (filterValue !== ''){
    filterValue = "." + filterValue
  }
  filterValue = addButtonFilter(filterValue)
  console.log("filterValue Before:"+filterValue+" String: "+JSON.stringify(filterValue))
  $grid.isotope({ filter: filterValue });
}*/
var searchParameter = getParameter("s")
var filterValue = ""
if (searchParameter!==""){
  searchStrDecoded = decodeURI(searchParameter)
  console.log("searchStrDecoded:"+searchStrDecoded)
  var filterValue = cleanString(searchStrDecoded)
  if (filterValue !== ''){
    filterValue = "." + filterValue
  }
  filterValue = addButtonFilter(filterValue)
  $('.otherSearchValue').val(searchStrDecoded);
}

$grid = $('.grid').isotope({
  filter : filterValue,
  itemSelector: '.element-item',
  masonry:{
    isFitWidth: true
  },
  getSortData: {
    utcTime : '.utcTime parseInt',
    views: '.views parseInt',
    likes: '.likes parseInt',
    distanceaway: '.distanceaway parseInt',
    number: '.number parseInt',
    category: '[data-category]',
    weight: function( itemElem ) {
      var weight = $( itemElem ).find('.weight').text();
      return parseFloat( weight.replace( /[\(\)]/g, '') );
    }
  }
});

// filter functions
filterFns = {
  // show if number is greater than 50
  numberGreaterThan50: function() {
    var number = $(this).find('.number').text();
    return parseInt( number, 10 ) > 50;
  },
  // show if name ends with -ium
  ium: function() {
    var name = $(this).find('.name').text();
    return name.match( /ium$/ );
  }
};

//BUTTONS

/*  $('#filters').on( 'click', 'button', function() {
console.log("filters")
var fil = $( this ).attr('data-filter')
console.log("lastFilterPressed:"+fil);
var filterToSortBy=fil.replace(".","")
var filterToSendUp = filterToSortBy.charAt(0).toUpperCase() + filterToSortBy.substring(1);
console.log("fToSendUp:"+filterToSendUp)
var lastFilterPressed = filterToSendUp;
var dataUp;
if (lastSortByValue!==null){
dataUp = {type : lastFilterPressed, sort_by : lastSortByValue}
}else{
dataUp = {type : lastFilterPressed}
}
getDealsFunction($scope, searchParameter, dataUp)
return;

var filterValue = $( this ).attr('data-filter');
console.log("filterValue:"+filterValue+" "+JSON.stringify(filterValue))
if ($(".locationValue").val()!==''){
filterValue = filterValue + "." + cleanString($(".locationValue").val())
}
filterValue = filterFns[ filterValue ] || filterValue;
console.log("filter value now:"+filterValue)
$grid.isotope({ filter: filterValue });
});
*/

//LOCATION INPUT
/*
$("#locationInputDeals").on("keyup", function(){
// do stuff;
console.log("key up on location")
//filterValue = filterFns[ filterValue ] || filterValue;
console.log("loc:"+$(".locationValue").val())
var filterValue = cleanString($(".locationValue").val())
if (filterValue !== ''){
filterValue = "." + filterValue
}

//filterValue = addButtonFilter(filterValue)

//console.log("filterValue Before:"+filterValue+" String: "+JSON.stringify(filterValue))
filterValue = filterFns[ filterValue ] || filterValue;
//console.log("filterValue After:"+filterValue+" String: "+JSON.stringify(filterValue))
$grid.isotope({ filter: filterValue });
});*/

//SEARCH INPUT
$("#otherSearch").on("keyup", function(){
  // do stuff;
  console.log("key up on otherSearchValue")
  //filterValue = filterFns[ filterValue ] || filterValue;
  console.log("otherSearchValue:"+$(".otherSearchValue").val())
  var filterValue = cleanString($(".otherSearchValue").val())
  if (filterValue !== ''){
    filterValue = "." + filterValue
  }

  filterValue = addButtonFilter(filterValue)


  console.log("filterValue Before:"+filterValue+" String: "+JSON.stringify(filterValue))
  filterValue = filterFns[ filterValue ] || filterValue;
  console.log("filterValue After:"+filterValue+" String: "+JSON.stringify(filterValue))
  $grid.isotope({ filter: filterValue });
});

// bind sort button click
$('#sorts').on( 'click', 'button', function() {
  var sortByValue = $(this).attr('data-sort-by');
  lastSortByValue = $( this ).attr('data-sort-by')


  //Old Sort Method - Local
  console.log("sortByValue:"+sortByValue)
  if (sortByValue==="likes"){
    $grid.isotope({
      sortBy: sortByValue,
      sortAscending: false
    });
  }else if (sortByValue==="distanceaway"){
    console.log("SORTING distanceAway")
    var startPos;
    var geoSuccess = function(position) {
      console.log("SUCCESS")
      console.log("lat:"+position.coords.latitude+ "lng:" +position.coords.longitude)
      local_lat=position.coords.latitude;
      local_lng=position.coords.longitude;
      var index;

      for (index in $scope.deals){
        var distanceAway = distance(local_lat,
          local_lng,
          $scope.deals[index].store_data.gps_lat,
          $scope.deals[index].store_data.gps_lng,
          "M");
          if (!isNaN(distanceAway)){
            console.log("DISTANCE AWAY:"+distanceAway)
            $scope.$apply(function () {
              $scope.deals[index].store_data.distance_away = distanceAway.toFixed(1)
            })

          }
        }
        $('.distanceaway').show();
      };
      //Uncomment me to add distance away....took it out
      navigator.geolocation.getCurrentPosition(geoSuccess);


      $grid.isotope({
        sortBy: sortByValue,
        sortAscending: true
      });
    }else if (sortByValue==="views"){
      console.log("SORTING views")
      $grid.isotope({
        sortBy: sortByValue,
        sortAscending: false
      });
    }else if (sortByValue==="utcTime"){
      console.log("SORTING utcTime")
      $grid.isotope({
        sortBy: sortByValue,
        sortAscending: false
      });
    }
  });

  // change is-checked class on buttons
  $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });

}




//BUTTONS
/*
$('#filters').on( 'click', 'button', function() {
console.log("filters")
var fil = $( this ).attr('data-filter')
console.log("lastFilterPressed:"+fil);
var filterToSortBy=fil.replace(".","")
var filterToSendUp = filterToSortBy.charAt(0).toUpperCase() + filterToSortBy.substring(1);
console.log("fToSendUp:"+filterToSendUp)
var lastFilterPressed = filterToSendUp;
var dataUp;
if (lastSortByValue!==null){
dataUp = {type : lastFilterPressed, sort_by : lastSortByValue}
}else{
dataUp = {type : lastFilterPressed}
}
getDealsFunction($scope, searchParameter, dataUp)
return;
var filterValue = $( this ).attr('data-filter');
console.log("filterValue:"+filterValue+" "+JSON.stringify(filterValue))
if ($(".locationValue").val()!==''){
filterValue = filterValue + "." + cleanString($(".locationValue").val())
}
filterValue = filterFns[ filterValue ] || filterValue;
console.log("filter value now:"+filterValue)
$grid.isotope({ filter: filterValue });
});
*/


function formatMoney(number, decPlaces, decSep, thouSep) {
  decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
  decSep = typeof decSep === "undefined" ? "." : decSep;
  thouSep = typeof thouSep === "undefined" ? "," : thouSep;
  var sign = number < 0 ? "-" : "";
  var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
  var j = (j = i.length) > 3 ? j % 3 : 0;

  return sign +
  (j ? i.substr(0, j) + thouSep : "") +
  i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
  (decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
}


function thisUserLikesThisDeal(aDeal){
  //console.log("uid:"+firebase_user_object.uid)
  if (aDeal===undefined){
    return;
  }
  if (aDeal.hasOwnProperty("user_likes")){
    console.log("hasUserLikes")
    var index;
    for (index in aDeal.user_likes){
      if (aDeal.user_likes[index]===firebase_user_object.uid){
        return true;
      }
    }
  }else{
    return false;
  }
  return false;
}

function handleLikeFunction(aDeal, $scope, $event){
  var thisOne=$event.currentTarget;
  blockIt();
  if (thisUserLikesThisDeal(aDeal)){
    //UNLIKE IT
    console.log("UNLIKE IT")
    //$(thisOne).removeClass("fa-heart");
    //$(thisOne).addClass("fa-heart-o");
    var thisOne=$event.currentTarget;
    //$( document ).ready(function() {
    $(thisOne).removeClass("fa-heart");
    $(thisOne).addClass("fa-heart-o");
    //})
    aDeal['likes'] = Number(aDeal.likes) - 1
    var index = aDeal.user_likes.indexOf(firebase_user_object.uid);
    if (index > -1) {
      aDeal['user_likes'].splice(index, 1);
    }
  }else{
    //LIKE IT
    console.log("LIKE IT")
    $(thisOne).removeClass("fa-heart-o");
    $(thisOne).addClass("fa-heart");
    if (aDeal.hasOwnProperty('likes')){
      aDeal['likes'] = Number(aDeal.likes) + 1
    }else{
      aDeal['likes'] = 1
    }
    if (aDeal['user_likes']===undefined || aDeal['user_likes'] === null || aDeal['user_likes'].length===0){
      console.log("New User Likes")
      aDeal['user_likes']= []
      aDeal['user_likes'].push(firebase_user_object.uid)
    }else{
      console.log("adding")

      aDeal['user_likes'].push(firebase_user_object.uid)
    }
    //like it
  }
  console.log("A DEAL NOW:"+JSON.stringify(aDeal))
  updateLikes(aDeal)
  .then( function(result) {
    console.log('updateLikes', result);
    $scope.$apply(function () {
      $.unblockUI();
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
}

function getDealsFunction($scope, searchParameter, dataUp, $route, buttonPressed){
  blockIt();
  var data={}
  if (data!==undefined){
    data=dataUp;
  }
  console.log("calling getDeals data:"+JSON.stringify(data))
  //$('.navBarFooter').hide();
  getDeals(data)
  .then( function(result) {
    console.log('getDeals', JSON.stringify(result.data));
    $scope.$apply(function () {
      $.unblockUI();
      $scope.deals=result.data;
      allDealsRetrieved = result.data;
      //updateHearts();
      $route.reload();

      if (data!==null && data.hasOwnProperty('user_lat')){
        $( document ).ready(function() {
          console.log("SHOWING DISTANCE AWAY")
          $('.distanceaway').show();
          $('.sortButton').removeClass('is-checked');
          $('.filtersButton').removeClass('is-checked');
          $('.filtersButton[data-filter="'+lastFilterPressedDataFilter+'"]').addClass('is-checked');
          $('.sortButton[data-sort-by="'+"distanceaway"+'"]').addClass('is-checked');
        })
        $('#restOfBody').show();
        return;
      }

      var searchParameter = getParameter("s")
      var filterValue = "*"
      if (searchParameter!==""){
        searchStrDecoded = decodeURI(searchParameter)
        console.log("searchStrDecoded:"+searchStrDecoded)
        var filterValue = cleanString(searchStrDecoded)
        if (filterValue !== ''){
          filterValue = "." + filterValue
        }
        filterValue = addButtonFilter(filterValue)
        $( document ).ready(function() {
          $('.otherSearchValue').val(searchStrDecoded);
        })
      }



      jQuery( function() {
        $grid = $('.grid').isotope({
          filter:filterValue,
          itemSelector: '.element-item',
          masonry:{
            isFitWidth: true
          }
          /*,
          getSortData: {
          utcTime : '.utcTime parseInt',
          views: '.views parseInt',
          likes: '.likes parseInt',
          distanceaway: '.distanceaway parseInt',
          number: '.number parseInt',
          category: '[data-category]',
          weight: function( itemElem ) {
          var weight = $( itemElem ).find('.weight').text();
          return parseFloat( weight.replace( /[\(\)]/g, '') );
        }
      }*/
    });
  })
  $route.reload();


  $('#restOfBody').show();
  //This happens because of the route reload above
  if (buttonPressed !=null){
    console.log("ADDING lastFilterPressedDataFilter:"+lastFilterPressedDataFilter+ " lastSortByValueDataFilter:"+lastSortByValueDataFilter)
    $( document ).ready(function() {
      $('.sortButton').removeClass('is-checked');
      $('.filtersButton').removeClass('is-checked');
      $('.filtersButton[data-filter="'+lastFilterPressedDataFilter+'"]').addClass('is-checked');
      $('.sortButton[data-sort-by="'+lastSortByValueDataFilter+'"]').addClass('is-checked');
    })
  }
  if (lastSortByValue!==null){

  }
})
}).catch(function(error) {
  $.unblockUI();
  bootbox.alert("There was an error, please contact support: "+error)
});
}

function cleanString(str){
  if (str===undefined){
    return "";
  }
  var returning = str.split(" ").join("-").toLowerCase();
  //console.log("returning:"+returning)
  return returning
}

$(".userSignIn").on('click', function(e) {
  e.preventDefault();
  console.log("usersignin clicked")
  window.location.href = "/signin_user.html"
});

$(".ownerSignIn").on('click', function(e) {
  e.preventDefault();
  console.log("ownerSignIn clicked")
  window.location.href = "/signin_owner.html"
});

$(".signOutUser").on('click', function(e) {
  e.preventDefault();
  signUserOut();
  window.location.href = "/"
});

$(".signOutStore").on('click', function(e) {
  console.log("SIGN OUT STORE")
  e.preventDefault();
  signUserOut();
  window.location.href = "/"
});


function signUserOut(){
  console.log("signOut clicked")
  firebase.auth().signOut().then(function() {
    signedIn = false;
    handleSignOut();
  }, function(error) {
    console.error('Sign Out Error', error);
  });
}

function navBarUser(){
  $('.navbarUser').show();
  $('.navbarStore').hide();
  //navBarFooter
  $('.navBarFooter').show();

}

function showBody(){
  $('.showBody').show();
}

function navBarStore(){
  $('.navbarUser').hide();
  $('.navbarStore').show();
  $('.navBarFooter').hide();

}

function checkUserData(){
  if ($('#email').val() === ""){
    bootbox.alert("Email can not be blank.");
    return false;
  }

  /*  if ($('#city').val() === ""){
  bootbox.alert("City can not be blank.");
  return false;
}*/

var suite = ""
if ($('#suite').val()!==''){
  suite = $('#suite').val()+""
}
var data = {
  first_name : $('#first_name').val(),
  last_name : $('#last_name').val(),
  email : $('#email').val(),
  street_address : $('#street_address').val(),
  suite : $('#suite').val(),
  zip : $('#zip').val(),
  city : $('#city').val(),
  state : $('#state').val(),
  subscribed_to_email : $("#subscribed").prop("checked"),
  street_address : $('#street_address').val() + suite + " , " + $('#city').val()+ " , " + $('#state').val() + " " + $('#zip').val()
}
return data;
}

function checkStoreData(uid){
  if ($('#first_name').val() === ""){
    bootbox.alert("First name can not be blank.");
    return false;
  }
  if ($('#last_name').val() === ""){
    bootbox.alert("Last name can not be blank.");
    return false;
  }
  if ($('#email').val() === ""){
    bootbox.alert("Email can not be blank.");
    return false;
  }
  if ($('#phone').val() === ""){
    bootbox.alert("Phone can not be blank.");
    return false;
  }
  if ($('#store_name').val() === ""){
    bootbox.alert("Store name can not be blank.");
    return false;
  }
  if ($('#street_address').val() === ""){
    bootbox.alert("Street address can not be blank.");
    return false;
  }
  if ($('#zip').val() === ""){
    bootbox.alert("Zip can not be blank.");
    return false;
  }
  if ($('#city').val() === ""){
    bootbox.alert("City can not be blank.");
    return false;
  }
  if ($('#state').val() === ""){
    bootbox.alert("State can not be blank.");
    return false;
  }

  var suite = ""
  if ($('#suite').val()!==''){
    suite = $('#suite').val()+""
  }
  var data = {
    first_name : $('#first_name').val(),
    last_name : $('#last_name').val(),
    email : $('#email').val(),
    phone : $('#phone').val(),
    store_name : $('#store_name').val(),
    street_address : $('#street_address').val(),
    suite : $('#suite').val(),
    zip : $('#zip').val(),
    city : $('#city').val(),
    state : $('#state').val(),
    uid : firebase.uid,
    store_address : $('#street_address').val() + suite + " , " + $('#city').val()+ " , " + $('#state').val() + " " + $('#zip').val()
  }
  return data;
}

function checkPostADealData(image_name){
  if ($('#deal_name').val() === ""){
    bootbox.alert("Deal name can not be blank.");
    return false;
  }
  if ($('#deal_description').val() === ""){
    bootbox.alert("Deal description can not be blank.");
    return false;
  }
  if ($('.dealType').text().trim() === "Type"){
    bootbox.alert("You have to choose a deal type.");
    return false;
  }

  if ($('.whichStore').text().trim() === "Which Store"){
    bootbox.alert("You have to choose a store.");
    return false;
  }
  console.log("P:"+$('#previous_price').val())
  if ($('#previous_price').val() !== ""){
    if (isNaN($('#previous_price').val())){
      bootbox.alert("The previous price has to be a numeric value.");
      return false;
    }
  }

  if ($('#new_price').val() !== ""){
    if (isNaN($('#new_price').val())){
      bootbox.alert("The previous price has to be a numeric value.");
      return false;
    }
  }

  if (image_name ==='' || image_name ===undefined || image_name===null){
    image_name = "/images/temp.jpg"
  }

  console.log("deal type:"+$('.dealType').text().trim())
  console.log("Store Selected:"+JSON.stringify(store_selected))
  var data = {
    deal_name : $('#deal_name').val(),
    deal_description : $('#deal_description').val(),
    which_store : $('.whichStore').text(),
    store_data : store_selected,
    store_id : $('.whichStore').attr("data-id"),
    previous_price : $('#previous_price').val(),
    new_price : $('#new_price').val(),
    image_name : image_name,
    is_active : $("#is_active").prop("checked"),
    uid : firebase_user_object.uid,
    utc_time : (Math.floor(Date.now() / 1000)),
    type : $('.dealType').text().trim()
  }
  return data;
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log("user signed in")
    firebase_user_object = user;
    signedIn = true;
    //To Do - Add Signout Button
    //console.log("USER:"+JSON.stringify(user))
    handleSignIn();
    //if (user.displayName !== undefined && user.displayName !== null && user.displayName !==""){
    //  $('#Signinbutton').text("Sign Out")
    //}else{
    //  $('#Signinbutton').text("Sign Out")
    //}
  } else {
    console.log("user not signed in");
    signedIn = false;
    handleSignOut();
  }
});

function handleSignIn(){
  console.log("handleSignIn")

  $('.toggleSignIn').text('You Are Signed In')
  $('.userSignIn').hide();
  $('.ownerSignIn').hide();
  $('.userProfileMenu').show();

  $('.signOut').show();
}

function handleSignOut(){
  console.log("handleSignOut")
  $('.toggleSignIn').text('Login')
  $('.userSignIn').show();
  $('.userProfileMenu').hide();

  $('.ownerSignIn').show();
  $('.signOutUser').hide();
  $('.signOutOwner').hide();
}

function showAlert(message, shouldKeepMessageUp){
  $(document).ready(function() {

    if (message!==""){
      $('.alertProfilePageText').text(message)
    }
    // show the alert
    console.log("showing alert")
    $('#alertProfilePage').show();
    if (shouldKeepMessageUp===true){
      setTimeout(function() {
        $("#alertProfilePage").slideUp(500)
      }, 10000);
    }else{
      setTimeout(function() {
        $("#alertProfilePage").slideUp(500)
      }, 3000);
    }

  });
}


function readImage(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      console.log("GOT IT");
      $('#dealImage').attr('src', e.target.result);
      $('#dealImage').show();
      $('#chooseDealButton').show();
    }
    reader.readAsDataURL(input.files[0]);
  }else{
    $('#dealImage').hide();
  }
}

function blockIt(){
  $.blockUI({ message: '' });
}

function makeid(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++)
  text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function getParameter(parameter){
  if (window.location.href.split(parameter+"=").length>=2){
    return window.location.href.split(parameter+"=")[1]
  }
  return ""
}

function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  }
  else {
    var radlat1 = Math.PI * lat1/180;
    var radlat2 = Math.PI * lat2/180;
    var theta = lon1-lon2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist;
  }
}


function loadGeocoderAndConvertToGps(address, city){
  geocoder = new google.maps.Geocoder();


  geocoder.geocode( { 'address': address}, function(results, status) {
    console.log("GOT ADDRESS!!! address:"+address)
    if (status == 'OK') {
      console.log("GOT IT:"+results[0].geometry.location)
    } else {
      console.log("could not get GPS")
    }
  });
}

function getAddressFromGps(latNum, lngNum){
  geocoder = new google.maps.Geocoder();
  var latlng = {lat: parseFloat(latNum), lng: parseFloat(lngNum)};


  geocoder.geocode( { 'location': latlng}, function(results, status) {
    if (status == 'OK') {
      console.log("GOT IT:"+results[0].formatted_address)
    } else {
      console.log("could not get address")
    }
  });
}


function handleImageUpload(imageFile, imageRef, $scope, dealToUpdate) {

  //var imageFile = event.target.files[0];
  console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
  console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

  var options = {
    maxSizeMB: .5,
    maxWidthOrHeight: 500,
    useWebWorker: true
  }
  imageCompression(imageFile, options)
  .then(function (compressedFile) {
    console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
    console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB
    var uploadTask = imageRef.put(compressedFile)
    .then(snapshot => snapshot.ref.getDownloadURL())
    .then((url) => {
      //.then(function(snapshot) {
      console.log('url:'+url);
      return addUpdateDealFunction(url, $scope, dealToUpdate)
    });
    //return uploadToServer(compressedFile); // write your own logic
  })
  .catch(function (error) {
    console.log(error.message);
  });
}



// external js: isotope.pkgd.js


// init Isotope
