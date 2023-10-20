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
        if (!response.ok) {
          $("#petsResults").html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>We're sorry, but our service is unavailable at this time. We apoligze for any inconvenience.</pre>")
        } else {
        return response.json();
        }
      })
      .then(function(data) {
        // Store access token in body element return expire time to use in setTimeout
        var expireTime = data.expires_in;
        $("body").attr("data-token", data.access_token);
        return expireTime
      })

      // setTimeout for retrieval of another token if browser session lasts long enough
      fetchToken.then(function(expireTime) {
        setTimeout(getToken, expireTime * 1000);
      })

      // Load most recent viewed pet
      fetchToken.then(function(){
        loadRecentlyViewed();
      })
  }
  
  // Call function to fetch the token
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
 
 // Function to take recently viewed pet IDs from local storage and load them into the recently viewed section
 var loadRecentlyViewed = function() {
  var recentPetEl = $("#recentPet");
  recentPetEl.html("");

  // Check if recent pet info is stored in local storage, and if so, display and populate container
  if (localStorage.getItem("recentPetID")) {
    var recentID = localStorage.getItem("recentPetID");
    var URL = petRequestURL + "/" + recentID;

    recentPetEl.attr("style", "display: block;");
    $("#recentPetHeader").attr("style", "display: block;");

    fetch(URL, setPetRequestOptions())
      .then(function(response) {
        if (!response.ok) {
          recentPetEl.html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>We're sorry, but there seems to be an issue retrieving that information. We apoligze for any inconvenience.</pre>")
        } else {
          return response.json();
        }
      })
      .then(function(data) {
        console.log(data);
        var recentPetPhoto = $("<img>");
        recentPetEl.attr("data-recent-id", data.animal.id);
        recentPetPhoto.attr("src", data.animal.primary_photo_cropped.small);
        recentPetEl.append(recentPetPhoto);
      })
  } else {
    return
  }
}

  // Function for search button event listener
  var searchBtnBehavior = function(event) {
    event.preventDefault();

    // Input validation for required parameters and return function if not filled
    if ($("#locationInput").val() === "") {
      $("#locationError").text("Please enter a location.");
      return
    };
    if ($("#distanceInput").val() === "") {
      $("#distanceError").text("Please enter a distance for the search results.");
      return
    };

    // Call function to get the results from API with fetch
    getPetResults(1, null);
  }
  
  // Add selected breed to list
  var addSelectedBreed = function() {
        var selectedBreedsEl = $("#breedsSelected");
        var listEl = $('<li class="selectedBreed" style="display: block;">');
        var removeBtn = $('<button type="button" class="closeBtn">');
        var selectedBreed = breedInputEl.val();

        listEl.text(selectedBreed);
        listEl.attr("data-breed", selectedBreed);
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

    // Set autocomplete with available breeds and have the autocomplete field pop up on focus of input
    breedInputEl.autocomplete({
      source: availableBreeds
    }).focus(function() {
      $(this).autocomplete("search", " ");
    })
  }

  // Set auto complete values by animal type when animal type is changed in selection
  var setBreedAutoComplete = function() {

    // Make breed selection element only appear if type is not ALL and call fetch with selection
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
      $("#breedSelection").attr("style", "display: none;");
    }
  }

  // Set parameters for search with input from form and return fetch request URL
  // Used 'page' and 'existingParams' as parameters in function to
  // facilitate retrieval of search pages when using next and prev buttons
  var setRequestURL = function(page, existingParams) {
    // If using next and previous buttons, take stored existing params and use it in new request
    if (existingParams !== null) {
      var searchParams = new URLSearchParams(existingParams);
    } else {
      // This will be executed if search button is clicked, adding completely new parameters
      var searchParams = new URLSearchParams();
      var genderSelectionEl = $("#genderSelection");
      var locationInputEl = $("#locationInput");
      var sortSelectionEl = $("#sortSelection");
      var breedParam = "";
      var sizeParam = "";
      var ageParam = "";

      if (animalTypeEl.val() !== "All") {
        var typeParam = animalTypeEl.val();
        searchParams.append("type", typeParam);
      }
     
      // Go through each breed selected and grab the breed data attribute to add in search
      if ($(".selectedBreed")) {
        $(".selectedBreed").each(function() {
          breedParam += $(this).attr("data-breed") + ",";
        })
      }
      if (breedParam !== "") {
        searchParams.append("breed", breedParam)
      }
      
      // Grab each checkbox for size and confirm whether or not it is checked and add them to params
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

      $(".otherCharCheckbox").each(function() {
        if ($(this).prop("checked") === true) {
          searchParams.append($(this).attr("data-param"), $(this).val())
        }
      })
      
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

      var sortParam = sortSelectionEl.val();
      searchParams.append("sort", sortParam);

      // Create params data attribute to store searchParams for use in page retrieval buttons
      $("#petsResults").attr("data-params", searchParams);
    }

    searchParams.append("page", page);

    if (searchParams.size !== 0) {
      var petParams = "?" + searchParams.toString();
    };

    // Confirming petParams exists, and if not, the request URL will be the default
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

    // Store pagination data to use for results and display page buttons
    petResultsEl.attr("data-page", data.pagination.current_page);
    petResultsEl.attr("data-total-pages", data.pagination.total_pages);
    $("#pageNumber").text(data.pagination.current_page);
    $("#pageBtns").attr("style", "display: block;");

    // Will hide previous button if already on first page
    if (petResultsEl.attr("data-page") == 1) {
      $("#previousBtn").attr("style", "display: none;");
    } else {
      $("#previousBtn").attr("style", "display: inline;")
    }

    // Will hide next button if on last page possible
    if (petResultsEl.attr("data-total-pages")) {
      if (petResultsEl.attr("data-page") === petResultsEl.attr("data-total-pages")) {
        $("#nextBtn").attr("style", "display: none;");
      } else {
        $("#nextBtn").attr("style", "display: inline;");
      }
    } else {
      $("#nextBtn").attr("style", "display: inline;");
    }

    // Add animal data to page using for loop
    for (var i = 0; i < data.animals.length; i++) {
      var petEl = $("<div>");
      petEl.addClass("has-text-link");
      petEl.addClass("pet");
      var petColorEl = $("<p>");
      petColorEl.addClass("has-text-link");
      var petSpeciesEl = $("<p>");
      var petBreedsEl = $("<p>");
      petEl.attr("data-id", data.animals[i].id);
      
      if (data.animals[i].photos.length !== 0) {     
        var petPhotoEl = $("<img>");  
        petPhotoEl.attr("src", data.animals[i].photos[0].medium);
        petPhotoEl.addClass("image is-128x128");
      } else {
        var petPhotoEl = $("<h2>No Photo Available</h2>");
        petPhotoEl.addClass("image is-128x128");
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
  // Using 'page' and 'existingParams' to facilitate use of page buttons
  var getPetResults = function(page, existingParams) {
    $("#locationError").text("");
    $("#petsResults").html("");

    fetch(setRequestURL(page, existingParams), setPetRequestOptions())
      .then(function(response) {
        if (!response.ok) {
          $("#petsResults").html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>There seems to be a problem with the search request. Please check the spelling and format of the location entered. We apoligze for any inconvenience.</pre>")
        } else {
        return response.json();
        }
      })
      .then(function(data) {
        console.log(data);
        printSearchResults(data);
      })
  }

// Function to display extended details of a pet
var displayExtendedDetails = function(data) {
  var petDetailsEl = $("#petDetails");

  //Clear any previous details
  petDetailsEl.html("");

  // Create Elements to display the details
  var petNameEl = $("<h2>");
  petNameEl.text(data.name);

  var petDescriptionEl = $("<p>");
  petDescriptionEl.text(data.description);

  var petAgeEl = $("<p>");
  petAgeEl.text("Age: " + data.age);

  var petSizeEl = $("<p>");
  petSizeEl.text("Size: " + data.size);

  var petStatusEl = $("<p>");
  petStatusEl.text("Status: " + data.status);

  // Add these elements to details container
  petDetailsEl.append(petNameEl);
  petDetailsEl.append(petDescriptionEl);
  petDetailsEl.append(petAgeEl);
  petDetailsEl.append(petSizeEl);
  petDetailsEl.append(petStatusEl);

  //Display details container
  petDetailsEl.show();
};

  // Fetch details about selected animal once clicked on
  var getExtendedDetails = function(petID) {
    var URL = petRequestURL + "/" + petID;
    fetch(URL, setPetRequestOptions())
      .then(function(response) {
        if (!response.ok) {
          $("#petsResults").html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>We're sorry, but there seems to be an issue retrieving that information. We apoligze for any inconvenience.</pre>")
        } else {
        return response.json();
        }
      })
      .then(function(data) {
        console.log(data);
        // Display the extended details
        displayExtendedDetails(data.animal);
      })
  }
  
  // Add selected animal to recently viewed section
  var addRecentlyViewed = function(petID) {
    localStorage.setItem("recentPetID", petID);
  };

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

  // Set event listener for prev button for search page
  $("#previousBtn").on("click", function(event) {
    event.preventDefault();
    // Grab current page number from data attribute,
    // Decrement the page number,
    // Use new page number in fetch
    var page = $("#petsResults").attr("data-page");
    page--;
    getPetResults(page, $("#petsResults").attr("data-params"));
  });

  // Set event listener for next button for search page
  $("#nextBtn").on("click", function(event) {
    event.preventDefault();
    // Grab current page number from data attribute,
    // Increment the page number,
    // Use new page number in fetch
    var page = $("#petsResults").attr("data-page");
    page++;
    getPetResults(page, $("#petsResults").attr("data-params"));
  });

  // Set event listener for each search result
  $("#petsResults").on("click", ".pet", function(event) {
    event.preventDefault();
    // Grab stored ID from pet element and use it for retrieval of details
    var petID = Number($(this).attr("data-id"));
    addRecentlyViewed(petID);
    loadRecentlyViewed();
    getExtendedDetails(petID);
  })

  // Set event listener for recently viewed pet
  $("#recentPet").on("click", function(event) {
    event.preventDefault();
    var petID = Number($("#recentPet").attr("data-recent-id"));
    getExtendedDetails(petID);
  })

})