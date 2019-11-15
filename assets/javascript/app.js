
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
  
  
  
// etsy-api-setup
// etsy ajax call
// adds item that was searched for can click the image and go to etsy store
// if more than four images add a break and start new row
// currently fetching 16 items
$(document).ready(function () {
  $('#etsy-search').on('submit', function () {
    api_key = "82wfohi8ezzm1fq3vflms9ul";
    terms = $('#etsy-terms').val();
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
        } else {
          $('#etsy-images').empty();
          console.log(data.error);
        }
      }
    });
    return false;
  })
});


