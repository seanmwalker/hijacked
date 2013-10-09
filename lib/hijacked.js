var Hijacked = function(moduleName, replacement) {
	if (!moduleName) {
		throw new Error('Module name is required.');
	}
	if (!replacement) {
		throw new Error('The replacement function is required.');
	}
	if (typeof replacement !== 'function') {
		throw new Error('The replacement parameter must be a function.');
	}

	require(moduleName);
	var oldModuleExport = require.cache[require.resolve(moduleName)].exports;
	require.cache[require.resolve(moduleName)].exports = replacement;

	var hijacked = {
		name: moduleName,
		originalModule: oldModuleExport,
		newModule: replacement,
		isHijacked: true,
		restore: function() {
			if (this.isHijacked) {
				require.cache[require.resolve(this.name)].exports = this.originalModule;
				this.isHijacked = false;
			}
		}
	};

	return hijacked;
};


module.exports = Hijacked;