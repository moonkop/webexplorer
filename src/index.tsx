import {Component, h, render} from 'preact'
import {checkFileExist} from "./api";

interface AppState {
	dropBoxText: string;
	urls: string[];
	uploadPercent: number;
}
class App extends Component<{}, AppState> {
	fileInput: HTMLInputElement;
	resetTimer: NodeJS.Timeout
	dropBoxEnabled: Boolean;

	constructor(props) {
		super(props);
		this.state = {
			dropBoxText: '拖进来吧',
			urls       : [],
			uploadPercent:100,
		}
		this.dropBoxEnabled = true;
	}

	upLoadFile = async (files: FileList) => {
		this.dropBoxEnabled = false;

		let checkResult: string[] = await checkFileExist(Array.from(files).map(item => item.name));

		if (checkResult.length) {
			if (!confirm(checkResult.join(',') + ' 这些文件已经在里面啦 要覆盖吗 ？')) {
				return;
			}
		}

		let formData = new FormData();
		for (let i = 0; i < files.length; i++) {
			formData.append("fileToUpload[" + i + ']', files[i]);
		}
		let request = $.ajax({
			type       : "POST",
			url        : "http://tools.moonkop.com/uploadHandler.php?action=upload",
			data       : formData,			//这里上传的数据使用了formData 对象
			processData: false, 	//必须false才会自动加上正确的Content-Type
			contentType: false,
			dataType   : 'json',
			xhr        :  () =>{
				let xhr = $.ajaxSettings.xhr();
				if (xhr.upload) {
					xhr.upload.addEventListener("progress",  (progressEvent) =>{
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
					// $('.dropBox-text').html("<div>上传成功辣</div><div>点我复制鸭</div>");
					// $('.dropBox').addClass("copible");
					// new ClipboardJS('.copible',{
					//     text: function(){
					//         return $('.urls').text();
					//     }
					// });

					this.setState({
						urls: e.payload.urls
					})
					if (e.payload.overwrites.length) {
						alert(e.payload.overwrites.join(',') + '已经被成功覆盖掉啦');
					}
				} else {
					alert(e.msg);
				}
				this.dropBoxEnabled = true;

			},
			error      : function (e: any) {
				alert('奇怪了 怎么就失败了呢？' + e.msg as string);
				this.dropBoxEnabled = true;


			}
		})
	}

	setDropBoxText = (str: string) => {
		this.setState({
			dropBoxText: str
		})

	};

	render() {
		return (
			<div className='content'>
				<div className="dropBox"
				     style={{
				     	background:this.state.uploadPercent==100?null:`linear-gradient(to top,#FFd1d9 ${this.state.uploadPercent}%,#FFF ${this.state.uploadPercent}%)`
				     }}
				     onClick={() => {
					     if (!this.dropBoxEnabled) {
						     return
					     }
					     this.fileInput.click();
				     }}
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
					{this.state.urls.map(item=>{
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
