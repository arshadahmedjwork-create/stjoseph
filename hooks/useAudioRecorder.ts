
import { useState, useRef, useCallback, useEffect } from 'react';

type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'error';

export const useAudioRecorder = () => {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<number | null>(null);

  // Cleanup audio URL when it changes or component unmounts
  useEffect(() => {
    return () => {
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
    };
  }, [audioURL]);

  // Cleanup stream and timer when it changes or component unmounts
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }
    };
  }, [stream]);

  const getMicrophonePermission = useCallback(async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
        return true;
      } catch (err: any) {
        setError(err.message);
        setRecordingStatus('error');
        return false;
      }
    } else {
      setError("The MediaRecorder API is not supported in your browser.");
      setRecordingStatus('error');
      return false;
    }
  }, []);

  const startRecording = async () => {
    if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
    }

    let currentStream = stream;
    
    // If we don't have a stream or it's inactive, try to get a new one
    if (!currentStream || !currentStream.active) {
         try {
             currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
             setStream(currentStream);
             setPermission(true);
         } catch (err: any) {
             setError(err.message);
             setRecordingStatus('error');
             return;
         }
    }

    if (currentStream) {
      setRecordingStatus("recording");
      setRecordingTime(0);
      audioChunks.current = [];
      
      // Start Timer
      if (timerInterval.current) clearInterval(timerInterval.current);
      timerInterval.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
      }, 1000);

      const media = new MediaRecorder(currentStream, { mimeType: "audio/webm" });
      mediaRecorder.current = media;
      mediaRecorder.current.start();

      mediaRecorder.current.ondataavailable = (event) => {
        if (typeof event.data === "undefined") return;
        if (event.data.size === 0) return;
        audioChunks.current.push(event.data);
      };
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recordingStatus === 'recording') {
      setRecordingStatus("stopped");
      
      // Stop Timer
      if (timerInterval.current) {
          clearInterval(timerInterval.current);
          timerInterval.current = null;
      }

      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        audioChunks.current = [];
        
        // Stop the stream tracks to release the microphone immediately
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setPermission(false);
      };
    }
  };
  
  const resetRecording = () => {
    if (audioURL) {
        URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingStatus('idle');
    setRecordingTime(0);
    if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
    }
  }

  return { recordingStatus, audioURL, error, stream, recordingTime, startRecording, stopRecording, getMicrophonePermission, resetRecording };
};
