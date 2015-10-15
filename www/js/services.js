angular.module('starter.services', [])
.factory('TwitterService', function($cordovaOauth, $cordovaOauthUtility, $http, $resource, $q) {
  var twitterKey = "STORAGE.TWITTER.KEY";
  var clientId = "oygfO2el6S3pKD8sLZClLWc6H";
  var clientSecret = "IL2dp5pZdAmG6CGuBCNqTCx1jBUZBYLX4xTsSzbO8G9ukQWjKY";
  
    // 2
    function storeUserToken(data) {
        window.localStorage.setItem(twitterKey, JSON.stringify(data));
    }

    function getStoredToken() {
        return window.localStorage.getItem(twitterKey);
    }

    // 3
    function createTwitterSignature(method, url) {
        var token = angular.fromJson(getStoredToken());
        var oauthObject = {
            oauth_consumer_key: clientId,
            oauth_nonce: $cordovaOauthUtility.createNonce(10),
            oauth_signature_method: "HMAC-SHA1",
            oauth_token: token.oauth_token,
            oauth_timestamp: Math.round((new Date()).getTime() / 1000.0),
            oauth_version: "1.0"
        };
        var signatureObj = $cordovaOauthUtility.createSignature(method, url, oauthObject, {}, clientSecret, token.oauth_token_secret);
        $http.defaults.headers.common.Authorization = signatureObj.authorization_header;
    }
  
  return {
        // 4
        initialize: function() {
            var deferred = $q.defer();
            var token = getStoredToken();

            if (token !== null) {
                deferred.resolve(true);
            } else {
                $cordovaOauth.twitter(clientId, clientSecret).then(function(result) {
                    storeUserToken(result);
                    deferred.resolve(true);
                }, function(error) {
                    	console.log(error);
                    deferred.reject(false);
                });
            }
            return deferred.promise;
        },
        // 5
        isAuthenticated: function() {
            return getStoredToken() !== null;
        },
        // 6
        getHomeTimeline: function(callback) {
            var home_tl_url = 'https://api.twitter.com/1.1/statuses/home_timeline.json';
            createTwitterSignature('GET', home_tl_url);
            return $resource(home_tl_url).query(callback);
        },
        storeUserToken: storeUserToken,
        getStoredToken: getStoredToken,
        createTwitterSignature: createTwitterSignature
    };
})
.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  },{
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
