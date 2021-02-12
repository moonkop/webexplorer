import {buildParams} from "./utils";

export function checkFileExist(filenames: string[]) :Promise<string[]>{
	return  new Promise((resolve, reject) => {
		$.ajax({
			type    : 'POST',
			url     : "http://tools.moonkop.com/uploadHandler.php?action=checkExist",
			dataType: 'json',
			data    : buildParams({
				names:filenames
			}),
			success : (e) => {
				resolve(e.payload.exists);
			}
		})
	});

}