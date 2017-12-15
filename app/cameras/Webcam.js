class Webcam {

	constructor() {
		this.stream = false;
		this.video = false;
		this.canvas = false;
		this.width = false;
		this.height = false;
	}
	
	init() {
		return new Promise((resolve, reject) => {
			
			navigator.getMedia = (navigator.getUserMedia ||
								  navigator.webkitGetUserMedia ||
								  navigator.mozGetUserMedia ||
								  navigator.msGetUserMedia);

			navigator.getMedia({
				video:
				{
					optional: [
						{minWidth: 320},
						{minWidth: 640},
						{minWidth: 1024},
						{minWidth: 1280},
						{minWidth: 1920},
						{minWidth: 2560},
					]
				},
				audio: false
			}, (stream) => {
				this.stream = stream;
				this.video = document.createElement('video');
				this.canvas = document.createElement('canvas');
				this.video.src = this.getVideoLink();
				this.video.addEventListener('canplay', (ev) => {
					this.width = this.video.videoWidth;
					this.height = this.video.videoHeight;
					this.canvas.width = this.video.videoWidth;
					this.canvas.height = this.video.videoHeight;
					console.log('INIT CAM OK');
					resolve();
				});
			}, (err) => {
				console.log('err init webcam');
				reject(err);
			});
		});
	}

	isInitialized() {
		return (!(this.width === false));
	}
	
	getVideoStream() {
		return (this.stream);
	}
	
	getVideoLink() {
		if (this.stream === false)
			return (false);
		const vendorURL = window.URL || window.webkitURL;
        return (vendorURL.createObjectURL(this.stream));
	}
	
	getVideoWidth() {
		return (this.width);
	}
	
	getVideoHeight() {
		return (this.height);
	}
	
	getPictureWidth() {
		return (this.width);
	}
	
	getPictureHeight() {
		return (this.height);
	}
	
	getVideoResolution() {
		return (this.width + 'x' + this.height);
	}
	
	getPictureResolution() {
		return (this.width + 'x' + this.height);
	}
	
	getBufferPicture() {
		let ctx = this.canvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);
		ctx.drawImage(this.video, 0, 0, this.width, this.height);
		let data = this.canvas.toDataURL('image/jpeg');
		return (new Buffer(data.replace(/^data:image\/\w+;base64,/, ""), 'base64'));
	}
}

module.exports = Webcam;