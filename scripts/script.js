var inventoryApp = angular.module('inventoryApp', ['ui.router', 'mdo-angular-cryptography','permission','permission.ui','ui.bootstrap','firebase']);
var permission = false;
// Inventory App Configuration
inventoryApp.config(function($stateProvider, $urlRouterProvider){

  // Start on home page
  $urlRouterProvider.otherwise('/item_lookup');

  // List of views
  $stateProvider
  .state('home',{
    url: '/home',
    templateUrl:'home.html'
  })


  .state('item_lookup',{
    url: '/item_lookup',
    templateUrl:'lookup.html'
  })

  .state('login',{
    url: '/login',
    templateUrl: 'login.html'
  })


  // .state('amin',{
  //   url: '/admin',
  //   // onEnter: ['$stateParams', '$state', '$modal', '$resource', function($stateParams, $state, $modal, $resource){
  //   //   // $modal.open({
  //   //   //   templateUrl:'admin.html'
  //   //   // })
  //   // }]
  // })


// .state("admin", {
//       url: "/admin",
//       onEnter: ['$stateParams', '$state', '$modal', '$resource', function($stateParams, $state, $modal, $resource) {
//           $modal.open({
//               templateUrl: "admin.html",
//               resolve: {
//                 item: function() { new Item(123).get(); }
//               },
//               controller: ['$scope', 'item', function($scope, item) {
//                 $scope.dismiss = function() {
//                   $scope.$dismiss();
//                 };
//
//                 $scope.save = function() {
//                   item.update().then(function() {
//                     $scope.$close(true);
//                   });
//                 };
//               }]
//           }).result.finally(function() {
//               $state.go('^');
//           });
//       }]
//   });



  .state('admin',{
    url: '/admin',
    templateUrl: 'admin.html',
    controller: ['$scope', function($scope){
      $scope.hello = "what's up?";


    }],

    onEnter: function(){
      inventoryApp.controller('inventoryCtrl', '$scope', function($scope){
        console.log($scope.hello);
      })
    }
    // onEnter: function(){
    //
    //
    //
    //   // jQuery.get('http://localhost:3000/users', function(data){
    //   //   console.log(data);
    //   // });
    //
    //
    //
    //   // if(permission){
    //   //   console.log("permission is true");
    //   //   window.location.href = '/#/admin';
    //   // }
    //   // else{
    //   //   console.log("permission is false");
    //   //   window.location.href = '/#/notreal';
    //   // }
    //
    //
    // }

  })


});

// Set up Encryption
inventoryApp.config(['$cryptoProvider', function($cryptoProvider){
    $cryptoProvider.setCryptographyKey('ABCD123');
}]);//End App Configuration


// Service for Users
inventoryApp.service('dbUsers',['$http', '$firebase', function ($http, $firebase) {

  // var ref = new Firebase("https://allenmartindaledata.firebaseio.com/works");
  var ref = new Firebase("https://alinventory-bce5f.firebaseio.com/users");
  var fb = $firebase(ref);
  var syncObject = fb.$asObject();

  console.log(fb);

  console.log(syncObject);



  // Get Users From Database
  this.getUser = function(){
    return $http.get('http://localhost:3000/users');
  }
  this.createUser = function(data){
    return $http.post('http://localhost:3000/users', data);
  }
  this.deleteUser = function(id){
    return $http.delete('http://localhost:3000/users/' + id);
  }
  this.updateUser = function(id, data){
    return $http.put('http://localhost:3000/users/' + id, data);
  }

}]);

// Service for Stock
inventoryApp.service('dbStock',['$http', function($http){
  // Get Stock From Database
  this.getStock = function(){
    return $http.get('http://localhost:3000/stock');
  }

  this.createStock = function(data){
    return $http.post('http://localhost:3000/stock', data);
  }
  this.deleteStock = function(id){
    return $http.delete('http://localhost:3000/stock/' + id);
  }
  this.updateStock = function(id, data){
    return $http.put('http://localhost:3000/stock/' + id, data);
  }
}]);

// Service for Checked Items
inventoryApp.service('dbCheckedItems',['$http', function($http){
  // Get Checked Items From Database
  this.getCheckedItems = function(){
    return $http.get('http://localhost:3000/checkedItems');
  }
  // Check out item (Post)
  this.checkOutItem = function(data){
    return $http.post('http://localhost:3000/checkedItems/', data);
  }
  // Return Item (Delete)
  this.returnItems = function(id){
    return $http.delete('http://localhost:3000/checkedItems/' + id);
  }
}]);

// Search Feature
  // Search for Items
