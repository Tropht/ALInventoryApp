var inventoryApp = angular.module('inventoryApp', ['ui.router', 'mdo-angular-cryptography','permission','permission.ui','ui.bootstrap']);
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

  })



});

// Set up Encryption
inventoryApp.config(['$cryptoProvider', function($cryptoProvider){
    $cryptoProvider.setCryptographyKey('ABCD123');
}]);//End App Configuration


inventoryApp.config(function ($httpProvider) {
  $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {};
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
});

//////////////////////////////
///Authentication Service ACW
/////////////////////////////
inventoryApp.service('authService', function(){

  this.auth = firebase.auth();
  this.login = function(email, pass){
    this.auth.signInWithEmailAndPassword(email, pass).then(function(user){

      if(user){
        jQuery('#loginError').addClass("alert alert-danger").html("Success!");
        //jQuery('#loginModal').modal('hide');
        window.location = "#/admin";
      }

    }).catch(function(error){

      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      jQuery('#loginError').addClass("alert alert-danger").html(errorMessage);

    });
    var user = this.auth.currentUser;
    //console.log(user);
  }///close this.login

});

////////////////////////
///Login Controller ACW
///////////////////////
inventoryApp.controller('loginController', function($scope, authService){

  $scope.uName; //linked to login inputs by ng-model
  $scope.uPass;
  $scope.uError;

  $scope.login = function(){

    authService.login($scope.uName, $scope.uPass);

  }
})

///just a test ACW
console.log(firebase.database().ref)

///////////////////////
// Service for Users
//////////////////////
inventoryApp.service('dbUsers',['$http', function ($http) {

  // Get Users From Database
  this.getUser = function(){
    return $http.get('https://alinventory-bce5f.firebaseio.com/users.json');
  }
  this.createUser = function(data){
    return $http.post('https://alinventory-bce5f.firebaseio.com/users.json', data);
  }
  this.deleteUser = function(id){
    // Retrieve User Data
    $http.get('https://alinventory-bce5f.firebaseio.com/users.json').success(function(userData){

      // Find user in User Object
      for(var user in userData){
        // Match User with ID
        if(id == userData[user].id){

          return $http.delete('https://alinventory-bce5f.firebaseio.com/users/' + user + '.json').success(function(){
            window.location.reload();
          });

        }//End If Statement
      }//End For Loop
    });
  }//End Delete User
  this.updateUser = function(id, data){

    $http.get('https://alinventory-bce5f.firebaseio.com/users.json').success(function(userData){

      // Find user in User Objects
      for(var user in userData){
        // Match User with ID
        if(id == userData[user].id){
          return $http.put('https://alinventory-bce5f.firebaseio.com/users/' + user + '.json', data).success(function(){
            window.location.reload();
          });
        }//End If Statement
      }//End For Loop
    });
  }//End Update User

}]);

////////////////////
// Service for Stock
////////////////////
inventoryApp.service('dbStock',['$http', function($http){
  // Get Stock From Database
  this.getStock = function(){
    return $http.get('https://alinventory-bce5f.firebaseio.com/stock.json');
  }

  this.createStock = function(data){
    return $http.post('https://alinventory-bce5f.firebaseio.com/stock.json', data);
  }
  this.deleteStock = function(id){

    //Find Item
    $http.get('https://alinventory-bce5f.firebaseio.com/stock.json').success(function(itemData){
      for(var item in itemData){
        if(id == itemData[item].id){
          return $http.delete('https://alinventory-bce5f.firebaseio.com/stock/' + item + '.json').success(function(){
            window.location.reload();
          });
        }//End If Statement
      }//End For Loop
    })//End Find Item

  }//End Delete Stock
  this.updateStock = function(id, data){

    // Find Item
    $http.get('https://alinventory-bce5f.firebaseio.com/stock.json').success(function(itemData){
      for(var item in itemData){
        if(id == itemData[item].id){

          return $http.put('https://alinventory-bce5f.firebaseio.com/stock/' + item + '.json', data).success(function(){
            window.location.reload();

          });

        }//End If Statement
      }//End For Loop
    })//End Find Item
  }//End Update Stock

}]);

