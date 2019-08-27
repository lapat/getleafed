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

//firebase.functions().useFunctionsEmulator("http://localhost:5001")

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
})
var $grid;
var filterFns;

getLeafed.controller('aSingleDealController', function($scope, $location) {
  console.log("aSingleDealController")
  //codeGoogleMapAddress(cannabis_taxi_user_local.street_address + ", " + cannabis_taxi_user_local.city + ", "+ cannabis_taxi_user_local.state + " " + cannabis_taxi_user_local.zip)
  codeGoogleMapAddress("1103 Mulford Street, Evanston, Illinois, 60202")

})

getLeafed.controller('dealsController', function($scope, $location) {
  console.log("dealsController")

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







// external js: isotope.pkgd.js


// init Isotope
