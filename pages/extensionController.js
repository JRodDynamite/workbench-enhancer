app.controller("workbenchEnhancerController",function($scope,$filter,dataService){
  $scope.status = {
    isFirstOpen: true,
    isFirstDisabled: false
  };

  $scope.accordionArray = [];

  var pathname = dataService.GetPathName();

  $scope.AddDataToStorage = function(event){
    event.preventDefault();
    if($scope.textAreaVal != ""){
      var date = new Date(); // Use for todays date
      //var date = new Date(2017,01,21); //new Date(yyyy,mm,dd). Use for specific dates. Months ordered from 0 in javascript
      var todaysDate = $filter("date")(date,"dd MMM yyyy");
      var currentTime = Math.round(date/1000);
      var dataToSave = [currentTime,$scope.textAreaVal.trim()];
      chrome.storage.local.get(pathname,function(data){
        if($filter("isEmpty")(data[pathname])){ // if absolutely no data found, create new empty object
          data[pathname] = {};
        }
        if(data[pathname].hasOwnProperty(todaysDate)){ // check if object has that key already
          data[pathname][todaysDate].unshift(dataToSave);
        }
        else{ // if key doesnt exist, create a new one
          data[pathname][todaysDate] = [dataToSave];
        }
        chrome.storage.local.set(data,function(){
          GetData(); //call to GetData function again to refresh view
        })
      });
    }
  }

  var GetData = function(){
    var askForPromise = dataService.GetData();
    askForPromise.then(
      function(data){
        //$scope.storageData = {};
        $scope.storageData = data[pathname];
        if($scope.storageData != undefined){
          $scope.sortedDates = Object.keys($scope.storageData).sort(function(a,b){
            return (new Date(b) - new Date(a));
          });
        }
      },
      function(){
        console.log("Some error in receiving data");
      }
    )
  }

  GetData(); //call on page load

  var GetOrSetExtensionState = function(get){
    var askForPromise = dataService.GetExtensionStates();
    askForPromise.then(function(data){

      if(get){
        if($filter("isEmpty")(data)){ //when no object for the key "extension_states" found,create the object
        data["extension_states"]= {};
        $scope.state = false;
      }
      if(data["extension_states"].hasOwnProperty(pathname)){
        $scope.state = data["extension_states"][pathname];
      }
      else
      {
        $scope.state = false;
      }}

      data["extension_states"][pathname] = $scope.state;
      chrome.storage.local.set(data,function(){

      })
    },
    function(err){
      console.log("Following error in receiving extension states "+err);
    })
  }

  GetOrSetExtensionState(true); //call on page load, paramter "true" indicates that it is a get call

  $scope.ToggleExtension = function(){
    $scope.state = !$scope.state;
    GetOrSetExtensionState(false); //paramter "false" indicates that it is a simple set call
  }

  $scope.SetQueryText = function(text){
    $scope.textAreaVal = text.trim();
  }

  $scope.DeleteQuery = function(deleteFromDate,arrayToDelete){
    //get the index of the data to delete from scope
    var scopeQueriesArray = $scope.storageData[deleteFromDate];
    var index = scopeQueriesArray.indexOf(arrayToDelete);
    if(index != -1){
      //delete that data from storage and refresh view
      chrome.storage.local.get(pathname,function(data){
        var storageQueriesArray = data[pathname][deleteFromDate];
        storageQueriesArray.splice(index,1);
        if(storageQueriesArray.length == 0){ //delete that key from storage if no data present for that date
          delete data[pathname][deleteFromDate];
        }
        chrome.storage.local.set(data,function(){
          GetData(); //update data on view
        })
      })
    }
    else{
      console.log("No such data found");
    }
  }

});
