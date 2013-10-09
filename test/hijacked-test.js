chai = require('chai');
sinon = require('sinon');
sinonChai = require("sinon-chai");
should = chai.should();
expect = chai.expect;
chai.use(sinonChai);

var Hijacked = require('../lib/hijacked');

// Start tests
describe('stash-api', function() {
	beforeEach(function () {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe('constructor', function() {
		it('should throw an excpetion when no module is specified', function() {
			expect(function() {
				new Hijacked();
			}).to.throw('Module name is required.');
		});

		it('should throw an excpetion when no replacement function is specified', function() {
			expect(function() {
				new Hijacked('foobarbazShouldNotExist');
			}).to.throw('The replacement function is required.');
		});

		it('should throw an excpetion when replacement is not a function', function() {
			expect(function() {
				new Hijacked('foobarbazShouldNotExist', 'I am not a function, I am a free string!');
			}).to.throw('The replacement parameter must be a function.');
		});

		it('should throw an excpetion when the specified module is not found', function() {
			expect(function() {
				new Hijacked('foobarbazShouldNotExist', function() {});
			}).to.throw('Cannot find module \'foobarbazShouldNotExist\'');
		});

		function functionName(fun) {
			var ret = fun.toString();
			ret = ret.substr('function '.length);
			ret = ret.substr(0, ret.indexOf('('));
			return ret;
		}

		it('should hijack the request module', function(done) {
			var hijackedRequest = new Hijacked('request', function(url, options, callback) {
				callback.call(this, null, { statusCode: 200 }, 'Responded with success.');
			});

			hijackedRequest.should.not.be.null;
			hijackedRequest.name.should.not.be.null;
			hijackedRequest.originalModule.should.not.be.null;
			expect(typeof hijackedRequest.originalModule === 'function').to.be.true;
			functionName(hijackedRequest.originalModule).should.equal('request');
			hijackedRequest.restore.should.not.be.null;
			hijackedRequest.isHijacked.should.be.true;
			var actual = null;

			var request = require('request');
			request('url', {"options": "options go here"}, function(err, res, data) {
				actual = 'Data: ' + data;
			});
			// We can get away with this sync nature of this test here, because we're handling the mocked module.
			actual.should.equal('Data: Responded with success.');

			// Restore and validate
			hijackedRequest.restore();
			hijackedRequest.isHijacked.should.be.false;

			// Ensure we don't 'toggle' after we unhijack it.
			hijackedRequest.restore();
			hijackedRequest.isHijacked.should.be.false;

			// Now check the original function to ensure it still works in the 'undone' state.
			request = require('request');
			request('http://www.google.com', function(err, res, data) {
				actual = 'Status Code: ' + res.statusCode;
				actual.should.equal('Status Code: 200');
				done();
			});
		});

		it('should execute the real module, then the hijacked one, then the real one again.', function(done) {
			var request = require('request');

			// Test the real module
			request('http://www.google.com', function(err, res, data) {
				res.statusCode.should.equal(200);

				// Hijack it
				var hijackedRequest = new Hijacked('request', function(url, options, callback) {
					callback.call(this, null, { statusCode: 200 }, 'Responded with success.');
				});

				var actual = null;
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
	});
});
