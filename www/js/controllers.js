angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $rootScope, $ionicLoading, $ionicPlatform, $ionicSlideBoxDelegate, TwitterService) {
  
  $scope.currentTweetIdx = 0;
  $scope.speech = new SpeechSynthesisUtterance();
  
  $scope.timer1 = 0;
  $scope.timer2 = 0;
  $scope.timer3 = 0;
  $scope.timer4 = 0;
  
  $scope.paused = false;
  
  $scope.say = function(words) {
    if ($scope.paused === true) return;
    if ($rootScope.settings.skipUrls === true)
      words = words.replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/mg, '');
    
    if ($rootScope.settings.skipHashtags === true)
      words = words.replace(/#([^\\s]*)/g,'');
      
    if ($rootScope.settings.skipMentions === true)
      words = words.replace(/\B@[a-z0-9_-]+/gi,'');
    
    $scope.speech.text = words;
    $scope.speech.lang = 'en-US';
    if (ionic.Platform.isAndroid())
      $scope.speech.rate = 1.0;
    else
      $scope.speech.rate = 0.1;
    
    speechSynthesis.speak($scope.speech);
  };
  
  $scope.slideHasChanged = function(idx) {
    $scope.currentTweetIdx = idx;
    if ($scope.paused === true) return; 
    console.log("IDX is now " + idx);
    speechSynthesis.cancel();
    
    console.log($scope.home_timeline[idx]);
    
    clearTimeout($scope.timer1);
    clearTimeout($scope.timer2);
    clearTimeout($scope.timer3);
    clearTimeout($scope.timer4);
    
    for (var i = 0; i < $scope.home_timeline.length; i++) {
      $scope.home_timeline[i].phase = -1;
    }
    
    $scope.home_timeline[idx].phase = 0;
    
    $scope.timer4 = setTimeout(function() {
      $scope.say($scope.home_timeline[idx].user.name);
      $ionicSlideBoxDelegate.update();
    }, 800);
    
  };
  
  $scope.togglePlay = function() {
    $scope.paused = !$scope.paused;
    var text = "Playing"
    if ($scope.paused) {
      text = "Paused";
      speechSynthesis.cancel();
      
      clearTimeout($scope.timer1);
      clearTimeout($scope.timer2);
      clearTimeout($scope.timer3);
      clearTimeout($scope.timer4);
      
    } else {
      $scope.slideHasChanged($scope.currentTweetIdx);
    }
    
    $ionicLoading.show({
      template: text,
      duration: 300
    });
  };
  
  $scope.speech.onend = function(e) {
    if ($scope.home_timeline.length == 0) return;
    if ($scope.currentTweetIdx + 1 > $scope.home_timeline.length) return;
    
    var i = $scope.currentTweetIdx;
    if (typeof($scope.home_timeline[i].phase) === "undefined") $scope.home_timeline[i].phase = -1;
    
    // If the phase is -1, start by pronouncing the name
    if ($scope.home_timeline[i].phase == -1) {
      $scope.home_timeline[i].phase = 0;
      $scope.timer1 = setTimeout(function() {
        $scope.say($scope.home_timeline[i].user.name);
      }, 1500);
    }
    // If the phase is 0, we just finished pronouncing the name, now do the date
    else if ($scope.home_timeline[i].phase == 0) {
      $scope.home_timeline[i].phase = 1;
      $scope.timer2 = setTimeout(function() {
        $scope.say(moment($scope.correctTimestring($scope.home_timeline[i].created_at)).fromNow());
      }, 500);
    }
    // If the phase is 1, we just finished pronouncing the date, now do the tweet
    else if ($scope.home_timeline[i].phase == 1) {
      $scope.home_timeline[i].phase = 2;
      $scope.timer3 = setTimeout(function() {
        $scope.say($scope.home_timeline[i].text);
      }, 500);
    }
    // If the phase is 1, we just finished saying the tweet. Advance to the next
    else if ($scope.home_timeline[i].phase == 2) {
      /*
      $scope.home_timeline[i].phase = -1;
      $scope.currentTweetIdx++;
      if ($scope.currentTweetIdx + 1 > $scope.home_timeline.length) return;
      i = $scope.currentTweetIdx;
      $scope.home_timeline[i].phase = 0;
      setTimeout(function() {
        $scope.say($scope.home_timeline[i].user.name);
      }, 1500);
      */
      $ionicSlideBoxDelegate.next();
    }
    
  };
  
  $scope.pronounceTweet = function() {
    if ($scope.currentTweetIdx + 1 > $scope.home_timeline.length)
    {
      $scope.currentTweetIdx = 0;
      return;
    }
    setTimeout(function() {
      $scope.say($scope.home_timeline[$scope.currentTweetIdx].user.name);
    }, 1000);
    
    setTimeout(function() {
      $scope.say($scope.home_timeline[$scope.currentTweetIdx].text);
    }, 3000);
    
    setTimeout(function() {
      $scope.currentTweetIdx++;
      $scope.pronounceTweet();
    }, 8000);
  };
  
  $scope.correctTimestring = function(str) {
    return new Date(Date.parse(str));
  };
  
  $scope.showHomeTimeline = function() {
    $scope.home_timeline = TwitterService.getHomeTimeline(function() {
      setTimeout(function() {
        if ($rootScope.settings.recentFirst === false)
          $scope.home_timeline = $scope.home_timeline.reverse();
        
        $scope.currentTweetIdx = 0;
        $scope.home_timeline[0].phase = 0;
        $scope.say($scope.home_timeline[0].user.name);
        
      }, 2000);
      $ionicSlideBoxDelegate.update();
    });
  };
  
  $scope.doRefresh = function() {
    
    $scope.home_timeline = [];
    $ionicSlideBoxDelegate.update();
    
    speechSynthesis.cancel();
      
    clearTimeout($scope.timer1);
    clearTimeout($scope.timer2);
    clearTimeout($scope.timer3);
    clearTimeout($scope.timer4);
    
    if (TwitterService.isAuthenticated()) {
      $scope.showHomeTimeline();
    } else {
      console.log("No auth found");
      $scope.tryTwitterSignIn();
    }
    
  };
  
  $scope.tryTwitterSignIn = function() {
    TwitterService.initialize().then(function(result) {
      if (result === true) {
        $scope.showHomeTimeline();
      } else {
        $ionicLoading.show({
          template: "Sign in to Twitter failed. Please try again.",
          duration: 2500,
          noBackdrop: true
        });
        
        setTimeout(function() {
          $scope.tryTwitterSignIn();
        }, 2500);
      }
    });
  };
  
  $ionicPlatform.ready(function() {
    
    
    console.log("Ionic ready...");
    
    if (ionic.Platform.isAndroid())
      console.log("ANDROID YES");
    
    console.log(TwitterService.isAuthenticated());
    if (TwitterService.isAuthenticated()) {
      $scope.showHomeTimeline();
    } else {
      console.log("No auth found");
      $scope.tryTwitterSignIn();
    }
  });
})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $rootScope) {
  
  $scope.saveSettings = function() {
    window.localStorage.setItem("settings", JSON.stringify($rootScope.settings));
  }
  
  $scope.sayWelcome = function() {
    var u = new SpeechSynthesisUtterance();
    var txt = "Welcome to shout box";
    u.text = txt;
    u.lang = 'en-US';
    u.rate = 0.2;
    speechSynthesis.speak(u);
  };
});
