define(function (require,exports,module) {
	require(['a.css']);
	require(['b.js'],function (b) {
		b.say();
	});
	//alert(module.uri);
	exports.say=function(){
		alert('a');
	};
});