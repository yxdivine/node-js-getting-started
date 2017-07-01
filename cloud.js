var AV = require('leanengine');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request) {
  return 'Hello world!';
});

AV.Cloud.define('randomAcquireQuestions',function(request){
	var level = request.params.level;
	var query = new AV.Query("config");
	query.equalTo("level",level);
	query.find().then(function(results){
		var number = results[0].get("number");
		var arr = [];
		for(var i = 0;i<50;i++){
			arr.push(Math.floor(Math.random()*number +1));
		}
		return arr;
	});
});
