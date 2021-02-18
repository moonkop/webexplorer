import {buildParams} from "./utils";

interface MyResponse {
	code: number,
	payload: any,
	msg: string;
}

export function request(options: {
	action: string,
	body?: Record<string, any>;
}): Promise<{ res?: MyResponse['payload'], err?: Pick<MyResponse, 'code' | 'msg'>; }> {
	return new Promise((resolve, reject) => {
		$.ajax({
			type    : 'POST',
			url     : `http://tools.moonkop.com/uploadHandler.php?action=${options.action}`,
			dataType: 'json',
			data    : buildParams(options.body),
			success : (e: MyResponse) => {
				if (e.code < 300) {
					resolve({res: e.payload});
				} else {
					resolve({err: e})
				}
			},
			error   : (e) => {
				resolve({err: {code: 500, msg: JSON.stringify(e)}})
			}
		})
	});
}

export interface MyFile {
	name: string,
	is_dir: 0 | 1;
}

export class Actions {
	static async checkFileExist(filenames: string[]): Promise<string[]> {
		let {res, err} = await request({action: 'checkExist', body: {filenames}});
		panic(err);
		return res;
	}

	static async getFileList(dir: string): Promise<MyFile[]> {
		let {res, err} = await request({action: 'fileList', body: {dir}});
		panic(err);
		let res1: MyFile[] = res;
		res1 = [...res1.filter(item => item.is_dir), ...res1.filter(item => !item.is_dir)];
		res1 = res1.filter(item => item.name.charAt(0) != '.');
		return res1;

	}

	static async mkdir(path: string): Promise<string[]> {
		let {res, err} = await request({action: 'mkdir', body: {path}});
		panic(err);
		return res;
	}

	static async deleteFile(path: string) {
		let {res, err} = await request({action: 'deleteFile', body: {path}});
		panic(err);
		return res;
	}
}


export function panic(err) {
	if (err) {
		debugger;
		throw err;
	}
}