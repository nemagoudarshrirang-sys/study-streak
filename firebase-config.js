(function(){
  var env = (window.__ENV||{});
  var cfg = {
    apiKey: env.apiKey,
    authDomain: env.authDomain,
    projectId: env.projectId
  };
  window.__FIREBASE_CONFIG = cfg;
})();