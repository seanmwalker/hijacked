function request (uri, options, callback) {
	// Placeholder for tests.
	var err, res = { statusCode: 200}, data = {};
	if (callback) {
		callback(err, res, data);
	}
	else if (typeof options==='function') {
		options(err, res, data);
	}
}

module.exports = request;