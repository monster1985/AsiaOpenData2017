var http = require("http");
var url = require('url');
var fs = require('fs');
var os = require('os');
var MongoClient = require('mongodb').MongoClient;

var count=0;
var realCount=0;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

var params=function(req){
  var q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach(function (item) {
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}
function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
function generateHtml(resultEle, timestamp) {
	var resultStr = "";
	resultStr = "<html><body><table>";
	
	resultEle.forEach(function(data, index) {
		console.log ('---> '+index+'\t'+data.text);
//		resultStr = resultStr + data.text;
		var token = data.text.split("\t");
		
		var trLine = "<tr><td>"+token[0]+"</td><td>"+token[1]+"</td><td>"+token[2]+"</td></tr>";
		
		resultStr = resultStr + trLine;
	});
	resultStr = resultStr + "</table></body></html>";
	
	fs.writeFile('/home/shengan/tmp_'+timestamp+'.tmp',resultStr+'\n',function(error){ 
		if(error){
			console.log ('write error');
		}
		
	});		
	return ('tmp_'+timestamp+'.tmp');
}

var server = http.createServer(function(request, response) {

//  console.log('Connection:\t'+count+'\t'+realCount);
  var path = url.parse(request.url).pathname;

  switch (path) {
    case '/':
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write('Hello, World.'+count);
	response.end();
	count++;
	break;

    case '/mrl':
	request.params=params(request);

	response.writeHead(200, {'Content-Type': 'application/json'});

	var queryItem = request.params["last+user+freeform+input"];
	var queryInput = decodeURIComponent(queryItem).replaceAll('+',' ').replaceAll('\n',' ');
	var msgRep= "你輸入的是:"+queryInput;
	

	var dburl = "mongodb://localhost:27017/test";
	var resultEle=[];
	MongoClient.connect(dburl, function(err, db) {

	  if (err) throw err;
	  
	  var collection = "mrlmerge";
	  var projection = "";
	  var sort = {"taiwan":-1, "thailand":-1,"japan":-1,"korea":-1};
	  
	  var query = { "crop": queryInput};
	  if (queryInput=="Mango") {
	  	collection = "mango";
		projection = { "drug":1, "taiwan":1, "thailand":1, "korea":1, "japan":1, "count":1 };
		sort = {"count":1};
	  	  	
	  } else {
		projection = { "drug":1, "taiwan":1, "thailand":1, "korea":1, "japan":1 };
		sort = {"taiwan":-1, "thailand":-1,"japan":-1,"korea":-1};
	  }
	  
	  console.log ("query:"+JSON.stringify(query));
	  
	  var cx =0;
	  
	  db.collection(collection).find(query, projection).sort(sort).toArray(function(err, result) {
	    if (err) throw err;
		result.forEach(function(data,index) {
			if (cx<10 && queryInput == "Mango") {
				resultEle.push ({text: data.drug+"\t"+data.taiwan+"\t"+data.thailand+"\t"+data.korea+"\t"+data.japan+"\t"+data.count});
			}
			if (cx<10 && queryInput != "Mango") {
				resultEle.push ({text: data.drug+"\t"+data.taiwan+"\t"+data.thailand+"\t"+data.korea+"\t"+data.japan});
			}
			cx++;
		});
		
		var msg = { messages: resultEle };
				
		response.write(JSON.stringify(msg));
		response.end();
	  });
	  
   	  count++;
	});
    	
        break;

    case '/mrlimage':
	request.params=params(request);

	response.writeHead(200, {'Content-Type': 'application/json'});

	var queryItem = request.params["last+user+freeform+input"];
	var queryInput = decodeURIComponent(queryItem).replaceAll('+',' ').replaceAll('\n',' ');
	var msgRep= "你輸入的是:"+queryInput;
	
	console.log ("mrlimage:"+msgRep);
	
	var dburl = "mongodb://localhost:27017/test";
	var resultEle=[];
	MongoClient.connect(dburl, function(err, db) {

	  if (err) throw err;
	  
	  var cx =1;
	  queryInput = ".*"+queryInput;
	  
	  var itemInput = { 品名 : {$regex: queryInput }};
	  
	  console.log ("itemInput:"+JSON.stringify(itemInput));
	  
	  db.collection("plantdisease").find(itemInput).toArray(function(err, result) {
	     console.log ("plantdisease:"+JSON.stringify(result));
	     if (err) throw err;

   	        result.forEach(function(data,index) {
		        console.log (cx);
		        var question = "==>問題"+cx+": "+data.問題.replaceAll('\n',' ');
		        var answer   = "<==解答"+cx+": "+data.解答.replaceAll('\n',' ');
		        if (cx<10) {
				resultEle.push ({text: question+"\n"+answer});
			}
			cx++;
		});
		

		var msg = { messages: resultEle };
		
		response.write(JSON.stringify(msg));
		response.end();
	  });
	  
   	  count++;
		
	});
    	
        break;
        
    case '/drugbook':
	request.params=params(request);

	console.log (request.params);
	console.log (request.params["last+user+freeform+input"]);
//	console.log (JSON.parse(request.params["last+user+freeform+input"]));
	
	response.writeHead(200, {'Content-Type': 'application/json'});

	var queryItem = request.params["last+user+freeform+input"];
	var queryInput = decodeURIComponent(queryItem).replaceAll('+',' ').replaceAll('\n',' ');
	var msgRep= "你輸入的是:"+queryInput.split(" ")[0];
	
	console.log ("drugbook:"+msgRep);
	
	var dburl = "mongodb://localhost:27017/test";
	var resultEle=[];
	
	MongoClient.connect(dburl, function(err, db) {
	  if (err) throw err;
	  
//	  var query = { "crop": queryInput, "taiwan":{$gt: 0.1} };

	  var cx =1;
	  queryInput = ".*"+queryInput.trim().toLowerCase().split("\t")[0];
	  
	  var itemInput = { EnName: {$regex:queryInput }};
	  
	  console.log ("itemInput:"+JSON.stringify(itemInput));
	  
	  db.collection("drugbook").find(itemInput).toArray(function(err, result) {
	  
	     console.log ("drugbook:"+JSON.stringify(result));
	     if (err) throw err;

	     	var name = "";
	     	var productName = "";
	     	var resultStr = "";
	     	
   	        result.forEach(function(data,index) {
			console.log (data.Name+"\t"+data.ProductName);
		        console.log (cx);

					        
		        name = data.Name.replaceAll('\n',' ');
		        productName = data.ProductName.replaceAll('\n',' ').trim();
		        
		        if (cx<10) {
				if (!isEmpty(productName) && !isBlank(productName)) {
			        	resultStr = resultStr + "==產品 "+cx+" > "+name+"\t"+productName+"\n";	
					cx++;
				}
			}
//			console.log ("resultEle:"+resultEle);
		});
		resultEle.push ({text: resultStr});
		

		var msg = { messages: resultEle };
		
		console.log (msg);

		response.write(JSON.stringify(msg));
		response.end();
	  });
	  
   	  count++;
		
	  console.log ('drugbook call me');       
	});
    	
        break;
        
    case '/badfood':
	request.params=params(request);

	console.log (request.params);
	console.log (request.params["last+user+freeform+input"]);
//	console.log (JSON.parse(request.params["last+user+freeform+input"]));
	
	response.writeHead(200, {'Content-Type': 'application/json'});

	var queryItem = request.params["last+user+freeform+input"];
	var queryInput = decodeURIComponent(queryItem).replaceAll('+',' ').replaceAll('\n',' ');
	var msgRep= "你輸入的是:"+queryInput.split(" ")[0];
	
	console.log ("badfood:"+msgRep);
	
	var dburl = "mongodb://localhost:27017/test";
	var resultEle=[];
	
	MongoClient.connect(dburl, function(err, db) {
	  if (err) throw err;
	  
//	  var query = { "crop": queryInput, "taiwan":{$gt: 0.1} };

	  var cx =1;
	  queryInput = ".*"+queryInput.trim().toLowerCase().split("\t")[0];
//	  {$and[{"原因":{$regex:".*殘留"}},{"主旨":{$regex:".*芒果"}}]
	  var itemInput = {$and: [ {原因:{$regex: ".*殘留農藥"}}, {主旨: {$regex: queryInput }}] };
	  
	  console.log ("badfood itemInput:"+JSON.stringify(itemInput));
	  
	  db.collection("badfood").find(itemInput).toArray(function(err, result) {
	  
	     console.log ("badfood:"+JSON.stringify(result));
	     if (err) throw err;

	     	var name = "";
	     	var productName = "";
	     	var resultStr = "";
	     	
   	        result.forEach(function(data,index) {
   	        	console.log (data);
//			console.log (data.Name+"\t"+data.ProductName);
		        console.log (cx);


			var place = "==> 產地 : "+data.產地;
			var title = "==> 主旨 : "+data.主旨;
			var reason= "==> 原因 : "+data.不合格原因暨檢出量詳細說明;
			var law   = "==> 法規 : "+data.法規限量標準;					        
			
		        if (cx<10) {
		        	resultStr = '農藥殘留過量食品 '+cx+ ' ------------>\n'+place+"\n"+title+"\n"+reason+"\n"+law+'\n\n';

				resultEle.push ({text: resultStr});
				cx++;
				/*
				if (!isEmpty(productName) && !isBlank(productName)) {
			        	resultStr = resultStr + "==產品 "+cx+" > "+name+"\t"+productName+"\n";	
					cx++;
				}
				*/
			}
//			console.log ("resultEle:"+resultEle);
		});
		

		var msg = { messages: resultEle };
		
		console.log (msg);

		response.write(JSON.stringify(msg));
		response.end();
	  });
	  
   	  count++;
		
	  console.log ('drugbook call me');       
	});
    	
        break;
        
  }
});

server.listen(888);

