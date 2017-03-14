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
        // console.log($scope.hello);
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

        jQuery('#loginError').addClass("msg alert-success").html("Success!");
        window.location = "#/admin";

      }

    }).catch(function(error){

      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      jQuery('#loginError').addClass("msg alert-danger").html(errorMessage);

    });

    var user = this.auth.currentUser;

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

///////////////////////
// Service for Users
//////////////////////
inventoryApp.service('dbUsers', function(){

  this.database = firebase.database()

  // Get Users From Database
  this.getUser = function(){
    return this.database.ref('/users').limitToLast(100).once('value', function(data){

      // console.log(data.val());
      return data.val();

    }, function(error){
      if(error){
        console.log(error.message);
      }
    }); //close error handler and .once params
  }

  this.createUser = function(data){

    return this.database.ref('/users').push(data, function(error){
      if(error){console.log(error.message)};
    });

  }

  this.deleteUser = function(id){

    console.log(id);
    // Retrieve User Data
    this.database.ref('/users').once('value', function(data){

      var userData = data.val();

      // Find user in User Object
      for(var user in userData){

        var obj = userData[user];

        for(var prop in obj){
        // Match User with ID

        if(id == obj[prop]){

          console.log(obj[prop]);
          console.log(user);
          console.log(id);
          var userToDelete = user;
          //check if user has any items checked out
          //console.log(obj['fname'] + " " + obj['lname']);
          //console.log(obj);
          firebase.database().ref('/stock').orderByChild("currentUser").equalTo(obj['fname'] + " " + obj['lname']).once('value', function(d){

            var result = d.val();

            if(result){

              //looks like this user hasn't turned in their company equipment.
              //throw an error.  That'll show 'em.

              var message = "This user cannot be deleted until the following " +
                            "items are checked in (or otherwise accounted for): ";

              var items = "<br><br><ul> ";
              var checkedOut = [];

              for(var item in result){

                var obj = result[item];

                if(obj['isCheckedOut'] == true){
                  checkedOut.push(obj['name']);
                }
                console.log(checkedOut);
              }

              checkedOut.forEach(function(e){
                items += "<li>" + e + "</li>";
              })

              if(checkedOut.length == 0){
                //console.log(targetUser);
                //console.log("deleted 1");

                var userRef = firebase.database().ref('/users');

                userRef.once('value', function(snapshot){

                  var children = snapshot.val();

                  for (var child_id in children){

                    if(child_id == userToDelete){

                    var child = userRef.child(child_id);

                    child.remove(function(error){

                        if(!error){

                          $('#updateUserMessage').removeClass('alert-danger');
                          $('#updateUserMessage').addClass('alert-success')
                          $('#updateUserMessage').html('Success!');

                          //Close Pop Up here, if we want

                          }else{

                          $('#updateUserMessage').removeClass('alert-success');
                          $('#updateUserMessage').addClass('alert-danger')
                          $('#updateUserMessage').html(error.message);

                            }
                          });
                        };
                      };
                    });

              }else{

              $('#updateUserMessage').removeClass('alert-success');
              $('#updateUserMessage').addClass('alert-danger')
              $('#updateUserMessage').html(message + items);
            }

          }else{

          //user has no items checked out, go ahead and remove them.
          //define the ref
          var userRef = firebase.database().ref('/users');

          userRef.once('value', function(snapshot){
          //get a snapshot
            var children = snapshot.val();
          //iterate and find the right user
            for (var child_id in children){

              if(child_id == userToDelete){

              var child = userRef.child(child_id);
              //remove the user and catch error/flash success
              child.remove(function(error){

                  if(!error){

                    $('#updateUserMessage').removeClass('alert-danger');
                    $('#updateUserMessage').addClass('alert-success')
                    $('#updateUserMessage').html('Success!');

                    //Close Pop Up here, if we want

                    }else{

                    $('#updateUserMessage').removeClass('alert-success');
                    $('#updateUserMessage').addClass('alert-danger')
                    $('#updateUserMessage').html(error.message);

                      }
                    });
                  };
                };
              });
            }
          }); //close query
          }//End If Statement
        }//End For Loop
      }
    });
  }//End Delete User

  this.updateUser = function(id, data){
    //console.log("update");
    //console.log(data);
    firebase.database().ref('/users').once('value', function(result){
      var userData = result.val();

      for(var user in userData){

        var obj = userData[user];

        for(var prop in obj){
        // Match User with ID

        if(id == obj[prop]){

          firebase.database().ref('/users/' + user).update(data, function(error){

            if(!error){

              $('#updateUserMessage').removeClass('alert-danger');
              $('#updateUserMessage').addClass('alert-success')
              $('#updateUserMessage').html('Success!');

              //Close Pop Up here, if we want

            }else{

              $('#updateUserMessage').removeClass('alert-danger');
              $('#updateUserMessage').addClass('alert-success')
              $('#updateUserMessage').html(error.message);

            }
          });

        }//End If Statement
      }//End For Loop
    };
  }, function(error){

    if(error){

      $('#updateUserMessage').removeClass('alert-success');
      $('#updateUserMessage').addClass('alert-danger');
      $('#updateUserMessage').html(error.message)

    }}
  );
  }//End Update User

})

