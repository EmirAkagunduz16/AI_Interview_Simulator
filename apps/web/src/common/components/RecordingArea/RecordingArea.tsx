"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./recording-area.styles.scss";

interface RecordingAreaProps {
  isRecording?: boolean;
  onClick?: () => void;
  onRecordingComplete?: (blob: Blob) => void;
}

const RecordingArea = ({
  isRecording: externalIsRecording,
  onClick,
  onRecordingComplete,
}: RecordingAreaProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const recording =
    externalIsRecording !== undefined ? externalIsRecording : isRecording;

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setHasRecorded(true);
        onRecordingComplete?.(blob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      setPermissionDenied(false);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setPermissionDenied(true);
      setIsRecording(false);
    }
  }, [onRecordingComplete]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }

    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`recording-area ${recording ? "recording-area--active" : ""} ${hasRecorded ? "recording-area--completed" : ""}`}
    >
      {permissionDenied && (
        <p className="recording-area__error">
          Mikrofon erisimi reddedildi. Lutfen tarayici ayarlarindan mikrofon
          iznini verin.
        </p>
      )}

      <button
        className="recording-area__btn"
        onClick={handleClick}
        type="button"
      >
        {recording ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="19"
              x2="12"
              y2="23"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="8"
              y1="23"
              x2="16"
              y2="23"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        )}
      </button>

      <div className="recording-area__info">
        {recording ? (
          <>
            <div className="recording-area__pulse" />
            <span className="recording-area__status">Kayit yapiliyor...</span>
            <span className="recording-area__duration">
              {formatDuration(recordingDuration)}
            </span>
          </>
        ) : hasRecorded ? (
          <span className="recording-area__status recording-area__status--done">
            Kayit tamamlandi. Tekrar kaydetmek icin tiklayin.
          </span>
        ) : (
          <span className="recording-area__status">
            Kayda başlamak için tıklayın
          </span>
        )}
      </div>
    </div>
  );
};

export default RecordingArea;
