var AV = require('leanengine');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request) {
  return 'Hello world!';
});
//shuffling function
var randomSort = function (a, b) {
    return Math.random() > .5 ? -1 : 1;
};

var shuffle = function(total){
        var retVal = [];
        for (var i = 0; i < total; i++) {
            retVal.push(i);
        }
        retVal = retVal.sort(randomSort);
        retVal = retVal.slice(0, $scope.quizSize);
        return retVal;
};

AV.Cloud.define('randomAcquireQuestions',function(request){
	var level = request.params.level;
	var query = new AV.Query("config");
	query.equalTo("level",level);
	return query.find().then(function(results){
		var number = results[0].get("number");
		var arr = shuffle(number);
		return arr;
	});
});
