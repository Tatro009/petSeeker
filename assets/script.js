$(document).ready(function() {
  var petAPIKey = "5EXQ5Foghv38BcGMwsiiCHFbN2RMahxFoob9XTdwq64B5VA9v9";
  var petSecret = "gLuFEh8iTpSLJXTjLj2xbFMBVLzh4gBV6RPDlTUM";
  var petTokenURL = "https://api.petfinder.com/v2/oauth2/token";
  var petTokenOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&client_id=" + petAPIKey + "&client_secret=" + petSecret
  };
  var petRequestURL = "https://api.petfinder.com/v2/animals";

  // Retrieve PetFinder API Token and set timeout to retrieve another when expired
  var getToken = function() {
    var fetchToken = fetch(petTokenURL, petTokenOptions)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        var expireTime = data.expires_in;
        $("body").attr("data-token", data.access_token);
        return expireTime
      })

      fetchToken.then(function(expireTime) {
        setTimeout(getToken, expireTime * 1000);
      })
  }
  
  getToken();

  // Set options for fetch request and return value for it
  var setPetRequestOptions = function() {
    var accessToken = $("body").attr("data-token");
    var petRequestOptions = {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + accessToken,
        }
    }
    return petRequestOptions;
  }

  // Set parameters for search with input from form and return fetch request URL
  var setRequestURL = function() {
    var searchParams = new URLSearchParams();
    var animalTypeEl = $("#animalType");
    var genderSelectionEl = $("#genderSelection");
    var locationInputEl = $("#locationInput");
    
    if (animalTypeEl.val() !== "All") {
      var typeParam = animalTypeEl.val();
      searchParams.append("type", typeParam);
    }

    var sizeParam = "";
    $(".sizeCheckbox").each(function() {
      if ($(this).prop("checked") === true) {
        sizeParam += $(this).val() + ",";
      };
    });
    if (sizeParam !== "") {
      searchParams.append("size", sizeParam);
    };

    if (genderSelectionEl.val() !== "any") {
      var genderParam = genderSelectionEl.val();
      searchParams.append("gender", genderParam);
    };

    var ageParam = "";
    $(".ageCheckbox").each(function() {
      if ($(this).prop("checked") === true) {
        ageParam += $(this).val() + ",";
      };
    });
    if (ageParam !== "") {
      searchParams.append("age", ageParam);
    };

    if (locationInputEl.val() !== "") {
      var locationParam = locationInputEl.val();
      searchParams.append("location", locationParam);
    }

    if (searchParams.size !== 0) {
      var petParams = "?" + searchParams.toString();
    };

    if (petParams) {
      var finalRequestURL = petRequestURL + petParams;
    } else {
      var finalRequestURL = petRequestURL;
    };

    return finalRequestURL;
  }

  // Function to print search results to page
  var printSearchResults = function(data) {
    var petResultsEl = $("#petsResults");
    
    for (var i = 0; i < data.animals.length; i++) {
      var petEl = $("<div>");
      var petColorEl = $("<p>");
      var petSpeciesEl = $("<p>");
      var petBreedsEl = $("<p>");
      petEl.attr("data-id", data.animals[i].id);
      
      if (data.animals[i].photos.length !== 0) {     
        var petPhotoEl = $("<img>");  
        petPhotoEl.attr("src", data.animals[i].photos[0].medium);
      } else {
        var petPhotoEl = $("<h2>No Photo Available</h2>");
      }
      petSpeciesEl.text("Species: " + data.animals[i].species);
      petBreedsEl.text("Breed: " + data.animals[i].breeds.primary);
      if (data.animals[i].colors.primary !== null) {
        petColorEl.text("Color: " + data.animals[i].colors.primary);
      } else {
        petColorEl.text("Color: N/A");
      };
      petEl.append(petPhotoEl);
      petEl.append(petSpeciesEl);
      petEl.append(petColorEl);
      petEl.append(petBreedsEl);
      petResultsEl.append(petEl);
    }
  }

  // Fetch search results from PetFinder API and log to console for viewing full data
  var getPetResults = function() {
    $("#locationError").text("");

    fetch(setRequestURL(), setPetRequestOptions())
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log(data);
        printSearchResults(data);
      })

  }

  // Set event listener for search button
  $("#searchBtn").on("click", function(event) {
    event.preventDefault();
    if ($("#locationInput").val() === "") {
      $("#locationError").text("Please enter a location.");
      return
    };
    $("#petsResults").html("");
    getPetResults();
  });

})