"use client";

import { useState, useEffect } from "react";
import { Timer, Play, Pause, RotateCcw, Bell } from "lucide-react";

export default function RestTimerWidget() {
  const [targetSeconds, setTargetSeconds] = useState(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play subtle browser beep alert if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (err) {}
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const handleSelectTime = (sec: number) => {
    setTargetSeconds(sec);
    setSecondsLeft(sec);
    setIsRunning(true);
  };

  const toggleRun = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(targetSeconds);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(targetSeconds);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-card p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
          <Timer className="h-4 w-4" />
          <span>Rest Timer</span>
        </div>

        <div className="flex items-center space-x-1 bg-secondary/80 p-0.5 rounded-lg text-[10px] font-bold">
          {[60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => handleSelectTime(sec)}
              className={`px-2 py-0.5 rounded transition-all ${
                targetSeconds === sec
                  ? "bg-emerald-500 text-black font-extrabold shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
            {formatTime(secondsLeft)}
          </span>
          {secondsLeft === 0 && (
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 animate-bounce">
              Rest Done!
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={toggleRun}
            className="p-2 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors shadow-md"
            title={isRunning ? "Pause Rest Timer" : "Start Rest Timer"}
          >
            {isRunning ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title="Reset Rest Timer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
