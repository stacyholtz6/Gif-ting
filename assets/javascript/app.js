// ************ Firebase Config ******************
//Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyANy9CUVmdOHWlpvzq6-PlyWJgsNfpVcYw",
  authDomain: "gift-ing.firebaseapp.com",
  databaseURL: "https://gift-ing.firebaseio.com",
  projectId: "gift-ing",
  storageBucket: "gift-ing.appspot.com",
  messagingSenderId: "577787162637",
  appId: "1:577787162637:web:24635c610b2ccb4577a544"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

database = firebase.database();

// ************ Declare Global Variables ******************
// store user e-mail
var user;
// store user name
var userName;

// store user's information
var data = {
  giftList: []
}
// store the ID of the firebase that links it with
var id="";
var userExists = false;


$(document).ready(function () {

  //initially hides content until person from list is selected
  $("#persons-content").hide();

  // ************ Display Person Information when Button Clicked ******************

  // run the add person function when the submit button on modal is clicked
  $(document).on("click", ".list-group-item", displayPerson);

  // runs the generation of gift ideas based on that persons keyword when that person is clicked
  $(document).on("click", "#regenerate-keyword", regenerateKeyword);

  // *** working on the new keyword generatior form 
  function regenerateKeyword() {
    var newKeyword = $("#new-keyword").val();
    console.log(newKeyword);
  }


  function displayPerson() {
    if (!$(this).attr("disabled")) {
      $("#persons-content").show();
      var idx = $(this).attr("person-index");

      $("#selected-name").text(data.giftList[idx].name + "'s");
      $("#relationship").text(data.giftList[idx].relationship);
      $("#keyword").text(data.giftList[idx].keyword);
      $("#description").text(data.giftList[idx].personality);
      $("#budget").text(data.giftList[idx].budget);
      $("#selected-name-gif").text(data.giftList[idx].name);
      $("#selected-name-search").text(data.giftList[idx].name);

var terms = data.giftList[idx].keyword;  
      searchEtsy(terms, "displayideas")
    }
  }

  // ************ Add Person to Gift List ******************

  // run the add person function when the submit button on modal is clicked
  $(document).on("click", "#save-person", addPerson);

  function addPerson(){
    // save the values from each of the input fields
    var tmpName = $("#add-name").val().trim();
    var tmpRelationship = $("#add-relationship").val().trim();
    var tmpKeyword = $("#add-keyword").val().trim();
    var tmpPersonality = $("#add-personality").val().trim();
    var tmpBudget = $("#add-budget").val().trim();

    // push to the data array and update firebase
    updatedGiftListData(tmpName, tmpRelationship, tmpKeyword, tmpPersonality, tmpBudget);
    writeUserData(id, user, data);
    createButtons();

    // closes the modal window
    $("#addPersonModalCenter").modal('toggle');
  }

  // ************ Esty API ******************

  // etsy-api-setup
  // etsy ajax call
  // adds item that was searched for can click the image and go to etsy store
  // if more than four images add a break and start new row
  // currently fetching 16 items
  $('#etsy-search').on('submit', function (event) {
    event.preventDefault();

    // using etsy value to generate and display results from the keyword
    terms = $('#etsy-terms').val();
    searchEtsy(terms, "displayresults")
  })
  function searchEtsy(terms, origin) {
    api_key = "82wfohi8ezzm1fq3vflms9ul";
    etsyURL = "https://openapi.etsy.com/v2/listings/active.js?keywords=" +
      terms + "&limit=16&includes=Images:1&api_key=" + api_key;

    $('#etsy-images').empty();
    $('<p></p>').text('Searching for ' + terms).appendTo('#etsy-images');

    $.ajax({
      url: etsyURL,
      dataType: 'jsonp',
      success: function (data) {
        console.log(data);
        if (data.ok) {
          if (origin === "displayresults") {
            $('#etsy-images').empty();
            if (data.count > 0) {
              $.each(data.results, function (i, item) {
                $("<img id='etsy'/>").attr("src", item.Images[0].url_75x75).appendTo("#etsy-images").wrap(
                  '<a href="' + item.url + '" target="_blank"></a>'
                );
              });
            } else {
              $('<p>No results.</p>').appendTo('#etsy-images');
            }
          }
          else {
            // Generated Gift Ideas based on keyword
            $('#etsy-images-generated').empty();
            if (data.count > 0) {
              $.each(data.results, function (i, item) {
                $("<img id='etsy'/>").attr("src", item.Images[0].url_75x75).appendTo("#etsy-images-generated").wrap(
                  '<a href="' + item.url + '" target="_blank"></a>'
                );
              });
            } else {
              $('<p>No results.</p>').appendTo('#etsy-images-generated');
            }
          }
        }
      }
    });
    return false;
  }

  // ************ User Enters Email to "Login" ******************

  $("#add-email").on("click", function(event){
    event.preventDefault();

    // hide the person's content when switching users
    $("#persons-content").hide();
    // empty the buttons - this will be necessary when a new user starts a list
    $("#person-buttons").empty();
    // reset the ID and data to "" - the follow code will assign the ID based on the e-mail
    id = "";
    data = {
      giftList: []
    }

    // sets the user equal to the input value
    user = $("#email-id").val().trim();

    // push a temp record to trigger the event listener
    database.ref().push({
      temp: "temp"
    })

    // "value" event listener for FB
    database.ref().on("value", function(snapshot){

      // for each key item in the db, get the email and the temp items for each record,
      // if it's a "valid" record, then it will have an email, temp records are setup temporarily
      // to trigger the event listener, but will be removed below 
      for (var key in snapshot.val()){
        var ref = database.ref(key);
        ref.once("value").then(function(snapshot){
          var tmpEmail = snapshot.val().email;
          var tmpDelete = snapshot.val().temp;
          // if the email in the FB record matches what was input, then this is the record we want
          // so it sets the global data equal to the data record associate with the key - we also store
          // the key so we know which record to update later 
          // if this is temp record, remove it to keep the database clean
          if (tmpDelete === "temp") {
            database.ref(key).remove();
          }
     if (tmpEmail === user) {
            data = snapshot.val().data;
            id = snapshot.key;
            createButtons(id);
            //updatePage(); // placeholder for a function that will update the DOM
          }
     
        })
        console.log(user, data, id);
      }
    })
  });

  // ************ Create Buttons for Gift List ******************

  // Function for displaying person buttons
  function createButtons(id) {
    // Clears the buttons that are on page, to repopulate them
    // (this is necessary otherwise we will have repeat buttons)
    $("#person-buttons").empty();
    console.log(data);

    // Looping through the array of people
    for (var i = 0; i < data.giftList.length; i++) {

      // Then dynamically generating buttons
      var a = $("<li>");
      // Adding a class to style the button to bootstrap
      a.addClass("list-group-item list-group-item-action list-group-item-info");
      // Adding a data-attribute
      a.data("toggle", "list");
      a.attr("person-index", i);
      a.attr("db-key", id);
      // Providing the button's text with the person's name
      a.text(data.giftList[i].name);
      // setup an attr of disabled to false (meaning it is in enabled) 
      a.attr("disabled", false);

      // create a button that will hold the x to remove the word
      var x = $("<button>");
      // add a class to pull in the bootstrap close
      x.addClass("close");
      // add an x to the element as text
      x.append("&times;");
      // give the x an attribute with name - this will delete the proper button when clicked
      // *** Might need to rethink this attribute ***
      x.attr("person-name-button", i);
      // append the x button
      a.append(x);

      // Adding the button to the HTML
      $("#person-buttons").append(a);
    }
  }

  // ************ Regenerate Keyword ***************************

  $(document).on("click", "#button-addon2", function(event){
    event.preventDefault();
    console.log("regenerate keyword");
  })

  // ************ Delete a person on Gift List ******************

  // if the close button is clicked, run this function
  $(document).on("click", ".close", function(){
    // return the parent element - this is the animal button
    var par = $(event.target).parent();
    // disable the parent button - this keeps the gifs from displaying when user is trying to 
    // remove the button
    par.attr("disabled", true);
    // declare a variable of the animal of the clicked button
    var rem = $(this).attr("person-name-button");
    // remove the element from the animals array
    data.giftList.splice(rem,1);
    // render the buttons again - the removed button will not be there anymore
    createButtons();
    // submit the deletion to the database
    writeUserData(id, user, data);
  })

  // ************ Make Changes to the Gift List ******************

  // use this to update the gift list with a new person - pushes to the object, then use writeUserData
  // to push to FB
  function updatedGiftListData(name, relationship, keyword, personality, budget){
    data.giftList.push({
      name: name,
      relationship: relationship,
      keyword: keyword,
      personality: personality,
      budget: budget,
      savedGiftIdea: ""
    })
  }

  // ************ Push Data to Firebase ******************

  // function to push info to FB - this should be used anytime the "data" is pushed to data.giftList
  function writeUserData(key, user, data) {
    // if the key is blank, that means there isn't a record for that user, so it pushes the data, by 
    // setting id equal to this push, it resets id equal to the key value
    if(key===""){
      id = database.ref().push({
        email: user,
        data: data
      });
      // otherwise, if there is a key, we want to set the record associated with that key - this will 
      // OVERWRITE what is there, so it is very important to keep the data variable clean and always be
      // updating the db whenever the data changes
    } else{
      database.ref(key).set({
        email: user,
        data: data
      })
    }
  }
});










