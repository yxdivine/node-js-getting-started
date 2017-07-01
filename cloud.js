var AV = require('leanengine');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request) {
  return 'Hello world!';
});
//constant
var quizSize = 50;

//randomsorting
var randomSort = function (a, b) {
    return Math.random() > .5 ? -1 : 1;
};
//shuffling function
var shuffle = function(total){
        var retVal = [];
        for (var i = 0; i < total; i++) {
            retVal.push(i);
        }
        retVal = retVal.sort(randomSort);
        retVal = retVal.slice(0, quizSize);
        return retVal;
};

//acquire questions from cloud
AV.Cloud.define('randomAcquireQuestions',function(request){
	var level = request.params.level;
	var query = new AV.Query("config");
	query.equalTo("level",level);
	return query.find().then(function(results){
		var number = results[0].get("number");
		var arr = shuffle(number);

		var mainQuery = new AV.Query(level);
		mainQuery.equalTo("id",arr[0]);
		
// 		for(var i = 0;i<arr.length;i++){
// 			var query = new AV.Query(level);
// 			query.equalTo("id",arr[i]);
// 			mainQuery = AV.Query.or(mainQuery,query);
// 		}
		return mainQuery.find().then(function(results){
			return results;
		});
	});
});
