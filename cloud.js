var AV = require('leanengine');

/**
 * 一个简单的云代码方法，测试连接
 */
AV.Cloud.define('hello', function (request) {
    return 'Hello world!';
});
//constant
var quizSize = 50;

//randomsorting
var randomSort = function (a, b) {
    return Math.random() > .5 ? -1 : 1;
};
//shuffling function
var shuffle = function (total) {
    var retVal = [];
    for (var i = 1; i <= total; i++) {
        retVal.push(i);
    }
    retVal = retVal.sort(randomSort);
    retVal = retVal.slice(0, quizSize);
    return retVal;
};

//acquire questions from cloud
AV.Cloud.define('randomAcquireQuestions', function (request) {
    //get level info
    var level = request.params.level;
    var query = new AV.Query("config");
    query.equalTo("level", level);
    return query.find().then(function (results) {
        //randomly acquire questions from the target question set
        var number = results[0].get("number");
        var arr = shuffle(number);
        //query
        var mainQuery = new AV.Query(level);
        mainQuery.equalTo("id", arr[0]);
        for (var i = 1; i < quizSize; i++) {
            var query = new AV.Query(level);
            query.equalTo("id", arr[i]);
            mainQuery = AV.Query.or(mainQuery, query);
        }
        return mainQuery.find().then(function (results) {
            return results.sort(randomSort);
        });
    });
});

AV.Cloud.define('uploadscore', function (request) {
    var level = request.params.level;
    var score = request.params.score;
    var time = request.params.time;
    var userid = request.params.user;
    var username = request.params.username;
    var LB = AV.Object.extend('LeaderBoard');
    //add assertions here
//     if(score<0 || score>100){
//         return 'error':
//     }

    var entry = new LB();
    entry.set('level', level);
    entry.set('score', score);
    entry.set('username',username);
    var user = new AV.User();
    user.id=userid;
    entry.set('exactTime', time);
    entry.set('uploadTime', new Date());
    entry.set('user',user);
    return entry.save().then(function (savedEntry) {
        return savedEntry;
//         var query = new AV.Query("LeaderBoard");
//         query.equalTo("level",request.params.level);
//         console.log("lvl "+request.params.level);
//         query.addDescending("score");
//         query.addAscending("exactTime");
//         query.addAscending("uploadTime");
// //         query.limit(100);
//         return query.find().then(function(results){
//             return results;
//         },function(error){
//             return error;
//         });
    }, function (error) {
        return error;
    });

});

AV.Cloud.define('getLeaderBoard',function(request){
    var level = request.params.level;
    var query = new AV.Query('LeaderBoard');
    query.equalTo('level',level);
    query.addDescending("score");
    query.addAscending("exactTime");
    query.addAscending("uploadTime");
    return query.find().then(function(results){
        return results;
    },function(error){
        return error;
    });
    
    
});

AV.Cloud.beforeSave('LeaderBoard', function(request) {
  var time = request.object.get('exactTime');
    var score = request.object.get('score');
  if (score && score>60 &&time && time > 8000 && time < 1800000) {
      var min = Math.floor(time/60000);
      var sec = Math.floor(time/1000 - min * 60+1);
      request.object.set("min",min);
      request.object.set("sec",sec);
  } else {
    // 不保存数据，并返回错误
    throw new AV.Cloud.Error('Invalid result!');
  }
});