////////////////////
// Service for Stock
////////////////////
inventoryApp.service('dbStock', ['$timeout', function($timeout){
  // Get Stock From Database
  this.database = firebase.database();

  this.getStock = function(){

    firebase.database().ref('/stock').limitToLast(1000).once('value', function(data){
      //needed to wrap in this to make sure scope updated on first page load.
  $timeout(function(){

      return data.val();
      $scope.dbStock = data.val();

      });
    });
  }

  this.createStock = function(data){

    var pushKey = this.database.ref('/stock').push().key
    this.database.ref('/stock/' + pushKey).update(data, function(error){

        if(!error){

          $('#createStockMessage').removeClass('alert-danger');
          $('#createStockMessage').addClass('alert-success')
          $('#createStockMessage').html('Success!');

          //Close Pop Up here, if we want

        }else{

          $('#createStockMessage').removeClass('alert-danger');
          $('#createStockMessage').addClass('alert-success')
          $('#createStockMessage').html(error.message);

        }
      });

  }

  this.deleteStock = function(id, status, notes){

    //Find Item
    this.database.ref('/stock').once('value', function(data){

      var itemData = data.val();

      for(var item in itemData){

        var obj = itemData[item];

        for(var prop in obj){

        if(id == obj[prop]){

          obj["deleteNotes"] = notes;
          obj["deleteReason"] = status;

          var oldRef = firebase.database().ref('/stock/' + item);
          var newRef = firebase.database().ref('/archivedItems/');

          newRef.push(obj, function(error){
            if(!error){

              //firebase.database().ref('/stock/' + item).remove(function(error){
              oldRef.remove(function(error){
                  //callback
                  if(!error){

                    $('#updateStockMessage').removeClass('alert-danger');
                    $('#updateStockMessage').addClass('alert-success');
                    $('#updateStockMessage').html('Success!');

                  }else{

                    $('#updateStockMessage').removeClass('alert-success');
                    $('#updateStockMessage').addClass('alert-danger');
                    $('#updateStockMessage').html(error.message);

                    }
                  });
                }
              });
            };
          }
        }
      //End For Loop
    })//End Find Item
  }//End Delete Stock

  this.updateStock = function(id, data){

    // Find Item
    firebase.database().ref('/stock').once('value', function(result){

      var itemData = result.val();

      for(var item in itemData){

        var obj = itemData[item];

        for(var prop in obj){

        if(id == obj[prop]){

          firebase.database().ref('/stock/' + item).update(data, function(error){

            //callback
            if(!error){

              $('#checkoutMsg').removeClass('alert-danger');
              $('#checkoutMsg').addClass('alert-success');
              $('#checkoutMsg').html('Success!');
              //we don't know which modal this came from, so we need to run both.
              $('#updateStockMessage').removeClass('alert-danger');
              $('#updateStockMessage').addClass('alert-success');
              $('#updateStockMessage').html('Success!');

            }else{

              $('#checkoutMsg').removeClass('alert-success');
              $('#checkoutMsg').addClass('alert-danger');
              $('#checkoutMsg').html(error.message);
              //we don't know which modal this came from, so we need to run both.
              $('#updateStockMessage').removeClass('alert-success');
              $('#updateStockMessage').addClass('alert-danger');
              $('#updateStockMessage').html(error.message);

            }

          });

          //add success notification here ACW

          }//End If Statement
        }//End For Loop 1
      }//End For Loop 2
    }, function(error){

      if(error){

        $('#checkoutMsg').removeClass('alert-success');
        $('#checkoutMsg').addClass('alert-danger');
        $('#checkoutMsg').html(error.message)

      }

    })//End .once function

  }//End Update Stock

}]);

