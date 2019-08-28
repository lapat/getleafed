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

var firebase_user_object;
var signedIn = false;

firebase.functions().useFunctionsEmulator("http://localhost:5001")
var addDeal = firebase.functions().httpsCallable('addDeal');
var getDeals = firebase.functions().httpsCallable('getDeals');

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
  //
})
var $grid;
var filterFns;


getLeafed.controller('postDealController', function($scope, $location) {
  console.log("postDealController")
  navBarStore();
  showBody();

  $(function(){
    $(".dealTypeDropDown").on("click", "a", function(event){
      var selected = $(this).html();
      console.log("You clicked the drop downs", selected)
      $('.dealType').text(selected)

    })
  })

  $(function(){
    $(".whichStoreDropDown").on("click", "a", function(event){
      var selected = $(this).html();
      console.log("You clicked the drop downs", selected, " id:"+$(this).attr("data-id"))
      $('.whichStore').text(selected)
      $('.whichStore').attr('data-id', $(this).attr('data-id'));
      console.log("id is now:" + $('.whichStore').attr("data-id"))
    })
  })

  $( "#addStoreDeal" ).click(function() {
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
      var uploadTask = imageRef.put(photo)
      .then(snapshot => snapshot.ref.getDownloadURL())
      .then((url) => {
      //.then(function(snapshot) {
        console.log('url:'+url);
        addDealFunction(url, $scope)
      });
    }else{
      console.log("photo is null")
      addDealFunction('', $scope)
    }
  })
})

function addDealFunction(imageName, $scope){
  console.log("addDeal")
  var data = checkPostADealData(imageName);
  console.log("sending up this data:"+JSON.stringify(data))
  //return;
  //return;

  addDeal(data)
  .then( function(result) {
    console.log('addDealFunction', result);
    $scope.$apply(function () {
      $.unblockUI();
      bootbox.alert("Your deal was added successfully, go to your store deals tab to check all your deals.")
      clearAddDealInputs();
    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });
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
  navBarStore();
  showBody();

  $(".addDealRow").on('click', function(e) {
    e.preventDefault();
    console.log("addDealRow")
    //if (signedIn){}
  });

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

  $scope.clickedOnDealRow = function(aDeal){
    console.log("aDeal:"+JSON.stringify(aDeal))
  };

  blockIt();
  getDeals()
  .then( function(result) {
    console.log('getDealsFunction', result);
    $scope.$apply(function () {
      $.unblockUI();
      //$scope.store_deals=[{date : 'kdkdkdk'}, {date : 'kasdfasdfasdfas'}, {date : 'a'}]
      $scope.store_deals=result.data;

      $(document).ready(function() {
        console.log("DT")
        //$('#example').DataTable();
        $('#dealsTable').DataTable( {
          "paging":   false,
          "ordering": true,
          "info":     false
        } );

    })
  }).catch(function(error) {
    $.unblockUI();
    bootbox.alert("There was an error, please contact support: "+error)
  });



    /*$('#dealsTable').scrollTableBody();*/
  })

})



getLeafed.controller('storeProfileController', function($scope, $location) {
  console.log("storeProfileController")
  navBarStore();
  showBody();
})

getLeafed.controller('subscribeController', function($scope, $location) {
  console.log("subscribeController")
  navBarUser();
  showBody();
})

getLeafed.controller('aSingleDealController', function($scope, $location) {
  console.log("aSingleDealController")
  navBarUser();
  //codeGoogleMapAddress(cannabis_taxi_user_local.street_address + ", " + cannabis_taxi_user_local.city + ", "+ cannabis_taxi_user_local.state + " " + cannabis_taxi_user_local.zip)
  codeGoogleMapAddress("1103 Mulford Street, Evanston, Illinois, 60202")
  showBody();


})

getLeafed.controller('dealsController', function($scope, $location) {
  console.log("dealsController")
  navBarUser();
  showBody();

  // bind filter button click
  $('.element-item').click(
    function(){
      window.location.href = "/#/deal"

    }
  )


  $grid = $('.grid').isotope({
    itemSelector: '.element-item',
    layoutMode: 'fitRows',
    getSortData: {
      name: '.name',
      symbol: '.symbol',
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

  // bind filter button click
  $('#filters').on( 'click', 'button', function() {
    console.log("filters")
    var filterValue = $( this ).attr('data-filter');
    // use filterFn if matches value
    filterValue = filterFns[ filterValue ] || filterValue;
    $grid.isotope({ filter: filterValue });
  });

  // bind sort button click
  $('#sorts').on( 'click', 'button', function() {
    var sortByValue = $(this).attr('data-sort-by');
    $grid.isotope({ sortBy: sortByValue });
  });







  // change is-checked class on buttons
  $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });

  $(".heart.fa").click(function() {
    $(this).toggleClass("fa-heart fa-heart-o");
    console.log("CLICKED")
  });


})


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

  if (image_name ==='' || image_name ===undefined || image_name===null){
    image_name = "/images/temp.jpg"
  }

  var data = {
    deal_name : $('#deal_name').val(),
    deal_description : $('#deal_description').val(),
    which_store : $('.whichStore').text(),
    store_id : $('.whichStore').attr("data-id"),
    previous_price : $('#previous_price').val(),
    new_price : $('#new_price').val(),
    image_name : image_name,
    is_active : $("#is_active").prop("checked"),
    uid : firebase_user_object.uid,
    utc_time : (Math.floor(Date.now() / 1000))
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
  $('.signOut').show();
}

function handleSignOut(){
  console.log("handleSignOut")
  $('.toggleSignIn').text('Login')
  $('.userSignIn').show();
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
// external js: isotope.pkgd.js


// init Isotope
