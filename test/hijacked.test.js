var Hijacked = require('../lib/hijacked');

// Start tests
describe('stash-api', function() {
	describe('constructor', function() {
		it('should throw an excpetion when no module is specified', function() {
			expect(function() {
				new Hijacked();
			}).toThrow('Module name is required.');
		});

		it('should throw an excpetion when no replacement function is specified', function() {
			expect(function() {
				new Hijacked('foobarbazShouldNotExist');
			}).toThrow('The replacement function is required.');
		});

		it('should throw an excpetion when replacement is not a function', function() {
			expect(function() {
				new Hijacked('foobarbazShouldNotExist', 'I am not a function, I am a free string!');
			}).toThrow('The replacement parameter must be a function.');
		});

		it('should throw an excpetion when the specified module is not found', function() {
			expect(function() {
				new Hijacked('foobarbazShouldNotExist', function() {});
			}).toThrow('Cannot find module \'foobarbazShouldNotExist\'');
		});

		function functionName(fun) {
			var ret = fun.toString();
			ret = ret.substr('function '.length);
			ret = ret.substr(0, ret.indexOf('('));
			return ret;
		}

		it('should hijack the request module', function() {
			var hijackedRequest = new Hijacked('../test/request', function(url, options, callback) {
				callback.call(this, null, { statusCode: 200 }, 'Responded with success.');
			});

			expect(hijackedRequest).not.toBe.null;
			expect(hijackedRequest.name).not.toBe.null;
			expect(hijackedRequest.originalModule).not.toBe.null;
			expect(typeof hijackedRequest.originalModule === 'function').not.toBe.true;
			expect(functionName(hijackedRequest.originalModule)).toEqual('request');
			expect(hijackedRequest.restore).not.toBe.null;
			expect(hijackedRequest.isHijacked).toBe.true;

			var request = require('../test/request');
			return new Promise((resolve, reject) => {
				request('url', {"options": "options go here"}, function(err, res, data) {
					expect(data).toEqual('Responded with success.');

					// Restore and validate
					hijackedRequest.restore();
					expect(hijackedRequest.isHijacked).toBe(false);

					// Ensure we don't 'toggle' back to hijacked after we undo the hijacking.
					hijackedRequest.restore();
					expect(hijackedRequest.isHijacked).toBe(false);

					// Now check the original function to ensure it still works in the 'undone' state.
					request = require('../test/request');
					return request('http://www.google.com', function(err, res, data) {
						expect(res.statusCode).toEqual(200);
						resolve();
					});
				});
			});

		});

		it('should execute the real module, then the hijacked one, then the real one again.', function() {
			var request = require('../test/request');

			// Test the real module
			return request('http://www.google.com', function(err, res, data) {
				expect(res.statusCode).toEqual(200);

				// Hijack it
				var hijackedRequest = new Hijacked('../test/request', function(url, options, callback) {
					callback.call(this, null, { statusCode: 200 }, 'Responded with success.');
				});

				request = require('../test/request');
				return request('url', {"options": "options go here"}, function(err, res, data) {
					expect(data).toEqual('Responded with success.');
					expect(res.statusCode).toEqual(200);

					hijackedRequest.restore();
					expect(hijackedRequest.isHijacked).toEqual(false);

					// Now check the original function to ensure it still works in the 'undone' state.
					request = require('../test/request');
					return request('http://www.google.com', function(err, res, data) {
						expect(res.statusCode).toEqual(200);
					});

				});

			});
		});
	});
});