///////////////////////////////
// Service for Checked Items
//////////////////////////////
inventoryApp.service('dbCheckedItems', function(){
  this.database = firebase.database();
  // Get Checked Items From Database
  this.getCheckedItems = function(){
    firebase.database().ref('/checkedItems').limitToLast(1000).once('value', function(data){
      // console.log(data.val());
      return data.val();

    });
  }

  // Check out item (Post)
  this.checkOutItem = function(data){
    firebase.database().ref('/checkedItems').push(data);
  }

  // Return Item (Delete)
  this.returnItems = function(id){

    firebase.database().ref('/checkedItems').once('value', function(returnDataInfo){

      for(var item in returnDataInfo){

        var obj = returnDataInfo[item];

        for(var prop in obj){

        if(id == obj[prop]){

          firebase.database().ref('/checkedItems/' + item).remove(function(error){
            console.log("Error checking item in. (Removing from DB)");

          });

          }
        }
      }
    })



    // return $http.delete('https://inventoryapp-bc585.firebaseio.com/checkedItems/' + id);
  }
});

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
inventoryApp.controller('inventoryCtrl', ['$scope', '$rootScope', 'dbUsers', 'dbStock', 'dbCheckedItems', '$crypto', 'authService', '$timeout', function($scope, $rootScope, dbUsers, dbStock, dbCheckedItems, $crypto, authService, $timeout){

authService.auth.onAuthStateChanged(function(user){
  if(user){
    jQuery("#signOutButton").show();
  }else{
    jQuery("#signOutButton").hide();
  }
});

//listen for state changes from ui-router

$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options){
//if the state is trying to change to admin, check authentication
  if(toState.name === "admin"){
    //use our auth service to see what's up
    if(!authService.auth.currentUser){
      //Not logged in! prevent the action and
      //send them to the login form
      event.preventDefault();
      window.location = "#/login";

    }else{

      //they're logged in, print the user to the console.
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

//modified this because .success() was giving an error. ACW

  // Get Users
  $scope.dbUsers = dbUsers.getUser().then(function(data){
    $scope.dbUsers = data.val();

    //Set a listener on the database to
    //update the scope when values change.
    //This may need to be refactored - ACW

    firebase.database().ref('/users').limitToLast(10).on('value', function(data){

      $scope.dbUsers = data.val();

    });

  });

  // Create Users

  //set a container in the scope
  $scope.newUser = {};

  //define the function
  $scope.createNewUser = function(){
    if($scope.newUser.fname == null || $scope.newUser.lname == null || $scope.newUser.pin == null){

      $('#createUserMessage').removeClass('alert-success');
      $('#createUserMessage').addClass('alert-danger');
      $('#createUserMessage').html('One or more fields is blank.');

    }else{

        //pass the data to the createUser function in dbUsers service,
        dbUsers.createUser($scope.newUser = {
          "fname" : $scope.newUser.fname.toUpperCase(),
          "lname" : $scope.newUser.lname.toUpperCase(),
          "id"    : Date.now(),
          "pin" : $crypto.encrypt($scope.newUser.pin.toString())
        });

        //redirect to the admin page
        //(hard reloading destroys the auth session)
        window.location = "#/admin";

        $('#createUserMessage').removeClass('alert-danger');
        $('#createUserMessage').addClass('alert-success')
        $('#createUserMessage').html('Success!');

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
    $('#updateUserMessage').html('');
    $('#updateUserMessage').removeClass('alert-danger alert-success');

  };

  // Pull In User Data
  $scope.editUser = function(){
    $('#editUser').css("display","block");

    $scope.updatedUser = {
      "fname" : this.user.fname,
      "lname" : this.user.lname
    }
    //console.log(this.user.id);
    $scope.updatedUser.id = this.user.id;

  };

  // Update User
  $scope.reviseUser = function(data){

    data.fname = data.fname.toUpperCase();
    data.lname = data.lname.toUpperCase();
    //check if a pin was passed, because we get an error on NULL
    if(data.pin){
    data.pin = $crypto.encrypt(data.pin.toString());
    }
    data.id = Number($('#updateUserID').val());

    var id = $('#updateUserID').val();

    dbUsers.updateUser(id, data);

  };

// ///////////
// STOCK
// ///////////

  // Get Stock

  $scope.dbStock = dbStock.getStock();

  //.then(function(data){
    //$scope.dbStock = data.val();

    //Set a listener on the database to
    //update the scope when values change.
    //This may need to be refactored - ACW

    firebase.database().ref('/stock').limitToLast(1000).on('value', function(data){

      $scope.dbStock = data.val();

    });
  //});
/*
  var stock = dbStock.getStock()
    $scope.dbStock = stock;
    // console.log($scope.dbStock);
*/
  // Create Stock
  // $scope.newStock = {};

  $scope.createNewStock = function(){
    if($scope.newStock.name == null || $scope.newStock.type == null){

      //probably need some better error handling here - see issue #5
      console.log("Empty field!")

    }else{

      //Retrieve Stock Data

        $scope.newStock = {
          "name" : $scope.newStock.name,
          "type" : $scope.newStock.type,
          "notes": $scope.newStock.notes,

          //changed to timestamps (milliseconds since 1970 or something,
          //so it's unique, for our purposes) ACW
          //"id"   : lastStockId[lastStockId.length - 1] + 1
          "id"   : Date.now()

        }

        dbStock.createStock($scope.newStock);

        window.location = "#/admin";
      //})//End of Creation

    }//End of Else Statement
  };//End of Create New Stock

  $scope.deleteOptions = [
    {name:"Item is broken.", value:"broken"},
    {name:"Item was lost/cannot be located.", value:"lost"},
    {name:"Item is obsolete", value:"obsolete"},
    {name:"Item has been replaced/retired", value:"replaced"}
  ];

  // Delete Stock
 $scope.confirmRemoveStock = function(){

   $("#confirmDeleteButton, #updateName, #updateType, #updateNotes, .hideDelete").hide();
   $("#updateButton").hide();
   $("#deleteButton, #deleteReason, #deleteNotes, .showDelete").show();
   $("#updateStockMessage").removeClass("alert-success alert-danger");
   $("#updateStockMessage").addClass("alert-warning alert");
   $("#updateStockMessage").html("Are you sure?");

  }

  $scope.removeStock = function(){

    var status = $scope.deleteReason.value;
    var id     = $('#updateID').val();
    var notes   = $scope.deleteNotes;
    //console.log(status+id+notes)
    dbStock.deleteStock(id, status, notes);

	};

  // Edit Stock
  $scope.closeEditStock = function(){
    $("#editStock").css("display","none");
    $('#updateStockMessage').html('');
    $('#updateStockMessage').removeClass('alert-danger alert-success alert-warning');

    $("#confirmDeleteButton, #updateName, #updateType, #updateNotes, .hideDelete").show();
    $("#updateButton").show();
    $("#deleteButton, #deleteReason, #deleteNotes, .showDelete").hide();

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


  // /////////////////
  // Check Item Status
  // /////////////////

  $scope.itemStatus = function(itemName){
    firebase.database().ref('/stock').on('value',function(data){
      var itemList = data.val();//Set data to var itemList

      // Loop through itemList data
      for(item in itemList){
        // match on itemList name
        if(itemName == itemList[item].name){
          // isCheckedOut default is false(availabe)

          if(!itemList[item].isCheckedOut){
            $('#itemStatus').html("Available");
            $('#checkOutForm').css('display','block');
            $('#returnForm').css('display','none');
          }else{
            $('#itemStatus').html("Unavailable");
            $('#checkOutForm').css('display','none');
            $('#returnForm').css('display','block');
            $('.currentUser').val(itemList[item].currentUser);
            $scope.checkedUser = itemList[item].currentUser;
          }
        }//End of name match if statement.
      }//End of itemList for loop

    });//End of getting data
  };//End of Item Status

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
    //console.log(stockID);
    if($scope.checkPin($scope.checkedOutItem.user, $scope.checkOutPin)){
      //console.log("Matches");
      var data = {
        'currentUser' : $scope.checkedOutItem.user,
        'isCheckedOut' : true
      }
        dbStock.updateStock(stockID, data);
    }else{

        $('#checkoutMsg').removeClass('alert-success');
        $('#checkoutMsg').addClass('alert-danger');
        $('#checkoutMsg').html('Incorrect PIN!');
    }

  };

  // ////////////
  // Return Item
  // ////////////

  $scope.returnItem = function(){

    //console.log($scope.checkedUser);

    if($scope.checkPin($scope.checkedUser, $scope.returnPin)){
      //console.log("Matches");

      var data = {
        'currentUser' : null,
        'lastUser'  : $scope.checkedUser,
        'isCheckedOut' : false
      }
        dbStock.updateStock(stockID, data);
    }else{

        $('#checkoutMsg').removeClass('alert-success');
        $('#checkoutMsg').addClass('alert-danger');
        $('#checkoutMsg').html('Incorrect PIN!');
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
    $('#createStockMessage').html('');
    $('#createStockMessage').removeClass('alert-danger alert-success');

  }
  $scope.selectUsers = function(){
    $('#viewStockButton').toggle();
    $('#viewStockButtonGrey').toggle();
    $('#viewUsers').toggle();
    $('#createUser').css('display','none');
  }
  $scope.openCreateUser = function(){

    $('#createUser').toggle();
    $('#createUserMessage').html('');
    $('#createUserMessage').removeClass('alert-danger alert-success');

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

    dbUsers.getUser().then(function(data){
        $scope.dbUsers = data.val();
    })

    //End Get User Function
// console.log($scope.dbUsers);
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
