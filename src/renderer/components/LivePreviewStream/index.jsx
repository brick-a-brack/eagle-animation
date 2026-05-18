import React, { Component } from 'react';

import * as style from './style.module.css';

class LivePreviewStream extends Component {
    constructor(props) {
        super(props);

        this.dom = {
            container: React.createRef(),
            videoStream: React.createRef(),
            imageStream: React.createRef(),
            canvasStream: React.createRef(),
        };

        //this.streamRatio = null;

        this.streamSize = {
            width: 0,
            height: 0,
        };

        this.currentStreamType = null;

        this.rafId = null;

        this.resize = () => {


            /* const parentSize = this?.dom?.container?.current?.parentNode?.getBoundingClientRect();
             if (!parentSize) {
                 return;
             }
             const parentRatio = parentSize.width / parentSize.height;
 
             let widthElem = 0;
             let heightElem = 0;
 
             if (this.getRatio() >= parentRatio) {
                 widthElem = parentSize.width;
                 heightElem = (1 / this.getRatio()) * parentSize.width;
             } else {
                 heightElem = parentSize.height - 6;
                 widthElem = this.getRatio() * (parentSize.height - 6); // Border should be added here
             }
             this.setState({ width: widthElem, height: heightElem, ready: true });*/
        };

        /* this.initCanvas = () => {
             if (this.dom.picture.current) {
                 if (this.dom.picture.current.width !== this.getSize().width) {
                     this.dom.picture.current.width = this.getSize().width;
                 }
                 if (this.dom.picture.current.height !== this.getSize().height) {
                     this.dom.picture.current.height = this.getSize().height;
                 }
                 if (this.dom.picture.current.style.width !== this.getSize().width) {
                     this.dom.picture.current.style.width = this.getSize().width;
                 }
                 if (this.dom.picture.current.style.height != this.getSize().height) {
                     this.dom.picture.current.style.height = this.getSize().height;
                 }
             }
             if (this.dom.grid.current) {
                 let shouldRedraw = false;
                 if (this.dom.grid.current.width !== this.getSize().width) {
                     this.dom.grid.current.width = this.getSize().width;
                     shouldRedraw = true;
                 }
                 if (this.dom.grid.current.height !== this.getSize().height) {
                     this.dom.grid.current.height = this.getSize().height;
                     shouldRedraw = true;
                 }
                 if (this.dom.grid.current.style.width !== this.getSize().width) {
                     this.dom.grid.current.style.width = this.getSize().width;
                     shouldRedraw = true;
                 }
                 if (this.dom.grid.current.style.height !== this.getSize().height) {
                     this.dom.grid.current.style.height = this.getSize().height;
                     shouldRedraw = true;
                 }
                 if (shouldRedraw) {
                     this.drawGrid();
                 }
             }*/
    };


    setStream(type, data) {
        // Flush if needed
        if (this.currentStreamType !== type) {
            this.disconnectStream();
            this.currentStreamType = type;
        }

        // Video case
        if (type === 'video') {
            // Bind stream
            if (typeof data === 'string') {
                this.dom.videoFrame.current.src = data;
            } else if (typeof data === 'object') {
                this.dom.videoFrame.current.srcObject = data;
            } else {
                console.warn('Unsupported content type for video stream');
            }
        }

        // Image case (MJPEG case)
        if (type === 'image') {
            // Bind stream
            if (typeof data === 'string') {
                this.dom.imageStream.current.src = data;
            } else {
                console.warn('Unsupported content type for image stream');
            }
        }

        // Canvas case (Draw frame)
        if (type === 'canvas') {
            // TODO
        }
    }

    disconnectStream() {
        // Flush image stream
        this.dom.imageStream.current.src = '';

        // Flush video stream
        this.dom.videoFrame.current.src = '';
        this.dom.videoFrame.current.srcObject = null;

        // Flush canvas stream
        // TODO
    }

    get streamRatio() {
        return this.streamSize.width > 0 && this.streamSize.height > 0 ? this.streamSize.width / this.streamSize.height : null;
    }

    componentDidMount() {
        const handleStreamLoaded = (domElement) => {
            domElement.width = domElement.naturalWidth || 0;
            domElement.height = domElement.naturalHeight || 0;
            domElement.style.display = 'block';
            //console.log('READY', domElement);
        };

        const handleStreamError = (domElement) => {
            domElement.width = 0;
            domElement.height = 0;
            domElement.style.display = 'none';
            //console.log('ERROR', domElement);
        };

        // By default video and image element are in error mode
        handleStreamError(this.dom.videoStream.current);
        handleStreamError(this.dom.imageStream.current);
        handleStreamError(this.dom.canvasStream.current);

        // Video stream events
        this.dom.videoStream.current.oncanplay = () => {
            handleStreamLoaded(this.dom.videoStream.current);
            this.resize();
        };
        this.dom.videoStream.current.onresize = () => {
            this.resize();
        };
        this.dom.videoStream.current.onerror = () => {
            handleStreamError(this.dom.videoStream.current);
            this.resize();
        };

        // Image stream events
        this.dom.imageStream.current.onload = () => {
            handleStreamLoaded(this.dom.imageStream.current);
            this.resize();
        };
        this.dom.imageStream.current.onresize = () => {
            this.resize();
        };
        this.dom.imageStream.current.onerror = () => {
            handleStreamError(this.dom.imageStream.current);
            this.resize();
        };

        // Canvas stream events
        // TODO

        const refreshFrameSize = () => {
            // Video stream
            if (
                (this.dom.videoStream.current && this.dom.videoStream.current.naturalWidth !== this.streamSize.width) ||
                (this.dom.videoStream.current && this.dom.videoStream.current.naturalHeight !== this.streamSize.height)
            ) {
                this.streamSize = { width: this.dom.videoStream.current.naturalWidth, height: this.dom.videoStream.current.naturalHeight };
            }

            // Image stream
            if (
                (this.dom.imageStream.current && this.dom.imageStream.current.naturalWidth !== this.streamSize.width) ||
                (this.dom.imageStream.current && this.dom.imageStream.current.naturalHeight !== this.streamSize.height)
            ) {
                this.streamSize = { width: this.dom.imageStream.current.naturalWidth, height: this.dom.imageStream.current.naturalHeight };
            }

            // Store next RaF Id
            this.rafId = requestAnimationFrame(refreshFrameSize);
        };

        // Start watching stream size changes
        this.rafId = requestAnimationFrame(refreshFrameSize);
    }

    componentDidUpdate(prevProps) {

    }

    componentWillUnmount() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }

    render() {
        const style = this.props.style ? {
            ...this.props.style,
            width: `${width}px`,
            height: `${height}px`,
            opacity: width && height ? 1 : 0,
        } : {};
        const className = this.props.className ? `${style.container} ${this.props.className}` : style.container;
        
        const width = 0;
        const height = 0;

        return (
            <div className={className} ref={this.dom.container} style={style}>
                <video ref={this.dom.videoStream} className={style.stream} />
                <img ref={this.dom.imageStream} className={style.stream} />
                <canvas ref={this.dom.canvasStream} className={style.stream} />
            </div>
        );
    }
}

LivePreviewStream.propTypes = {

};

export default LivePreviewStream;
