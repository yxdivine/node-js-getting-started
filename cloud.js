var AV = require('leanengine');

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

/**
 * 一个简单的云代码方法，测试连接
 */
AV.Cloud.define('hello', function (request) {
    return 'Hello world!';
});
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
//
// AV.Cloud.define('uploadscore', function (request) {
//     var level = request.params.level;
//     var score = request.params.score;
//     var time = request.params.time;
//     var userid = request.params.user;
//     var username = request.params.username;
//     var LB = AV.Object.extend('LeaderBoard');
//     //add assertions here
// //     if(score<0 || score>100){
// //         return 'error':
// //     }
//
//     var entry = new LB();
//     entry.set('level', level);
//     entry.set('score', score);
//     entry.set('username', username);
//     var user = new AV.User();
//     user.id = userid;
//     entry.set('exactTime', time);
//     entry.set('uploadTime', new Date());
//     entry.set('user', user);
//     return entry.save().then(function (savedEntry) {
//         return savedEntry;
//     }, function (error) {
//         return error;
//     });
//
// });
//
// AV.Cloud.define('getLeaderBoard', function (request) {
//     var level = request.params.level;
//     var query = new AV.Query('LeaderBoard');
//     query.equalTo('level', level);
//     query.addDescending("score");
//     query.addAscending("exactTime");
//     query.addAscending("uploadTime");
//     return query.find().then(function (results) {
//         return results;
//     }, function (error) {
//         return error;
//     });
//
//
// });

// AV.Cloud.beforeSave('LeaderBoard', function (request) {
//     var time = request.object.get('exactTime');
//     var score = request.object.get('score');
//     if (score && score > 60 && time && time > 8000 && time < 1800000) {//valid
//         var min = Math.floor(time / 60000);
//         var sec = Math.floor(time / 1000 - min * 60 + 1);
//         request.object.set("min", min);
//         request.object.set("sec", sec);
//         var level = parseInt(request.object.get('level').substr(1));
//         var user = request.get(user);
//
//
//     } else {
//         // 不保存数据，并返回错误
//         throw new AV.Cloud.Error('Invalid result!');
//     }
// });

var updateRanking = function (user, username, lv, score, ftime, utime) {
    console.log('updateRanking...'+username+' '+lv+' '+score+' '+ftime);
    var query = new AV.Query('Ranking');
    query.equalTo('user', user);
    query.find().then(function (res) {
        console.log('res;');
        var current;
        if (res.length > 0) {
            console.log('found ranking');
            current = res[0];
            var prev_lv = current.get('lv');
            var prev_score = current.get('score');
            var prev_ftime = current.get('finish_time');
            var shouldUpdate = false;
            if (lv > prev_lv) { // reached new level
                shouldUpdate = true;
            } else if (lv == prev_lv && score > prev_score) {// same level, new high score
                shouldUpdate = true;
            } else if (lv == prev_lv && score == prev_score && prev_ftime > ftime) {
                // same level same score shorter time
                shouldUpdate = true;
            }
            console.log('shouldUpdate: '+shouldUpdate);
            if (shouldUpdate) {
                current.set('lv', lv);
                current.set('score', score);
                current.set('finish_time', ftime);
                current.set('upload_time', utime);
                console.log('update existing rank');
                current.save().then(function(res){console.log(res);},function(err){console.log(err)});
            }
        } else {
            console.log('not found ranking');
            var Ranking = AV.Object.extend('Ranking');
            current = new Ranking();
            current.set('user', user);
            current.set('username', username);
            current.set('lv', lv);
            current.set('score', score);
            current.set('finish_time', ftime);
            current.set('upload_time', utime);
            console.log('saving new rank');
            current.save().then(function(res){console.log(res);},function(err){console.log(err)});
        }
    }, function (err) {
        console.log('err!!!');
        console.log(err);
    });

}

AV.Cloud.define('uploadRecord', function (request) {
    //parse entry
    var level = request.params.level;
    var score = request.params.score;
    var time = request.params.time;
    var userid = request.params.user;
    var username = request.params.username;
    var Record = AV.Object.extend('record');
    //add assertions here

    //get current record
    var user = new AV.User();
    user.id = userid;
    var query = new AV.Query('record');
    query.equalTo('user', user);
    return query.find().then(function (success) {
        var current;
        if (success.length > 0) {//update existing entry
            current = success[0];
            var cscore = current.get(level + "_score");
            var ctime = current.get(level + "_time");
            if ((typeof cscore) == 'undefined' || cscore < score || (cscore == score && ctime > time)) {
                //existing user record breaking current record
                var uploadTime = new Date();
                current.set(level + "_score", score);
                current.set(level + "_time", time);
                current.set(level + "_utime", uploadTime);
                current.save();
                updateRanking(user, username, parseInt(level.substr(1), 10), score, time, uploadTime);
                return "new record";
            } else {
                return "try harder next time";
            }
        } else {//create new entry
            current = new Record();
            var uploadTime = new Date();
            current.set('user', user);
            current.set('username', username);
            current.set(level + "_score", score);
            current.set(level + "_time", time);
            current.set(level + "_utime", uploadTime);
            current.save();
            updateRanking(user, username, parseInt(level.substr(1), 10), score, time, uploadTime);
            return "success";
        }
        return "unknown error, keep prev record";
    }, function (error) {
        console.log(error);
        return error;
    });
});

AV.Cloud.define('getRecord', function (request) {
    var level = request.params.level;
    var query = new AV.Query('record');
    query.select(["username", "user", level + "_score", level + "_time", level + "_utime"]);
    query.greaterThan(level + "_score", 59);
    query.addDescending(level + "_score");
    query.addAscending(level + "_time");
    query.addAscending(level + "_utime");
    return query.find().then(function (results) {
        return results;
    }, function (error) {
        return error;
    });
});