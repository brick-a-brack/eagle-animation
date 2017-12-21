class Player {

	constructor() {

        this.video = false;  // Dom element to video player
        this.canvas = false; // Dom element to viewer
        this.grid = false; // Dom element to grid

        this.project = false; // Project

        this.videoWidth = false; // Video Player Width
        this.videoHeight = false; // Video Player Height

        this.canvasWidth = false; // Viewer Width
        this.canvasHeight = false; // Viewer Height

        
        this.diffMode = false; // Diff mode between camera and latest frame 
        this.onion = 1; // Onion skin value

        this.loop = false; // Play infinite loop
        this.shortPlay = false; // Only play the X latest pictures
        this.shortPlaySize = 10; // Number of pictures to play in the short play mode

        this.selectedFrame = false; // Frame show

        // BEURK
        this.playing = false;
        
    }

    init(video, canvas, grid) {
        this.video = video;
        this.canvas = canvas;
        this.grid = grid;
        console.log('INIT PLAYER', video, canvas, grid);
    }

    setCameraResolution (width, height) {
        this.videoWidth = width;
        this.videoHeight = height;
        this.video.width = width;
        this.video.height = height;
    }

    setViewerResolution (width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    setProject(project) {
        this.project = project;
    }

    isInitialized() {
        return (!(this.video === false || this.canvas === false || this.grid === false));
    }

    getLoop() {
        return (this.loop);
    }

    setLoop(value) {
        this.loop = !!value;
    }

    getDiff() {
        return (this.diff);
    }

    setDiff(value) {
        this.diff = !!value;
    }

    getShortPlay() {
        if (this.shortPlay) {
            return (this.shortPlaySize);
        }
        return (false);
    }

    setShortPlay(value) {
        this.shortPlay = !!value;
    }

    getOnion() {
        return (this.onion);
    }

    setOnion(value) {
        this.onion = value;
    }

    getCanvasBlendMode() {
        if (this.diff) {
            return ('difference');
        }
        return ('');
    }

    getVideoOpacity() {
        return (1);
    }

    getCanvasOpacity() {
        if (!this.diff && this.selectedFrame === false) {
            return (1 - this.onion);
        }
        return (1);
    }

    showFrame(id) {
        console.log(this.project)
        let pictures = this.project.getCurrentScene().pictures;

        let drawFrame = (id) => {
            let ctx = this.canvas.getContext('2d');
            if (id < pictures.length && id >= 0)
            {
                var img = new Image();
                img.addEventListener('load', () => {
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

                    let ratioX = this.canvasWidth / img.width;
                    let ratioY = this.canvasHeight / img.height;

                    let minRatio = Math.min(ratioX, ratioY);
                    let width = Math.round(img.width * minRatio);
                    let height = Math.round(img.height * minRatio);
                    ctx.drawImage(img, 0, 0, img.width, img.height, Math.round((this.canvasWidth - width) / 2), Math.round((this.canvasHeight - height) / 2), width, height);

                    window.refresh();
                }, false);
                img.src = this.project.getDirectory() + '/' + this.project.getSceneId() + '/' + pictures[id].filename;
            }
        };

        if (id === false) {
            this.selectedFrame = false;
            drawFrame(pictures.length - 1);
        } else {
            this.selectedFrame = id;
            drawFrame(id);
        }
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
            this.playing = false;
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
                } else {
                    this.playing = false;
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
}

export default Player;