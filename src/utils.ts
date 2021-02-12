
function getType(obj) {
	return Object.prototype.toString.call(obj);
}
export function buildParams(args) {
	let dict = {};

	function dfs(obj, prefix) {
		switch (getType(obj)) {
			case '[object Array]':
				obj.map((item, index) => {
					switch (getType(item)) {
						case '[object Array]':
						case '[object Object]':
							dfs(item, prefix + '[' + index + ']');
							break;
						default:
							dict[prefix + '[' + index + ']'] = item;
					}
				})
				break;
			case '[object Object]':
				Object.keys(obj).map(key => {
					let keyname = prefix ? '[' + key + ']' : key
					switch (getType(obj[key])) {
						case '[object Array]':
						case '[object Object]':
							dfs(obj[key], prefix + keyname);
							break;
						default:
							dict[prefix + keyname] = obj[key];
					}
				});
				break;
		}
	}

	dfs(args, '');
	return Object.keys(dict).map(key => {
		return key + '=' + dict[key];
	}).join('&');
}