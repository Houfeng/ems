/**
 * ems合并工具 
 */
(function(owner) {
	owner.build = function() {
		var buffer = [];
		for (var i in owner.moduleTable) {
			var module = owner.moduleTable[i];
			if (module && module.declare) {
				buffer.push(module.declare.toString()+"\r\n");
			}
		}
		return buffer.join('\r\n');
	};
})(window.ems);