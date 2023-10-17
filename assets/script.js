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
})