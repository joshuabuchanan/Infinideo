"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Circle, Download, Images, Square, X } from "lucide-react";

interface ClipCameraProps {
  onClose: () => void;
}

interface LocalMedia {
  url: string;
  type: string;
  name: string;
}

const ClipCamera = ({ onClose }: ClipCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [cameraError, setCameraError] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [localMedia, setLocalMedia] = useState<LocalMedia | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access requires HTTPS or localhost. Choose a file from your gallery instead.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: { ideal: "environment" } },
        });
        if (!isCurrent) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraReady(true);
      } catch {
        if (isCurrent) setCameraError("Camera access was blocked or is unavailable. Check browser permissions or choose a gallery file.");
      }
    };

    void openCamera();
    return () => {
      isCurrent = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => () => {
    if (localMedia) URL.revokeObjectURL(localMedia.url);
  }, [localMedia]);

  const setMediaFromBlob = (blob: Blob, name: string) => {
    setLocalMedia({ url: URL.createObjectURL(blob), type: blob.type, name });
  };

  const takePicture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setMediaFromBlob(blob, `infinideo-photo-${Date.now()}.jpg`);
    }, "image/jpeg", 0.92);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      setCameraError("Video recording is not supported by this browser.");
      return;
    }

    try {
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        if (blob.size > 0) setMediaFromBlob(blob, `infinideo-clip-${Date.now()}.webm`);
        setIsRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setCameraError("");
      setIsRecording(true);
    } catch {
      setCameraError("The camera could not start recording. Try again or choose a gallery file.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const selectGalleryMedia = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      setCameraError("Choose an image or video file.");
      return;
    }
    setCameraError("");
    setLocalMedia({ url: URL.createObjectURL(file), type: file.type, name: file.name });
  };

  return (
    <div className="feed-clip-camera-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="feed-clip-camera" role="dialog" aria-modal="true" aria-labelledby="feed-clip-camera-title">
        <header className="feed-clip-camera-header">
          <div>
            <p className="feed-clip-camera-kicker">INFINIDEO CLIPS</p>
            <h2 id="feed-clip-camera-title">Capture</h2>
          </div>
          <button className="feed-clip-camera-icon-button" type="button" onClick={onClose} aria-label="Close camera">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="feed-clip-camera-stage">
          <video ref={videoRef} autoPlay muted playsInline aria-label="Camera preview" />
          {!isCameraReady && !cameraError && <span className="feed-clip-camera-status">Connecting to camera...</span>}
          {!isCameraReady && cameraError && <span className="feed-clip-camera-status">Camera unavailable</span>}
          {isRecording && <span className="feed-clip-recording-indicator">Recording</span>}
        </div>

        <div className="feed-clip-camera-controls">
          <button className="feed-clip-camera-control" type="button" onClick={takePicture} disabled={!isCameraReady || isRecording}>
            <Camera aria-hidden="true" />
            <span>Take photo</span>
          </button>
          <button
            className={`feed-clip-camera-control${isRecording ? " is-recording" : ""}`}
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isCameraReady}
          >
            {isRecording ? <Square aria-hidden="true" /> : <Circle aria-hidden="true" />}
            <span>{isRecording ? "Stop recording" : "Record video"}</span>
          </button>
          <button className="feed-clip-camera-control" type="button" onClick={() => galleryInputRef.current?.click()}>
            <Images aria-hidden="true" />
            <span>Choose from gallery</span>
          </button>
          <input
            ref={galleryInputRef}
            className="feed-clip-gallery-input"
            id="feed-clip-gallery-file"
            type="file"
            accept="image/*,video/*"
            onChange={selectGalleryMedia}
          />
        </div>

        {cameraError && <p className="feed-clip-camera-error" role="alert">{cameraError}</p>}
        {localMedia && (
          <div className="feed-clip-camera-result">
            {localMedia.type.startsWith("image/") ? (
              <img src={localMedia.url} alt="Selected or captured media" />
            ) : (
              <video src={localMedia.url} controls playsInline />
            )}
            <a className="feed-clip-camera-save" href={localMedia.url} download={localMedia.name}>
              <Download aria-hidden="true" />
              <span>Save to device</span>
            </a>
          </div>
        )}
        <p className="feed-clip-camera-note">Camera captures stay on this device until you save them.</p>
      </section>
    </div>
  );
};

export default ClipCamera;