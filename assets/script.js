$(document).ready(function() {
  var mapsEmbedKey = "AIzaSyDkB2SGpufmMHUsXCur6aDwpC-IUtp9R8g"
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
          $("#petsResults").html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>We're sorry, but our service is unavailable at this time. We apologize for any inconvenience.</pre>")
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
    if (localStorage.getItem("recentPetIDs")) {
      var recentPets = JSON.parse(localStorage.getItem("recentPetIDs"));
      recentPetEl.attr("style", "display: block;");
      $("#recentPetHeader").attr("style", "display: block;");
      
      for (var i = 0; i < recentPets.length; i++) {
        var URL = petRequestURL + "/" + recentPets[i];

        fetch(URL, setPetRequestOptions())
          .then(function(response) {
            if (!response.ok) {
              recentPetEl.html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>We're sorry, but there seems to be an issue retrieving that information. We apologize for any inconvenience.</pre>")
            } else {
              return response.json();
            }
          })
          .then(function(data) {
            console.log(data);
            var listEl = $('<li style="display: inline;">');
            var recentPetPhoto = $("<img>");
            listEl.attr("data-recent-id", data.animal.id);
            if (data.animal.primary_photo_cropped) {
              recentPetPhoto.attr("src", data.animal.primary_photo_cropped.small);
            } else {
              setPlaceholderImage(data.animal.type, recentPetPhoto);
            };
            recentPetPhoto.attr("width", "100");
            listEl.addClass("mr-3").addClass("recentView");
            recentPetEl.append(listEl);
            listEl.append(recentPetPhoto);
          })
      }
    } else {
      return
    }
  }

  // Function to set placeholder image if photo is nonexistent
  var setPlaceholderImage = function(type, destination) {
    if (type == "Dog") {
      destination.attr("src", "images/cartoon_dog.png");
    } else if (type == "Cat") {
      destination.attr("src", "images/cartoon_cat.png");
    } else if (type == "Rabbit") {
      destination.attr("src", "images/cartoon_rabbit.png");
    } else if (type == "Small & Furry") {
      destination.attr("src", "images/cartoon_hamster.jpeg");
    } else if (type == "Horse") {
      destination.attr("src", "images/cartoon_horse.jpeg");
    } else if (type == "Bird") {
      destination.attr("src", "images/cartoon_bird.png");
    } else {
      destination.attr("src", "images/cartoon_lizard.jpeg");
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
    var petResultsHeaderEl = $("#petsResultsHeader");
    var petNumberCountEl = $("#numberCount");

    petNumberCountEl.text(data.pagination.total_count + " animals on " + data.pagination.total_pages + " pages");

    // Store pagination data to use for results and display page buttons
    petResultsEl.attr("data-page", data.pagination.current_page);
    petResultsEl.attr("data-total-pages", data.pagination.total_pages);
    $("#pageNumber").text("Page: " + data.pagination.current_page);
    // $("#pageBtns").attr("style", "display: block;");
    $("#pageBtns").removeClass("is-hidden");

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
      var petPhotoEl = $("<img>");
      petEl.addClass("has-text-grey").addClass("mr-4");
      petEl.addClass("pet");
      var petColorEl = $("<p>");
      petColorEl.addClass("has-text-grey");
      var petSpeciesEl = $("<p>");
      var petBreedsEl = $("<p>");
      petEl.attr("data-id", data.animals[i].id);
      var petNameEl = $("<p>");
      var petGenderEl = $("<p>");
      
      if (data.animals[i].primary_photo_cropped) {
        petPhotoEl.attr("src", data.animals[i].primary_photo_cropped.small);
        petPhotoEl.addClass("image is-128x128");
      } else {
        setPlaceholderImage(data.animals[i].type, petPhotoEl);
        petPhotoEl.addClass("image is-128x128");
      }

      if (data.animals[i].name != null && data.animals[i].name != "") {
        petNameEl.text("Name: " + data.animals[i].name);
      } else {
        petNameEl.text("Name: Not Available");
      }

      petSpeciesEl.text("Species: " + data.animals[i].species);

      if (data.animals[i].gender != null && data.animals[i].gender != "") {
        petGenderEl.text("Gender: " + data.animals[i].gender);
      } else {
        petGenderEl.text("Gender: Not Available");
      }
      petBreedsEl.text("Breed: " + data.animals[i].breeds.primary);
      if (data.animals[i].colors.primary !== null) {
        petColorEl.text("Color: " + data.animals[i].colors.primary);
      } else {
        petColorEl.text("Color: N/A");
      };
      petEl.append(petPhotoEl);
      petEl.append(petNameEl);
      petEl.append(petSpeciesEl);
      petEl.append(petGenderEl);
      petEl.append(petColorEl);
      petEl.append(petBreedsEl);
      petResultsEl.append(petEl);
      petResultsHeaderEl.show();
      petNumberCountEl.show();
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
          $("#petsResults").html("<pre>ERROR: " + response.status + " " + response.statusText + "<br>There seems to be a problem with the search request. Please check the spelling and format of the location entered. We apologize for any inconvenience.</pre>")
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
  var petPhotoEl = $("<img>");
  if (data.primary_photo_cropped) {
    petPhotoEl.attr("src", data.primary_photo_cropped.large);
  } else {
    setPlaceholderImage(data.type, petPhotoEl);
    petPhotoEl.attr("width", "600");
  };

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

  var petLocationEl = $("<p>");
  if (data.contact.address.address1 != null) {
    petLocationEl.html(data.contact.address.address1 + "<br>" + data.contact.address.city + ", " + data.contact.address.state + " " + data.contact.address.postcode);
  } else {
    petLocationEl.html(data.contact.address.city + ", " + data.contact.address.state + " " + data.contact.address.postcode);
  };

  var petEmailEl = $("<p>");
  if (data.contact.email != null) {
    petEmailEl.text("Email: " + data.contact.email);
  } else {
    petEmailEl.text("Email: Not Available");
  }

  var petPhoneEl = $("<p>");
  petPhoneEl.text("Phone: " + data.contact.phone);

  var petURL = $("<p>");
  petURL.html("PetFinder URL: <a href=" + data.url + " target=_blank>" + data.url + "</a>");

  // Add element and parameters to Google Maps Embed API to display map of adoption location
  var petMapEl = $('<iframe width="700" height="500" frameborder="0" style="border:0" referrerpolicy="no-referrer-when-downgrade" allowfullscreen>');
  if (data.contact.address.address1 != null && !data.contact.address.address1.includes("PO") && !data.contact.address.address1.includes("P.O.")) {
    var address = data.contact.address.address1 + "," + data.contact.address.city + "," + data.contact.address.state + "," + data.contact.address.postcode;
  } else {
    var address = data.contact.address.city + "," + data.contact.address.state + "," + data.contact.address.postcode;
  }
  var mapsAddress = address.replaceAll(" ", "+");
  petMapEl.attr("src", "https://www.google.com/maps/embed/v1/place?key=" + mapsEmbedKey + "&q=" + mapsAddress);

  // Add these elements to details container
  petDetailsEl.append(petPhotoEl);
  petDetailsEl.append(petNameEl);
  petDetailsEl.append(petDescriptionEl);
  petDetailsEl.append(petAgeEl);
  petDetailsEl.append(petSizeEl);
  petDetailsEl.append(petStatusEl);
  petDetailsEl.append(petLocationEl);
  petDetailsEl.append(petEmailEl);
  petDetailsEl.append(petPhoneEl);
  petDetailsEl.append(petURL);
  petDetailsEl.append(petMapEl);

  //Display details container
  petDetailsEl.show();
  $("#petDetailsHeader").show();
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
        setTimeout(function() {
          document.querySelector("#petDetailsHeader").scrollIntoView();
        }, 200);
        
      })
  }
  
  // Add selected animal to recently viewed section
  var addRecentlyViewed = function(petID) {
    if (localStorage.getItem("recentPetIDs")) {
      var recentPets = JSON.parse(localStorage.getItem("recentPetIDs"));
      if (!recentPets.includes(petID)){
        recentPets.unshift(petID);
      }
      if (recentPets.length > 5) {
        recentPets.pop();
      }
    } else {
      var recentPets = [petID];
    }
    localStorage.setItem("recentPetIDs", JSON.stringify(recentPets));
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
  $("#recentPet").on("click", "li", function(event) {
    event.preventDefault();
    var petID = Number($(this).attr("data-recent-id"));
    getExtendedDetails(petID);
  })

})