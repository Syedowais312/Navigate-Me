let video = document.getElementById("videoInput");
let canvas = document.getElementById("canvasOutput");
let ctx = canvas.getContext("2d");
let streaming = true;

async function onOpenCvReady() {
    document.getElementById("status").textContent = "OpenCV Loaded! Starting video...";

    // Set up video capture
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                processVideo();
            };
        })
        .catch(err => {
            console.error("Error accessing webcam: " + err);
        });
}

function processVideo() {
    if (!streaming) return;

    const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let cap = new cv.VideoCapture(video);

    function detectFrame() {
        if (!streaming) {
            src.delete();
            gray.delete();
            edges.delete();
            contours.delete();
            hierarchy.delete();
            return;
        }

        cap.read(src);
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.Canny(gray, edges, 50, 150);
        cv.findContours(edges, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

        // Draw rectangles around large contours
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            if (area > 1000) {
                const rect = cv.boundingRect(contour);
                ctx.strokeStyle = "green";
                ctx.lineWidth = 2;
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }
        }

        // Show edges on the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        requestAnimationFrame(detectFrame);
    }

    detectFrame();
}

function stopVideo() {
    streaming = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    document.getElementById("status").textContent = "Video stopped.";
}