//console.log(user, data);
    //var userUID = 1;

    // var ref = database.ref('/gif-ting/' + userUID);
    // ref.on('value', function(data) {
    //   //data.key will be like -KPmraap79lz41FpWqLI
    //   database.ref().push({
    //     email: user,
    //     data: data
    //   })
    // });
    // userID = user.replace("@", "");
    // userID = userID.split('.').join('');
    // console.log(userID);
    // writeUserData(userID, user, data);

    // var userId = lists.indexOf(user)+1;
    // console.log(user);
    // console.log(userId);

    // return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    //   console.log(snapshot.val());
    //   console.log(snapshot.val().email);
      //var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // ...

   // userUID++;

    // database.ref().push({
    //   email: user,
    //   data: data
    // })


    //console.log("determine if user exists");
  //})

  //var userId = user;
  // database.ref('/users/' + userID).once('value').then(function(snapshot) {
  // console.log(snapshot);
  // // ...
  // });

  //console.log(database.ref("/gif-ting/").orderByChild('uid').equalTo(userUID));

  //console.log(database.ref('/gif-ting/-LtqyPOmvrl7NBQZcgvE'));

  // var userId = lists.user;
  // console.log(userId);

  // return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
  //   console.log(snapshot.val().email);
  //   //var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
  // // ...
  // });

  // database.ref().on("value", function(snapshot){
  //   console.log("checking database");
  //   for (var key in snapshot.val()){

  //     var ref = database.ref(key);
  //     ref.once("value").then(function(snapshot){
  //           var tmpEmail = snapshot.val().email;
  //           if(tmpEmail === user){
  //             data=snapshot.val().data;
  //           }
  //       })
  //   }
  // })

      // console.log(userExists);
      // if(userExists === false){
      //   // database.ref().push({
      //   //   email: user,
      //   //   data: data
      //   // })
      //   console.log("user doesn't exist");
      // }
    //})

  // database.ref().on("child_added", function(childSnapshot){

  //   // id = childSnapshot.key;
  //   // console.log(id);
  //   var childEmail = childSnapshot.val().email;
  //   console.log(childEmail);
  //   if(user === childEmail){
  //     id = childSnapshot.key;
  //   }
  //   console.log(user, id);
  //   console.log(database.ref(id));
  //   var ref = database.ref(id);
  //   ref.once("value").then(function(snapshot){
  //     console.log(snapshot.val());
  //     console.log(snapshot.val().email);
  //     console.log(snapshot.key);
  //     console.log(snapshot.val().data)
  //   })
  //   //console.log(database.child(id));
  //   // var ref = database.ref(id);
  //   // ref.once("value")
  //   //   .then(function(snapshot) {
  //   //     var key = snapshot.key; // "ada"
  //   //     var childKey = snapshot.child("name/last").key; // "last"
  //   //   });
  // })

  // var ref = database.ref("-Ltp_7u-F_Fojt65372p");
  // ref.once("value").then(function(snapshot){
  //   console.log(snapshot.val());
  //   console.log(snapshot.val().email);
  // })
