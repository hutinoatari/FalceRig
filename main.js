"use strict";

const virtualCanvas = document.getElementById("screen");
const fullscreenButton = document.getElementById("fullscreenButton");

const config = {
    width: 320,
    height: 240,
    fps: 30,
    backgroundColors: new Array(10).fill("white"),
}
const avater = {
    face: "",
    sentence: "",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
}
const faceImg = new Image();
faceImg.src = "./face.png";
avater.face = faceImg;

const video = document.createElement("video");
video.autoplay = true;
const constraints = {
    video: {
        width: config.width,
        height: config.height,
        aspectRatio: config.width / config.height,
        facingMode: "user",
    },
    audio: false,
}

const media = navigator.mediaDevices.getUserMedia(constraints);
media.then((stream) => video.srcObject = stream);

const realCanvas = document.createElement("canvas");
realCanvas.width = config.width;
realCanvas.height = config.height;
const realContext = realCanvas.getContext("2d");
const faceDetector = new window.FaceDetector({
    fastMode: true,
    maxDetectedFaces: 1,
});
const realCanvasUpdate = () => {
    realContext.drawImage(video, 0, 0);
    faceDetector.detect(realCanvas).then((faces) => {
        for(const face of faces){
            const boundingBox = face.boundingBox;
            const x = boundingBox.x;
            const y = boundingBox.y;
            const width = boundingBox.width;
            const height = boundingBox.height;
            avater.x = x - width / 2;
            avater.y = y - height / 2;
            avater.width = width * 2;
            avater.height = height *2;
        }
    })
}

virtualCanvas.width = config.width;
virtualCanvas.height = config.height;
const virtualContext = virtualCanvas.getContext("2d");
const virtualCanvasUpdate = () => {
    virtualContext.beginPath();
    const gradient = virtualContext.createRadialGradient(config.width/2, config.height/2, 0, config.width/2, config.height/2, (config.width**2 + config.height**2)**0.5/2);
    for(let i=0; i<10; i++) gradient.addColorStop(0.1*i, config.backgroundColors[i]);
    virtualContext.fillStyle = gradient;
    virtualContext.arc(config.width/2, config.height/2, (config.width**2 + config.height**2)**0.5/2, 0, Math.PI*2);
    virtualContext.fill();
    config.backgroundColors.pop();
    config.backgroundColors.unshift(`rgb(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`);
    
    virtualContext.drawImage(avater.face, avater.x, avater.y, avater.width, avater.height);
    const fontSize = 24;
    const metrics = virtualContext.measureText(avater.sentence);
    virtualContext.fillStyle = "rgba(0, 0, 0, 0.5)";
    virtualContext.fillRect((config.width-metrics.width)/2, config.height-fontSize*1.5, metrics.width, fontSize);
    virtualContext.fillStyle = "white";
    virtualContext.textAlign = "center";
    virtualContext.textBaseline = "bottom";
    virtualContext.font = `normal ${fontSize}px monospace`;
    virtualContext.fillText(avater.sentence, config.width/2, config.height-fontSize*0.5, config.width-fontSize);
}

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.continuous = true;
recognition.onresult = (e) => {
    const results = e.results;
    avater.sentence = results[results.length-1][0].transcript;
    if(results[results.length-1].isFinal) avater.sentence = "";
}
recognition.onend = () => recognition.start();
recognition.start();

setInterval(() => {
    realCanvasUpdate();
    virtualCanvasUpdate();
}, 1000 / config.fps);

fullscreenButton.onclick = () => virtualCanvas.requestFullscreen();
