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
	return query.find().then(function(results){
		
		return results[0].get("number");
	});
});