inventoryApp.filter('searchForStock', function(){

  return function(arr, searchStock){

    if(!searchStock){
      return arr;
    }

    var result = [];

    searchStock = searchStock.toLowerCase();

    angular.forEach(arr, function(item){

      if(item.name.toLowerCase().indexOf(searchStock) !== -1 || item.type.toLowerCase().indexOf(searchStock) !== -1){
        result.push(item);
      }
    });

    return result;
  }
});



  // Search for Users
  inventoryApp.filter('searchForUser', function(){

    return function(arr, searchUser){

      if(!searchUser){
        return arr;
      }

      var result = [];

      searchUser = searchUser.toLowerCase();

      angular.forEach(arr, function(user){

        if(user.fname.toLowerCase().indexOf(searchUser) !== -1 || user.lname.toLowerCase().indexOf(searchUser) !== -1){
          result.push(user);
        }
      });

      return result;
    }
  });




// Put into Controller to use on page
inventoryApp.controller('inventoryCtrl', ['$scope', 'dbUsers', 'dbStock', 'dbCheckedItems', '$crypto', function($scope, dbUsers, dbStock, dbCheckedItems, $crypto){



// Encryption Test

var testCrypt = '5132'
var encrypted = $crypto.encrypt(testCrypt);
var decrypted = $crypto.decrypt(encrypted);



// /////////
// USERS
// /////////

  // Get Users
  dbUsers.getUser().success(function(data){
    $scope.dbUsers = data;

    // console.log($scope.dbUsers);
  });

  // Create Users
  $scope.newUser = {};

  $scope.createNewUser = function(){
    if($scope.newUser.fname == null || $scope.newUser.lname == null || $scope.newUser.pin == null){
      console.log("Empty Field!")
    }else{

      dbUsers.createUser($scope.newUser = {
        "fname" : $scope.newUser.fname.toUpperCase(),
        "lname" : $scope.newUser.lname.toUpperCase(),
        "pin" : $crypto.encrypt($scope.newUser.pin.toString())
      });

      window.location.reload();
    }
  }
  // Delete Users
  $scope.removeUser = function(){

    var id = $('#updateUserID').val();

    dbUsers.deleteUser(id);

    window.location.reload();
  };

  // ////////////
  // Edit Users
  // ////////////

  // Close Edit User Window
  $scope.closeEditUser = function(){
    $("#editUser").css("display","none");
  };

  // Pull In User Data
  $scope.editUser = function(){
    $('#editUser').css("display","block");

    $scope.updatedUser = {
      "fname" : this.user.fname,
      "lname" : this.user.lname
    }

    $('#updateUserID').val(this.user.id);

  };

  // Update User
  $scope.reviseUser = function(data){

    data.fname = data.fname.toUpperCase();
    data.lname = data.lname.toUpperCase();
    data.pin = $crypto.encrypt(data.pin.toString())

    var id = $('#updateUserID').val();

    dbUsers.updateUser(id, data).success(function(resp){

      window.location.reload();
    });
  };

// ///////////
// STOCK
// ///////////

  // Get Stock
  dbStock.getStock().success(function(data){
    $scope.dbStock = data;
    // console.log($scope.dbStock);
  });

  // Create Stock
  $scope.newStock = {};

  $scope.createNewStock = function(){
    if($scope.newStock.name == null || $scope.newStock.type == null){
      console.log("Empty field!")
    }else{
      dbStock.createStock($scope.newStock);
      window.location.reload();
    }
  };

  // Delete Stock
  $scope.removeStock = function(){

    var id = $('#updateID').val();

    dbStock.deleteStock(id);

		window.location.reload();
	};

  // Edit Stock
  $scope.closeEditStock = function(){
    $("#editStock").css("display","none");
  };
  $scope.editStock = function(){
    $("#editStock").css("display","block");
    $('#updateName').val(this.item.name);
    $('#updateType').val(this.item.type);
    $('#updateID').val(this.item.id);
    $('#updateNotes').val(this.item.notes);
  };
  $scope.reviseStock = function(data){

    var id = $('#updateID').val();

    dbStock.updateStock(id, data).success(function(resp){
      console.log(resp);
      window.location.reload();
    });
  };

// //////////////
// ITEM CHECK
// //////////////

// Global Variables
var stockID;
var checkedItemID;
var checkedItemUserName;

  // /////////////////
  // Check Item Status
  // /////////////////

  $scope.itemStatus = function(itemName){

    if($scope.dbCheckedItems.length == 0){
      $('#itemStatus').html("Available");
      $('#checkOutForm').css('display','block');
      $('#returnForm').css('display','none');
    }else {
      //Check the Checked Items List
      for(var i = 0; i < $scope.dbCheckedItems.length; i++){

        if($scope.dbCheckedItems[i].name == itemName){
          // Check the Stock List
          for(var b = 0; b < $scope.dbStock.length; b++){
            if($scope.dbCheckedItems[i].name == $scope.dbStock[b].name){
              $('#itemStatus').html("Unavailable");
              $('#checkOutForm').css('display','none');
              $('#returnForm').css('display','block');

              //Set Global Checked Items
              checkedItemID = $scope.dbCheckedItems[i].id;
              checkedItemUserName = $scope.dbCheckedItems[i].user;

              $scope.checkedUser = checkedItemUserName;

            }
          }//End Check the Stock List
          break;
        }else{
          $('#itemStatus').html("Available");
          $('#checkOutForm').css('display','block');
          $('#returnForm').css('display','none');
        }
      }//End Check Checked Items List
    }//End Else Statement For Check Item Status

  };




  // View Item
  $scope.itemClick = function(){
    $('#viewItem').css("display","block");
    $('#viewItem h1').html(this.item.name);
    // $('.itemNotes').html($scope.findLineBreak(this.item.notes));
    $('.itemNotes').html(this.item.notes);

    $scope.checkedOutItem.name = this.item.name;

    stockID = this.item.id;

    $scope.itemStatus(this.item.name);

  };

  // Close View Item
  $scope.closeViewItem = function(){
    $('#viewItem').css("display","none");
    $('.itemNotes').html("");
  };

  // Get Checked Items
  dbCheckedItems.getCheckedItems().success(function(data){
    $scope.dbCheckedItems = data;

    // console.log($scope.dbCheckedItems);
  });

  // //////////////
  // Check Out Item
  // //////////////

  // Check Out Item
  $scope.checkedOutItem = {};

  $scope.checkOut = function(){

    if($scope.checkedOutItem.user == null || $scope.checkOutPin == null){
      console.log("Empty Field!");
    }else if($scope.checkPin($scope.checkedOutItem.user, $scope.checkOutPin)){
      // If the password matches, a successful checkout will occur

      dbCheckedItems.checkOutItem($scope.checkedOutItem);
      window.location.reload();

    }else if(!$scope.checkPin($scope.checkedOutItem.user, $scope.checkOutPin)){
      // If password doesn't match, they will be prompted to try again

      console.log("Password didn't Match, try again")

    }

  };

  // ////////////
  // Return Item
  // ////////////

  $scope.returnItem = function(){

    if($scope.returnPin == null){
      console.log("There is an empty Field!")
    }else if($scope.checkPin($scope.checkedUser, $scope.returnPin)){
      id = stockID;
      data = {
        "lastUser" : checkedItemUserName
      };

      console.log("Password Matched, Return Successful")

      dbStock.updateStock(id, data);

      dbCheckedItems.returnItems(checkedItemID);
      window.location.reload();
    }else if(!$scope.checkPin($scope.checkedUser, $scope.returnPin)){

      console.log("Password didn't match, try again");
    }

  };



  // ///////////////
  // Admin Controls
  // ///////////////

  // Hide Buttons
  $scope.selectStock = function(){
    $('#viewUsersButton').toggle();
    $('#viewUsersButtonGrey').toggle();
    $('#viewStock').toggle();
    $('#createStock').css('display','none');

  }
  $scope.openCreateStock = function(){
    $('#createStock').toggle();
  }
  $scope.selectUsers = function(){
    $('#viewStockButton').toggle();
    $('#viewStockButtonGrey').toggle();
    $('#viewUsers').toggle();
    $('#createUser').css('display','none');
  }
  $scope.openCreateUser = function(){
    $('#createUser').toggle();
  }

  // Reveal Buttons
  $scope.revealUsersButton = function(){
    $('#viewUsersButtonGrey').toggle();
    $('#viewUsersButton').toggle();
    $('#viewStock').toggle();
  }
  $scope.revealStockButton = function(){
    $('#viewStockButtonGrey').toggle();
    $('#viewStockButton').toggle();
    $('#viewUsers').toggle();
  }


  // ////////////
  // Functions
  // ////////////

  // Compare Username and Pin
  $scope.checkPin = function(user, pin){
    $scope.dbUsers;

    dbUsers.getUser().success(function(data){
      $scope.dbUsers = data;
    });//End Get User Function

    for(var i = 0; i < $scope.dbUsers.length; i++){
      // Loop through names and find match
      if(user == $scope.dbUsers[i].fname + ' ' + $scope.dbUsers[i].lname){
        // Confirm Pin Matches
        if($crypto.decrypt($scope.dbUsers[i].pin) == pin){
          return true;
        }else{
          return false;
        }
      }//End Match Names If Statement
    }//End Loop through names
  }//End Check Pin Function

  // Find Line Breaks
  $scope.findLineBreak = function(info){
    if(info == null){
      return info;
    }else{
      return info.replace("\n","<br>")
    }
  }

  // Hide/Show Search List




}]);//End of controller


// jquery
$(document).ready(function(){

  // Open/Close Menu
  $('nav i').click(function(){
    $('#navLinks').css("display","block");

  });

  $('#navLinks i').click(function(){
    $('#navLinks')
    .css("display","none");
  });

  $('#navLinks a').click(function(){
    $('#navLinks')
    .css("display","none");
  });


});//End jQuery

// jQuery UI
