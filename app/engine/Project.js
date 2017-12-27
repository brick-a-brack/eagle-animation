import fs from 'fs';
import { remote } from 'electron';
import winattr from 'winattr';

const {dialog} = remote;

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

			let count = 0;

			const status = (err) => {
				if (err) {
					reject(err);
					return;
				}
				count++;
				if (count === 3) {
					resolve();
					return;
				}
			}

			fs.writeFile(this.directory + '/project.json', JSON.stringify(this.config), (err) => {	
				status(err);
			});

			if (!fs.existsSync(this.directory + '/SceneFolder.ico')) {
				const dataIcon = fs.readFileSync('./assets/project/_SceneFolder.ico');
				fs.writeFile(this.directory + '/SceneFolder.ico', dataIcon, (err) => {
					if (process.platform === 'win32') {
						winattr.setSync(this.directory + '/SceneFolder.ico', {hidden: true});
					}
					status(err);
				});
			} else {
				status(false);
			}

			if (!fs.existsSync(this.directory + '/Desktop.ini')) {
				const dataDesktop = fs.readFileSync('./assets/project/_Desktop.ini');
				fs.writeFile(this.directory + '/Desktop.ini', dataDesktop, (err) => {
					if (process.platform === 'win32') {
						winattr.setSync(this.directory + '/', {system: true});
						winattr.setSync(this.directory + '/Desktop.ini', {system: true, hidden: true});
					}
					status(err);
				});
			} else {
				status(false);
			}
		});
	}
	
	addPicture(blob, position) {
		return new Promise((resolve, reject) => {
			if (!fs.existsSync(this.directory + '/' + this.selectedScene)){
				fs.mkdirSync(this.directory + '/' + this.selectedScene);
			}
			var newId = 0;
			for (let i = 0; i < this.config.scenes[this.selectedScene].pictures.length; i++) {
				if (this.config.scenes[this.selectedScene].pictures[i].id > newId)
					newId = this.config.scenes[this.selectedScene].pictures[i].id;
			}

			fs.writeFile(this.directory + '/' + this.selectedScene +'/'+ (newId + 1) + '.jpg', blob, async (err) => {
				if (err) {
					reject(err);
					return;
				}
				
				this.config.scenes[this.selectedScene].pictures.push({
					"id": (newId + 1),
					"filename": (newId + 1) + ".jpg",
					"deleted": false,
					"length": 1
				});
				await this.save();
				resolve();
				return;
			});
		});
	}

	setFramerate(fps)
	{
		this.config.scenes[this.selectedScene].framerate = (parseInt(fps) > 0) ? parseInt(fps) : this.config.scenes[this.selectedScene].framerate;
		this.save();
	}
	
	getFramerate()
	{
		return (this.config.scenes[this.selectedScene].framerate);
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