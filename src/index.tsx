import {Component, h, render} from 'preact'
import {Actions, MyFiles} from "./api";
import * as path from "path";
import './index.scss';

interface AppState {
	dropBoxText: string;
	urls: string[];
	uploadPercent: number;
	currentPath: string;
	currentFiles: MyFiles[];
}

class App extends Component<{}, AppState> {
	fileInput: HTMLInputElement;
	resetTimer: NodeJS.Timeout
	dropBoxEnabled: Boolean;

	constructor(props) {
		super(props);
		this.state = {
			dropBoxText  : '拖进来吧',
			urls         : [],
			uploadPercent: 100,
			currentPath  : '',
			currentFiles : []
		}
		this.dropBoxEnabled = true;
	}

	async componentDidMount() {
		console.log('componentDidMount')
		window.addEventListener('hashchange', this.onHashChange);
		this.setCurrentPathFromUrl(location.href);

	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this.onHashChange);
	}

	componentDidUpdate(previousProps: Readonly<{}>, previousState: Readonly<AppState>, snapshot: any) {
		if (this.state.currentPath != previousState.currentPath) {
			this.getCurrentFileList();
		}
	}

	setCurrentPathFromUrl(str) {
		let url = new URL(str);
		let path = url.hash.substr(1);
		if (!path) {
			location.hash = '/';
			return;
		}
		this.setState({currentPath: path});
	}

	onHashChange = (e) => {
		console.log('onHashChange')
		this.setCurrentPathFromUrl(e.newURL);
	};

	async getCurrentFileList() {
		this.setState({currentFiles: []})
		let files = await Actions.getFileList(this.state.currentPath);
		this.setState({currentFiles: files})
	}

	upLoadFile = async (files: FileList) => {
		this.dropBoxEnabled = false;
		let checkResult: string[] = await Actions.checkFileExist(Array.from(files).map(item => item.name));
		if (checkResult.length) {
			if (!confirm(checkResult.join(',') + ' 这些文件已经在里面啦 要覆盖吗 ？')) {
				return;
			}
		}

		let formData = new FormData();
		for (let i = 0; i < files.length; i++) {
			formData.append("fileToUpload[" + i + ']', files[i]);
		}
		await new Promise(resolve => {
			let request = $.ajax({
				type       : "POST",
				url        : "http://tools.moonkop.com/uploadHandler.php?action=upload",
				data       : formData,			//这里上传的数据使用了formData 对象
				processData: false, 	//必须false才会自动加上正确的Content-Type
				contentType: false,
				dataType   : 'json',
				xhr        : () => {
					let xhr = $.ajaxSettings.xhr();
					if (xhr.upload) {
						xhr.upload.addEventListener("progress", (progressEvent) => {
							let percent = (progressEvent.loaded / progressEvent.total) * 100;
							this.setState({
								uploadPercent: percent
							})
						}, false);
						return xhr;
					}
				},
				success    : (e) => {
					if (e.code == 100) {
						this.setDropBoxText('上传成功辣！')
						this.setState({
							urls: e.payload.urls
						})
						if (e.payload.overwrites.length) {
							alert(e.payload.overwrites.join(',') + '已经被成功覆盖掉啦');
						}
					} else {
						alert(e.msg);
					}
					resolve();

				},
				error      : function (e: any) {
					alert('奇怪了 怎么就失败了呢？' + e.msg as string);
					resolve();
				}
			})
		})
		this.dropBoxEnabled = true;
		this.getCurrentFileList();
	}

	setDropBoxText = (str: string) => {
		this.setState({
			dropBoxText: str
		})

	};
	onUploadClick=() => {
		if (!this.dropBoxEnabled) {
			return
		}
		this.fileInput.click();
	}

	render() {
		return (
			<div className='app'>
				<div className="dropBox"
				     style={{
					     background: this.state.uploadPercent == 100 ? null : `linear-gradient(to top,#FFd1d9 ${this.state.uploadPercent}%,#FFF ${this.state.uploadPercent}%)`
				     }}
				     onClick={this.onUploadClick}
				     onDragEnter={e => {
					     console.log('onDragEnter', e)
					     if (!this.dropBoxEnabled) {
						     return
					     }
					     clearTimeout(this.resetTimer);
					     this.setDropBoxText('啊~疼~😭');
				     }}
				     onDragLeave={e => {
					     console.log('onDragLeave', e)
					     if (!this.dropBoxEnabled) {
						     return
					     }
					     this.setDropBoxText('吓死宝宝了~😣');
					     clearTimeout(this.resetTimer);
					     this.resetTimer = setTimeout(() => {
						     this.setDropBoxText('拖进来吧');
					     }, 1500)
				     }}
				     onDrop={(e) => {
					     console.log('onDrop', e)
					     if (!this.dropBoxEnabled) {
						     return
					     }
					     clearTimeout(this.resetTimer);
					     let files = e.dataTransfer.files;
					     this.upLoadFile(files);
					     return false;
				     }}
				>
					<div class="dropBox-text">
						{this.state.dropBoxText}
					</div>
				</div>

				<div class="urls">
					{this.state.urls.map(item => {
						return <div>
							{item}
						</div>;
					})}
				</div>
				<div class="progress"></div>
				<input id='fileInput' ref={(ref) => {
					this.fileInput = ref;
				}} type="file" name="fileToUpload" onChange={(e) => {
					this.upLoadFile(e.currentTarget.files);
				}}/>
				<div className="currentPath">
					{(() => {
						let lastPath = '/';
						let paths = (this.state.currentPath).split('/').filter(Boolean);
						paths.unshift('');
						let jsx = paths.map(item => {
							console.log(item);
							lastPath = path.resolve(lastPath + '/' + item);
							let full = lastPath;
							return <span className='pathItem' onClick={() => {
								console.log(full);
								location.hash = full;
							}}>{item ? item : 'root'}</span>
						})
						let jsxJoined = [];
						jsx.map(item => {
							jsxJoined.push(item);
							jsxJoined.push(<span className="iconfont iconpage-next"/>)
						})
						jsxJoined.pop();
						return jsxJoined;
					})()}
				</div>

				<div className="actions">
					<div className='mkdir' onClick={() => {
						let name = prompt('input dir name:');
						if (!name) {
							return;
						}
						Actions.mkdir(this.state.currentPath + '/' + name);
						setTimeout(() => {
							this.getCurrentFileList();
						}, 100)

					}}>
						<span className="iconfont iconxinjianwenjianjia1"/>
					</div>
					<div className="upload" onClick={this.onUploadClick}>
						<span className="iconfont iconshangchuan1"/>
					</div>
					<div className="download">
						<span className="iconfont iconxiazai"/>
					</div>
					<div className="delete">
						<span className="iconfont iconshanchu"/>
					</div>
				</div>

				<div className="filesContainer">
					{this.state.currentFiles.map(item => {
						return <div className='file' onClick={() => {
							let path1 = path.resolve(this.state.currentPath, item.name);
							if (item.is_dir) {
								location.hash = path1;
							} else {
								window.open('http://tools.moonkop.com/upload/' + path1);
							}
						}}>

							{item.is_dir ? <span className="iconfont iconputongwenjianjia"/> :
								<span className="iconfont iconwenjian_"/>}{item.name}
						</div>;
					})}
				</div>

			</div>
		);
	}
}

render(
	<App/>,
	document.getElementById('root')
)


$(document).on({
	drop     : function (e) {
		return false;
	},
	dragleave: function (e) {
		e.preventDefault();
	},
	dragenter: function (e) {
		e.preventDefault();
	},
	dragover : function (e) {
		e.preventDefault();
	},
})
