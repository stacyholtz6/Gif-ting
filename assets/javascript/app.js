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
var id = "";
var userExists = false;
// store the selected gift-ee
var currentGifteeIndex;

$(document).ready(function () {

  //initially hides content until person from list is selected
  $("#persons-content").hide();
  $("#gift-content").hide();

  // ************ Display Person Information when Button Clicked ******************

  // run the add person function when the submit button on modal is clicked
  $(document).on("click", ".list-group-item", displayPerson);

  // ************ Regenerate Keyword ******************

  // runs the generation of gift ideas based on that persons keyword when that person is clicked
  $(document).on("click", "#regenerate-keyword", regenerateKeyword);

  // *** working on the new keyword generatior form 
  function regenerateKeyword() {
    // set the new input into the user's data
    var newKeyword = $("#new-keyword").val().trim();
    data.giftList[currentGifteeIndex].keyword = newKeyword;

    // display the new keyword
    $("#keyword").text(data.giftList[currentGifteeIndex].keyword);

    // update the Etsy box
    searchEtsy(newKeyword, "displayideas");

    // push to FB
    writeUserData(id, user, data);

    // clear the input field
    $("#new-keyword").val("");
  }


  function displayPerson() {
    if (!$(this).attr("disabled")) {
      $("#persons-content").show();
      $("#gift-content").show();
      $('.gallery-responsive').show();
      $(".gallery-responsive").slick("setPosition");
      var idx = $(this).attr("person-index");

      $("#selected-name").text(data.giftList[idx].name + "'s");
      $("#relationship").text(data.giftList[idx].relationship);
      $("#keyword").text(data.giftList[idx].keyword);
      $("#description").text(data.giftList[idx].personality);
      $("#budget").text(data.giftList[idx].budget);
      $("#selected-name-gif").text(data.giftList[idx].name);
      $("#selected-name-search").text(data.giftList[idx].name);
      $("#section-gifts-to-buy").text(data.giftList[idx].name);

      currentGifteeIndex = idx;

      var terms = data.giftList[idx].keyword;
      searchEtsy(terms, "displayideas");

      // displays gif based on personality/description of person
      var showGifs = data.giftList[idx].personality;
      displayGif(showGifs, "displaygif")
    }
    var personsDescription = $("#description").val();
    displayGif(personsDescription, "displayresult")
  }

  // ************** Launch Modal *******************

  $(document).on("click", "#add-person-btn", function (event) {
    event.preventDefault();
    if (typeof user === 'undefined' || user === "") {
      $("#email-error-message").text("Please enter your email prior to using the list.");
    } else {
      $("#addPersonModalCenter").modal('show');
      $("#email-error-message").empty();
    }

  })


  // ************** GIPHY API *******************

  function displayGif(personsDescription) {

    // query url link to giphy site for all the gifs data + api key
    var queryURL = "https://api.giphy.com/v1/gifs/search?q=" + personsDescription + "&api_key=xh9BO1FJT1xjGQcybsfBleQdOUi40zTV&limit=1";

    // creating an AJAX call to add gif 
    $.ajax({
      url: queryURL,
      method: "GET"
    }).then(function (response) {

      var gifs = response.data;
      console.log(response);

      for (var i = 0; i < gifs.length; i++) {
        var gifDiv = $("#display-gif");
        var giphyImage = $("<img>");

        giphyImage.attr("src-alt", gifs[i].images.fixed_height.url);
        giphyImage.attr("src", gifs[i].images.fixed_height_still.url);
        giphyImage.addClass("gif-img");

        gifDiv.empty();

        gifDiv.append(giphyImage);
      }
      // on click function for starting and stopping gifs
      $(".gif-img").on("click", function () {
        console.log(this);
        var temp = $(this).attr("src-alt")
        $(this).attr("src-alt", $(this).attr("src"))
        $(this).attr("src", temp)
      })
    })
  }

  // ************ Add Person to Gift List ******************

  // run the add person function when the submit button on modal is clicked
  $(document).on("click", "#save-person", addPerson);

  function addPerson() {
    // save the values from each of the input fields
    var tmpName = $("#add-name").val().trim();
    var tmpRelationship = $("#add-relationship").val().trim();
    var tmpKeyword = $("#add-keyword").val().trim();
    var tmpPersonality = $("#add-personality").val().trim();
    var tmpBudget = $("#add-budget").val().trim();


    // clear modal inputs
    $("#add-name").val("");
    $("#add-relationship").val("");
    $("#add-keyword").val("");
    $("#add-personality").val("");
    $("#add-budget").val("");


    if (tmpName === "" || tmpKeyword === "" || tmpPersonality === "" || tmpBudget === "") {
      $("#modal-error-message").text("Please complete all values before submitting form.");
    } else {
      $("#modal-error-message").empty();
      // push to the data array and update firebase
      updatedGiftListData(tmpName, tmpRelationship, tmpKeyword, tmpPersonality, tmpBudget);
      writeUserData(id, user, data);
      createButtons();

      // closes the modal window
      $("#addPersonModalCenter").modal('toggle');

    }
  }

  // ************ Esty API ******************

  $('#etsy-search').on('submit', function (event) {
    event.preventDefault();

    // using etsy value to generate and display results from the keyword
    terms = $('#etsy-terms').val();
    searchEtsy(terms, "displayresults")
  })
  function searchEtsy(terms, origin) {
    api_key = "82wfohi8ezzm1fq3vflms9ul";
    etsyURL = "https://openapi.etsy.com/v2/listings/active.js?keywords=" +
      terms + "&limit=18&includes=Images:1&api_key=" + api_key;

    $('#etsy-images').empty();
    // $('<p></p>').text('Searching for ' + terms).appendTo('#etsy-images');

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
               
                var imageItem = $("<img>");
                imageItem.addClass("save-etsy");
                imageItem.attr("id", "etsy" + i);
                imageItem.attr("src", item.Images[0].url_75x75);
                imageItem.attr("gift-status", "unsaved-gift");
                imageItem.append('<a href="' + item.url + '" target="_blank"></a>');
                $("#etsy-images").append(imageItem);
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
                
                var imageItem = $("<img>");
                imageItem.addClass("save-etsy");
                imageItem.attr("id", "etsy-g" + i);
                imageItem.attr("src", item.Images[0].url_75x75);
                imageItem.attr("gift-status", "unsaved-gift");
                imageItem.append('<a href="' + item.url + '" target="_blank"></a>');
                $("#etsy-images-generated").append(imageItem);
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

  var savedId;

  // ************** Launch save gift modal ************
  $(document).on("click", ".save-etsy", function (event) {
    event.preventDefault();

    savedId = $(this).attr("id");
    if ($('#' + savedId).attr("gift-status") === "unsaved-gift") {
      $("#addGiftModalCenter").modal('show');
    } else {
      var link = $('#' + savedId).children([0]);
      window.open(link.attr("href"), "_blank");
    }
  })

  // ************** Save gift (on modal) ***************
  $(document).on("click", "#save-gift", addGift);

  function addGift(event) {
    event.preventDefault();

      var giftItems = $('#' + savedId);
      giftItems.attr("gift-status", "saved-gift");
      giftItems.prependTo($('#saved-gifts'));
      console.log("I am an unsaved gift");

      $("#addGiftModalCenter").modal('toggle');
    }

  // ************* Go to site (on modal) ****************
  $(document).on("click", "#go-to-site", goToSite);

  function goToSite(event) {
    event.preventDefault();

    var link = $('#' + savedId).children([0]);
    window.open(link.attr("href"), "_blank");
    console.log(link);

    $("#addGiftModalCenter").modal('toggle');
  }

  // ************ User Enters Email to "Login" ******************

  $("#add-email").on("click", function (event) {
    event.preventDefault();
    // empty any error message
    $("#email-error-message").empty();
    // hide the person's content when switching users
    $("#persons-content").hide();
    // empty the buttons - this will be necessary when a new user starts a list
    $("#person-buttons").empty();
    // hide the gift content for new user
    $("#gift-content").hide();

    // reset the ID and data to "" - the follow code will assign the ID based on the e-mail
    id = "";
    data = {
      giftList: []
    }

    // sets the user equal to the input value
    user = $("#email-id").val().trim();
    // tell the user that they are logged in
    $("#logged-in-message").text("You're logged in as: "+user);    
    // empty email input after button click
    $("#email-id").val("");
    // "value" event listener for FB
    database.ref().on("value", function (snapshot) {
      // for each key item in the db, get the email and the temp items for each record,
      // if it's a "valid" record, then it will have an email, temp records are setup temporarily
      // to trigger the event listener, but will be removed below 
      for (var key in snapshot.val()) {
        var ref = database.ref(key);
        ref.once("value").then(function (snapshot) {
          var tmpEmail = snapshot.val().email;
          var tmpDelete = snapshot.val().temp;
          // if the email in the FB record matches what was input, then this is the record we want
          // so it sets the global data equal to the data record associate with the key - we also store
          // the key so we know which record to update later 

          if (tmpEmail === user) {
            //check to see if the data exists - if there is no data, it means the user deleted all of the
            // people in the gift list, so we want to keep the data as as blank object
            if (typeof snapshot.val().data !== 'undefined') {
              data = snapshot.val().data;
            }
            id = snapshot.key;
            createButtons(id);
            console.log(user, data, id);
          }

        })
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

    // don't try to create buttons if the data is undefined - this is a
    // fail safe to keep errors from happening
    if (typeof data !== 'undefined') {

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
        x.attr("person-name-button", i);
        // append the x button
        a.append(x);

        // Adding the button to the HTML
        $("#person-buttons").append(a);
      }
    }
  }

  // ************ Regenerate Keyword ***************************

  // $(document).on("click", "#regenerate-keyword", function (event) {
  //   event.preventDefault();
  //   var newWord = $("#new-keyword").val().trim();
  //   console.log(newWord); 
  // })

  // ************ Delete a person on Gift List ******************

  // if the close button is clicked, run this function
  $(document).on("click", ".close", function () {
    // return the parent element 
    var par = $(event.target).parent();
    // disable the parent button - this keeps the gifs from displaying when user is trying to 
    // remove the button
    par.attr("disabled", true);
    // declare a variable of the person of the clicked button
    var rem = $(this).attr("person-name-button");
    console.log(data.giftList, data.giftList.length);

    // if thre is only person in the list, then reset the gift list to an empty object
    // and empty the buttons - this keeps it from going to "undefined"
    if (data.giftList.length === 1) {
      data = {
        giftList: []
      }
      $("#person-buttons").empty();
    } else {
      // remove the element from the gift list array
      data.giftList.splice(rem, 1);
      // render the buttons again - the removed button will not be there anymore
      createButtons();
    }

    // submit the deletion to the database
    writeUserData(id, user, data);
    console.log(data + "after push");
  })

  // ************ Make Changes to the Gift List ******************

  // use this to update the gift list with a new person - pushes to the object, then use writeUserData
  // to push to FB
  function updatedGiftListData(name, relationship, keyword, personality, budget) {
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
    if (key === "") {
      id = database.ref().push({
        email: user,
        data: data
      });
      // otherwise, if there is a key, we want to set the record associated with that key - this will 
      // OVERWRITE what is there, so it is very important to keep the data variable clean and always be
      // updating the db whenever the data changes
    } else {
      database.ref(key).set({
        email: user,
        data: data
      })
    }
  }

  // // ************ Slick Carousel **********************************
  $('.gallery-responsive').slick({
    dots: true,
    // fade: true,
    infinite: true,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });
  // $('.gallery-responsive').show();

});
