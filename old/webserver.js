var webserver = require('webserver');
var webPage = require('webpage');
var server = webserver.create();
//var url = require('./url');
var page = webPage.create();
page.viewportSize = {
  width: 1920,
  height: 1080
};
var service = server.listen(8080, function(request, response) {
console.log(JSON.stringify(request));
console.log("POST params: ",JSON.stringify(request.post));
var urli = request.post.uri;	
	if (request.url == "/create"){
		console.log('http://'+urli);
		page.open('http://'+urli, 
			function (status) {
				if (status !== 'success') {
	    			console.log('Unable to access network');
				  } else {
				    /*var ua = page.evaluate(function() {
				      return document.title;
				    });*/
				    //console.log(ua);
				    response.statusCode = 200;
				    response.headers = {
					    'Cache': 'no-cache',
					    'Content-Type': 'image/png'
					};
					response.setEncoding('binary');
					response.write(atob(page.renderBase64('png')));
				    //response.write('<html><body>'+ua+'</body></html>');
				    //response.write(page.content);
  					response.close();
				  }
			});					
	}
	else {
		response.statusCode = 200;
		response.write('<html><body><form action="/create" method="POST">'+
			'<input type="text" name="uri">'+
			'<input type="submit">'+
			'</form></body></html>');
  		response.close();
	}
});