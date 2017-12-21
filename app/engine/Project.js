var fs = require('fs');
const {dialog} = require('electron').remote

class Project {

	constructor() {
		this.config = {
			title: "",
			creation: (new Date().getTime()),
			updated: (new Date().getTime()),
			scenes: [
				{
					title: "",
					framerate: 12,
					pictures: []
				}
			],
		};
		this.selectedScene = 0;
		this.directory = false;
	}

	getConfig() {
		return (this.config);
	}

	getCurrentScene() {
		return (this.config.scenes[this.selectedScene]);
	}

	getSceneId() {
		return (this.selectedScene);
	}

	getDirectory() {
		return (this.directory);
	}
	
	create(directory, title) {
		this.config.title = title;
		this.save(directory);
	}

	getMaxHeight() {
		return new Promise((resolve, reject) => {
			let size = 0;
			let nbElements = this.config.scenes[this.selectedScene].pictures.length;
			let nbElementsDone = 0;
			if (nbElements === nbElementsDone) {
				resolve(size);
				return;
			}
			for (let i = 0; i < nbElements; i++) {
				var img = new Image();
				img.addEventListener('load', () => {
					if (img.height > size) {
						size = img.height;
					}
					nbElementsDone++;
					if (nbElements === nbElementsDone) {
						resolve(size);
						return;
					}
				}, false);
				img.addEventListener('error', () => {
					reject(false);
					return;
				}, false);
				img.src = this.getDirectory() + '/' + this.getSceneId() + '/' + this.config.scenes[this.selectedScene].pictures[i].filename;
			}
		});
	}

	getMaxWidth() {
		return new Promise((resolve, reject) => {
			let size = 0;
			let nbElements = this.config.scenes[this.selectedScene].pictures.length;
			let nbElementsDone = 0;
			if (nbElements === nbElementsDone) {
				resolve(size);
				return;
			}
			for (let i = 0; i < nbElements; i++) {
				var img = new Image();
				img.addEventListener('load', () => {
					if (img.width > size) {
						size = img.width;
					}
					nbElementsDone++;
					if (nbElements === nbElementsDone) {
						resolve(size);
						return;
					}
				}, false);
				img.addEventListener('error', () => {
					reject(false);
					return;
				}, false);
				img.src = this.getDirectory() + '/' + this.getSceneId() + '/' + this.config.scenes[this.selectedScene].pictures[i].filename;
			}
		});
	}
	
	load(directory) {
		return new Promise((resolve, reject) => {
			let data = fs.readFile(directory + '/project.json', (err, data) => {
				if (err) {
					reject(err);
					return;
				}
				this.config = JSON.parse(data.toString('utf8'));
				resolve();
				return;
			});
		});
	}
	
	save() {
		return new Promise((resolve, reject) => {
			fs.writeFile(this.directory + '/project.json', JSON.stringify(this.config), (err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
				return;
			});
		});
	}
	
	addPicture(blob, position) {

		if (!fs.existsSync(this.directory + '/' + this.selectedScene)){
			fs.mkdirSync(this.directory + '/' + this.selectedScene);
		}
		var newId = 0;
		for (let i = 0; i < this.config.scenes[this.selectedScene].pictures.length; i++) {
			if (this.config.scenes[this.selectedScene].pictures[i].id > newId)
				newId = this.config.scenes[this.selectedScene].pictures[i].id;
		}

		fs.writeFile(this.directory + '/' + this.selectedScene +'/'+ (newId + 1) + '.jpg', blob, (err) => {
			if (err) {
				//reject(err);
				return;
			}
			//resolve();
			this.config.scenes[this.selectedScene].pictures.push({
				"id": (newId + 1),
				"filename": (newId + 1) + ".jpg",
				"deleted": false,
				"length": 1
			});
			this.save();
			window.refresh();
			return;
		});

		
	}

	setFramerate(fps)
	{
		this.config.scenes[this.selectedScene].framerate = (parseInt(fps) > 0) ? parseInt(fps) : this.config.scenes[this.selectedScene].framerate;
		this.save();
	}
	
	removePicture() {
		
	}

	loadPrompt() {
		return new Promise((resolve, reject) => {
			let tmp = dialog.showOpenDialog({properties: ['openDirectory']});
			if (tmp.length > 0) {
				this.directory = tmp[0];
				this.load(this.directory).then((data) => {
					resolve();
					return;
				}).catch((err) => {
					reject(err);
					return;
				});
			} else {
				reject(false);
				return;
			}
		});
	}

	createPrompt() {
		return new Promise((resolve, reject) => {
			let tmp = dialog.showOpenDialog({properties: ['openDirectory']});
			if (tmp.length > 0) {
				this.directory = tmp[0];
				this.save(this.directory).then((data) => {
					resolve();
					return;
				}).catch((err) => {
					reject(err);
					return;
				});
			} else {
				reject(false);
				return;
			}
		});
	}
}

module.exports = Project;