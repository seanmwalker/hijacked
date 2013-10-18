#Hijacked
Have you ever wanted to override a dependency that is used by an NPM module that you are trying to test? Did you try <a href='https://github.com/arunoda/horaa'>Horaa</a>, and think 'This thing is great. Now if only I could handle the constructor based function as well.'.

Well, here you go. This is a very small library that enables you to override any npm required module that your target module is depending on. All you need to do is to hijack the intended module before your target module requires in the module you want to hijack. This is for entire NPM modules only. If you only want to hijack a child function on a module, look at  <a href='https://github.com/arunoda/horaa'>Horaa</a>, as it seems to do that very well.

##Note
Please ensure that you have mocha installed globally if you plan to run the unit tests for this project. 

##Usage

```
it('should execute the real module, then the hijacked one, then the real one again.', function(done) {
	var request = require('request');

	// Test the real module
	request('http://www.google.com', function(err, res, data) {
		res.statusCode.should.equal(200);

		// Hijack it
		var hijackedRequest = new Hijacked('request', function(url, options, callback) {
			callback.call(this, null, { statusCode: 200 }, 'Responded with success.');
		});

		request = require('request');
		request('url', {"options": "options go here"}, function(err, res, data) {
			data.should.equal('Responded with success.');
			res.statusCode.should.equal(200);

			hijackedRequest.restore();
			hijackedRequest.isHijacked.should.be.false;

			// Now check the original function to ensure it still works in the 'undone' state.
			request = require('request');
			request('http://www.google.com', function(err, res, data) {
				res.statusCode.should.equal(200);
				done();
			});

		});

	});
});
```