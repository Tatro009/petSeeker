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
  var animalTypeEl = $("#animalType");
  var breedInputEl = $("#breedInput");

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

  // Function for search button event listener
  var searchBtnBehavior = function(event) {
    event.preventDefault();
    if ($("#locationInput").val() === "") {
      $("#locationError").text("Please enter a location.");
      return
    };
    if ($("#distanceInput").val() === "") {
      $("#distanceError").text("Please enter a distance for the search results.");
      return
    };
    $("#petsResults").html("");
    getPetResults();
    $("#breedsSelected").html("");
  }
  
  // Add selected breed to list
  var addSelectedBreed = function() {
        var selectedBreedsEl = $("#breedsSelected");
        var listEl = $('<li class="selectedBreed" style="display: block;">');
        var removeBtn = $('<button type="button" class="closeBtn">');
        var selectedBreed = breedInputEl.val();

        listEl.text(selectedBreed);
        removeBtn.text("x");
        selectedBreedsEl.append(listEl);
        listEl.append(removeBtn);
  }

  // Get breeds data from fetch, populate autocomplete field, and add selected breeds
  var setAvailableBreeds = function(data) {
    var availableBreeds = [];

    for (var i = 0; i < data.breeds.length; i++) {
        availableBreeds.push(data.breeds[i].name);
    }
    breedInputEl.autocomplete({
      source: availableBreeds
    }).focus(function() {
      $(this).autocomplete("search", " ");
    })
  }

  // Set auto complete values by animal type when animal type is changed in selection
  var setBreedAutoComplete = function() {
    if (animalTypeEl.val() !== "All") {
      $("#breedSelection").attr("style", "display: block;");
      var animalType = animalTypeEl.val();
      var breedFetchURL = "https://api.petfinder.com/v2/types/" + animalType + "/breeds"

      fetch(breedFetchURL, setPetRequestOptions())
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          setAvailableBreeds(data);
        })
    } else {
      $("#breedSelection").attr("style", "display: none;")
    }
  }

  // Set parameters for search with input from form and return fetch request URL
  var setRequestURL = function() {
    var searchParams = new URLSearchParams();
    var genderSelectionEl = $("#genderSelection");
    var locationInputEl = $("#locationInput");
    
    if (animalTypeEl.val() !== "All") {
      var typeParam = animalTypeEl.val();
      searchParams.append("type", typeParam);
    }

    var breedParam = "";
    if ($(".selectedBreed")) {
      $(".selectedBreed").each(function() {
        $(this).children().remove();
        breedParam += $(this).text() + ",";
      })
    }
    if (breedParam !== "") {
      searchParams.append("breed", breedParam)
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

    if ($("#distanceInput").val() !== "") {
      var distanceParam = $("#distanceInput").val();
      searchParams.append("distance", distanceParam);
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
      petEl.addClass(".has-text-link");
      var petColorEl = $("<p>");
      petColorEl.addClass("has-text-link");
      var petSpeciesEl = $("<p>");
      var petBreedsEl = $("<p>");
      petEl.attr("data-id", data.animals[i].id);
      
      if (data.animals[i].photos.length !== 0) {     
        var petPhotoEl = $("<img>");  
        petPhotoEl.attr("src", data.animals[i].photos[0].medium);
        petPhotoEl.addClass("image is-128x128")
      } else {
        var petPhotoEl = $("<h2>No Photo Available</h2>");
        petPhotoEl.addClass("image is-128x128")
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
  $("#searchBtn").on("click", searchBtnBehavior);
  
  // Set event listener for change in animal type
  $("#animalType").on("change", function() {
    $("#breedsSelected").html("");
    setBreedAutoComplete();
  });

  // Set event listener for remove button on selected breeds
  $("#breedsSelected").on("click", ".closeBtn", function() {
    $(this).parent().remove();
  })

  // Set event listener for add button for breed
  $("#breedsAddBtn").on("click", function() {
    addSelectedBreed();
    breedInputEl.val("");
  });

})