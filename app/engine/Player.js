class Player {

	constructor() {

        this.video = false;
        this.canvas = false;
        this.grid = false;

        this.width = false;
        this.height = false;

        this.playing = false;
        this.loop = false;
        this.onion = 1;
        this.shortPlay = false;
        this.shortPlaySize = 10;
        this.project = {};

        this.selectedFrame = false;
    }

    init(video, canvas, grid) {
        this.video = video;
        this.canvas = canvas;
        this.grid = grid;
    }

    setResolution (width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.video.width = width;
        this.video.height = height;
    }

    isInitialized() {
        return (!(this.video === false || this.canvas === false));
    }

    isPlaying() {
        return (this.playing);
    }

    stop() {
        this.playing = false;
        this.showFrame(false);
    }

    play()
    {
        this.playing = true;
        if (this.project.getCurrentScene().pictures.length === 0) {
            this.showFrame(false);
            return;
        }

        var frame = (!this.shortPlay || this.project.getCurrentScene().pictures.length <= this.shortPlaySize) ? 0 : (this.project.getCurrentScene().pictures.length - this.shortPlaySize);

        var showNextFrame = () => {
            if (!this.playing)
                return;
            if (frame == this.project.getCurrentScene().pictures.length)
            {
                this.showFrame(false);
                if (this.loop === true)
                {
                    frame = (!this.shortPlay || this.project.getCurrentScene().pictures.length <= this.shortPlaySize) ? 0 : (this.project.getCurrentScene().pictures.length - this.shortPlaySize - 1);
                    window.setTimeout(() => {
                        showNextFrame();
                    }, (1000 / this.project.getCurrentScene().framerate));
                }
            }
            else
            {
                this.showFrame(frame);
                frame++;
                window.setTimeout(() => {
                    showNextFrame();
                }, (1000 / this.project.getCurrentScene().framerate));
            }
        }

        showNextFrame();
    }

    setLoop(value) {
        this.loop = value;
    }

    setShortPlay(value) {
        this.shortPlay = value;
    }

    setOnion(value) {
        this.onion = value;
        this.video.style.opacity = 1 - this.onion;
        this.canvas.style.opacity = this.onion;

        this.stop();
        this.showFrame(false);
    }

    getOnion() {
        return (this.onion);
    }

    setFrame(id) {
        this.selectedFrame = id;
    }

    showFrame(id) {
        
        let pictures = this.project.getCurrentScene().pictures;

        if (id === false) {
            this.showFrame(pictures.length - 1);
            this.video.style.opacity = 1;
            this.canvas.style.opacity = 1 - this.onion;
        } else {
            this.video.style.opacity = '0';
            this.canvas.style.opacity = '1';

            // Display frame player
            let ctx = this.canvas.getContext('2d');
            if (id < pictures.length)
            {
                var img = new Image();
                img.addEventListener('load', () => {
                    ctx.drawImage(img, 0, 0, pictures[id].width, pictures[id].height, 0, 0, this.width, this.height);
                    console.log(img, 0, 0, pictures[id].width, pictures[id].height, 0, 0, this.width, this.height);
                }, false);
                img.src = this.project.getDirectory() + '/' + this.project.getSceneId() + '/' + pictures[id].filename;

            }

        }
    }

    setProject(project) {
        this.project = project;
    }
}

export default Player;