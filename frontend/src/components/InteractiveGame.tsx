"use client";

import React, { useEffect, useRef, useState } from 'react';

interface InteractiveGameProps {
  emoji: string;
}

interface GameObject {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  popped: boolean;
  scale: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function InteractiveGame({ emoji }: InteractiveGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [motivationMessage, setMotivationMessage] = useState("");
  const [showBanner, setShowBanner] = useState(false);

  // Custom child-friendly cursor (a magic wand)
  const cursorSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" style="font-size:30px"><text y="30">✨</text></svg>`;

  // Motivation logic
  useEffect(() => {
    if (score > 0 && score % 50 === 0) {
      const messages = ["Great job! 🌟", "You are amazing! 🎈", "Wow! Keep going! 🎉", "Fantastic! ✨"];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setTimeout(() => {
        setMotivationMessage(randomMsg);
        setShowBanner(true);
      }, 0);
    }
  }, [score]);

  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 1500); // Start fade out after 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  // Music Toggle logic
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        // Set low volume for sensitive ears
        audioRef.current.volume = 0.2;
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const objects: GameObject[] = [];
    const particles: Particle[] = [];
    const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];

    const spawnObject = () => {
      objects.push({
        id: Math.random(),
        x: Math.random() * width,
        y: height + 50,
        radius: 40 + Math.random() * 20, // slightly larger
        // SLOWER SPEEDS
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        popped: false,
        scale: 0
      });
    };

    const createParticles = (x: number, y: number) => {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5, // slower explosion
          vy: (Math.random() - 0.5) * 5,
          life: 1,
          maxLife: 30 + Math.random() * 30, // longer life
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 6 // bigger particles
        });
      }
    };

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleInteraction = (clientX: number, clientY: number) => {
      if (!isPlaying) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (!obj.popped) {
          const dist = Math.hypot(obj.x - x, obj.y - y);
          if (dist < obj.radius * 1.5) {
            obj.popped = true;
            createParticles(obj.x, obj.y);
            setScore(prev => prev + 10); // Reward points!

            // Play a soft pop sound if possible
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(400, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
              gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); // Lower volume for sensitivity
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.1);
            } catch (e) {
              // Ignore audio errors
            }
            break;
          }
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      handleInteraction(e.clientX, e.clientY);
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    // Initial spawn
    if (isPlaying) {
      for (let i = 0; i < 3; i++) {
        setTimeout(spawnObject, i * 800);
      }
    }

    const spawnTimer = setInterval(() => {
      if (isPlaying) spawnObject();
    }, 1500); // Spawning slightly less frequently

    let lastTime = 0;
    const render = (time: number) => {
      if (time - lastTime > 16) { // Limit framerate roughly
        ctx.clearRect(0, 0, width, height);

        if (isPlaying) {
          // Render objects
          for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (obj.popped) {
              objects.splice(i, 1);
              continue;
            }

            obj.x += obj.vx;
            obj.y += obj.vy;
            obj.rotation += obj.rotationSpeed;
            if (obj.scale < 1) obj.scale += 0.03;

            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.rotation);
            ctx.scale(obj.scale, obj.scale);

            ctx.font = `${obj.radius * 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji || '✨', 0, 0);

            ctx.restore();

            // Remove if off screen
            if (obj.y < -100) {
              objects.splice(i, 1);
            }
          }
        }

        // Render particles (particles continue to animate even if paused briefly)
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          p.vy += 0.1; // slower gravity

          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
          }

          const alpha = 1 - (p.life / p.maxLife);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        lastTime = time;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      clearInterval(spawnTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [emoji, isPlaying]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Background Music (Requires a file at /soothing-instrumental.mp3) */}
      <audio ref={audioRef} loop src="/soothing-instrumental.mp3" preload="auto" />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: isPlaying ? 'auto' : 'none',
          touchAction: 'none',
          cursor: `url('${cursorSvg}') 16 16, pointer`
        }}
      />

      {/* Motivation Banner overlay */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        backgroundColor: '#34d399',
        color: 'white',
        padding: '1.5rem 3rem',
        borderRadius: '2rem',
        fontSize: '3rem',
        fontWeight: 'bold',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        zIndex: 60,
        textAlign: 'center',
        width: '80%',
        pointerEvents: 'none',
        opacity: showBanner ? 1 : 0,
        transform: showBanner ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
        transition: 'opacity 1s ease-in-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        {motivationMessage}
      </div>

      {/* UI Controls Overlay */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '2rem',
              backgroundColor: isPlaying ? '#ef4444' : '#22c55e',
              color: 'white',
              fontWeight: 'bold',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            {isPlaying ? '⏸ Stop Game' : '▶️ Start Game'}
          </button>

          <button
            onClick={toggleMusic}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '2rem',
              backgroundColor: isMusicPlaying ? '#8b5cf6' : '#d8b4fe',
              color: 'white',
              fontWeight: 'bold',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            title="Toggle soothing background music"
          >
            {isMusicPlaying ? '🎵 Stop Music' : '🔇 Play Music'}
          </button>
        </div>

        <div style={{
          backgroundColor: '#fbbf24',
          color: '#78350f',
          padding: '0.5rem 1.5rem',
          borderRadius: '2rem',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          Score: {score} 🌟
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: ``
      }} />
    </div>
  );
}
