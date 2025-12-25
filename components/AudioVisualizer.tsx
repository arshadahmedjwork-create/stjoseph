
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  height?: number;
  barColor?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  stream, 
  height = 60,
  barColor = '#2563eb' // Tailwind blue-600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    try {
      // Initialize Audio Context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create Analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // Controls the number of bars (frequency bins)
      analyserRef.current = analyser;

      // Create Source
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Draw function
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      
      if (!canvasCtx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvas || !canvasCtx || !analyserRef.current) return;

        animationFrameRef.current = requestAnimationFrame(draw);

        analyserRef.current.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Visualizer Styling
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 255 * canvas.height; // Normalize height

          // Create gradient
          const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, barColor);
          gradient.addColorStop(1, '#93c5fd'); // Light blue

          canvasCtx.fillStyle = gradient;
          
          // Rounded bars
          canvasCtx.beginPath();
          // Centered vertical drawing
          const y = (canvas.height - barHeight) / 2;
          
          // Draw bar
          canvasCtx.roundRect 
            ? canvasCtx.roundRect(x, y, barWidth, barHeight, 2) 
            : canvasCtx.fillRect(x, y, barWidth, barHeight);
            
          canvasCtx.fill();

          x += barWidth + 2; // Gap between bars
        }
      };

      draw();

    } catch (err) {
      console.error("Error initializing audio visualizer:", err);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, barColor]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={height} 
      className="w-full h-full rounded-lg"
    />
  );
};

export default AudioVisualizer;