///////////////////////////////
// Service for Checked Items
//////////////////////////////
inventoryApp.service('dbCheckedItems',['$http', function($http){
  // Get Checked Items From Database
  this.getCheckedItems = function(){
    return $http.get('https://alinventory-bce5f.firebaseio.com/checkedItems.json');
  }
  // Check out item (Post)
  this.checkOutItem = function(data){
    return $http.post('https://alinventory-bce5f.firebaseio.com/checkedItems.json', data);
  }
  // Return Item (Delete)
  this.returnItems = function(id){

    $http.get('https://alinventory-bce5f.firebaseio.com/checkedItems.json').success(function(returnDataInfo){
      for(var item in returnDataInfo){
        if(id == returnDataInfo[item].id){
          return $http.delete('https://alinventory-bce5f.firebaseio.com/checkedItems/' + item + '.json');
        }
      }
    })



    // return $http.delete('https://alinventory-bce5f.firebaseio.com/checkedItems/' + id);
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

      if(item.name.toLowerCase().indexOf(searchStock) !== -1 || item.type.toLowerCase().indexOf(searchStock) !== -1 ){
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



var signOutButton = document.getElementById('signOutButton');
jQuery('#signOutButton').on('click', function(){
  firebase.auth().signOut();
  window.location = "#/lookup";
});

// Put into Controller to use on page
inventoryApp.controller('inventoryCtrl', ['$scope', '$rootScope', 'dbUsers', 'dbStock', 'dbCheckedItems', '$crypto', 'authService', function($scope, $rootScope, dbUsers, dbStock, dbCheckedItems, $crypto, authService){

authService.auth.onAuthStateChanged(function(user){
  if(user){
    jQuery("#signOutButton").show();
  }else{
    jQuery("#signOutButton").hide();
  }
});

$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options){
  if(toState.name === "admin"){

    if(!authService.auth.currentUser){
      event.preventDefault();
      window.location = "#/login";
    }else{
      console.log(authService.auth.currentUser);
    }

  };
})

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

      dbUsers.getUser().success(function(data){

        var idArray = [];
        for(var id in data){
          idArray.push(data[id].id);
        }

        var lastUserId = idArray.sort(function(a,b){return a-b});

        dbUsers.createUser($scope.newUser = {
          "fname" : $scope.newUser.fname.toUpperCase(),
          "lname" : $scope.newUser.lname.toUpperCase(),
          "id"    : lastUserId[lastUserId.length - 1] + 1,
          "pin" : $crypto.encrypt($scope.newUser.pin.toString())
        });
        window.location.reload();
      });
    }//End Else Statement
  };//End Create New User

  // Delete Users
  $scope.removeUser = function(){

    var id = $('#updateUserID').val();

    dbUsers.deleteUser(id);

    // window.location.reload();
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
    data.pin = $crypto.encrypt(data.pin.toString());
    data.id = Number($('#updateUserID').val());


    var id = $('#updateUserID').val();

    dbUsers.updateUser(id, data);

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
  // $scope.newStock = {};

  $scope.createNewStock = function(){
    if($scope.newStock.name == null || $scope.newStock.type == null){
      console.log("Empty field!")
    }else{

      //Retrieve Stock Data
      dbStock.getStock().success(function(data){

        //Get Last Stock ID
        var idStockArray = [];
        for(var id in data){
          idStockArray.push(data[id].id);
        }
        var lastStockId = idStockArray.sort(function(a,b){return a-b});

        $scope.newStock = {
          "name" : $scope.newStock.name,
          "type" : $scope.newStock.type,
          "notes" : $scope.newStock.notes,
          "id"   : lastStockId[lastStockId.length - 1] + 1

        }
        dbStock.createStock($scope.newStock);
        window.location.reload();
      })//End of Creation

    }//End of Else Statement
  };//End of Create New Stock

  // Delete Stock
  $scope.removeStock = function(){

    var id = $('#updateID').val();

    dbStock.deleteStock(id);

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

    var data = {
      "name" : $('#updateName').val(),
      "type" : $('#updateType').val(),
      "id"   : $('#updateID').val(),
      "notes" : $('#updateNotes').val()
    }

    var id = data.id;

    dbStock.updateStock(id, data);
  };

// //////////////
// ITEM CHECK
// //////////////

// Global Variables
var stockID;
var checkedItemID;
var checkedItemUserName;

// Get Checked Items
dbCheckedItems.getCheckedItems().success(function(data){
  $scope.dbCheckedItems = data;

  // console.log($scope.dbCheckedItems);
});

  // /////////////////
  // Check Item Status
  // /////////////////

  $scope.itemStatus = function(itemName){



    var checkedItemArray = [];

    // Push Items from Object To Array
    for(var item in $scope.dbCheckedItems){
      checkedItemArray.push($scope.dbCheckedItems[item]);
    }


    if(checkedItemArray.length == 0){
      $('#itemStatus').html("Available");
      $('#checkOutForm').css('display','block');
      $('#returnForm').css('display','none');
    }else {
      //Check the Checked Items List
      for(var i = 0; i < checkedItemArray.length; i++){
        if(checkedItemArray[i].name == itemName){
          // Check the Stock List
          for(var item in $scope.dbStock){
            if(checkedItemArray[i].name == $scope.dbStock[item].name){
              $('#itemStatus').html("Unavailable");
              $('#checkOutForm').css('display','none');
              $('#returnForm').css('display','block');

              //Set Global Checked Items
              checkedItemID = checkedItemArray[i].id;
              checkedItemUserName = checkedItemArray[i].user;

              $scope.checkedUser = checkedItemUserName;
            }
          }
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

    stockID = this.item.id;

    $scope.itemStatus(this.item.name);

  };

  // Close View Item
  $scope.closeViewItem = function(){
    // $('#viewItem').css("background-color","red");
    // $('#viewItem').css("display","none");
    document.getElementById('viewItem').style.display = "none";
    $('.itemNotes').html("");

  };




  // //////////////
  // Check Out Item
  // //////////////

  // Check Out Item

  $scope.checkOut = function(){

    if($scope.checkedOutItem.user == null || $scope.checkOutPin == null){
      console.log("Empty Field!");
    }else if($scope.checkPin($scope.checkedOutItem.user, $scope.checkOutPin)){
      // If the password matches, a successful checkout will occur

      // Create Item ID
      dbCheckedItems.getCheckedItems().success(function(checkedItemData){

        var idArray = [0];
        for(var id in checkedItemData){
          if(!checkedItemData){
            console.log("Nothing there!");
            idArray = [0];
          }else{
            console.log("There's stuff here");
            idArray.push(checkedItemData[id].id);
          }
        }
        var sortId = idArray.sort(function(a,b){return a-b});
        var lastId = idArray[idArray.length - 1];

        $scope.checkedOutItem = {
          "name" : $('#title').html(),
          "user" : $scope.checkedOutItem.user,
          "id"   : lastId + 1
        }

        dbCheckedItems.checkOutItem($scope.checkedOutItem);
        window.location.reload();

      });


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


      console.log("Password Matched, Return Successful");

      // The Item Must be removed from Checked Items FIRST!

      dbCheckedItems.returnItems(checkedItemID);


      // Then update Users to reflect last user
      // Get Item Information
      dbStock.getStock().success(function(itemData){

        // Match Item
        for(var item in itemData){
          if(itemData[item].id == id){

            var updateLastUser = {
              "id"    : itemData[item].id,
              "name"  : itemData[item].name,
              "type"  : itemData[item].type,
              "notes" : itemData[item].notes,
              "lastUser" : checkedItemUserName
            }

            dbStock.updateStock(id, updateLastUser);

          }//End Match If Statement
        }//End Match For Loop
      });//End Get Stock
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

    for(var userPin in $scope.dbUsers){
        // Match Names
      if($scope.dbUsers[userPin].fname + ' ' + $scope.dbUsers[userPin].lname == user){
        // Check Pin
        if(pin == $crypto.decrypt($scope.dbUsers[userPin].pin)){
          return true;
        }else{
          return false;
        }
      }
    }//End For Loop


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
