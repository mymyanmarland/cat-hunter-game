import React, { useEffect, useRef, useState } from 'react';
import { MousePointer2, Trophy, RefreshCcw, Github, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const CAT_SIZE = 40;
const MOUSE_SIZE = 30;

interface Point {
  x: number;
  y: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(Number(localStorage.getItem('cat-hunter-highscore')) || 0);
  const [time, setTime] = useState(30);
  
  const mousePos = useRef<Point>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const catPos = useRef<Point>({ x: 100, y: 100 });
  const catVel = useRef<Point>({ x: 2, y: 2 });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          setGameState('gameover');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cat-hunter-highscore', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameState !== 'playing') return;

      // Cat AI: Move away from mouse
      const dx = catPos.current.x - mousePos.current.x;
      const dy = catPos.current.y - mousePos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200) {
        // Run away!
        const angle = Math.atan2(dy, dx);
        catVel.current.x = Math.cos(angle) * 5;
        catVel.current.y = Math.sin(angle) * 5;
      } else {
        // Random wander
        catVel.current.x += (Math.random() - 0.5) * 0.5;
        catVel.current.y += (Math.random() - 0.5) * 0.5;
        
        // Speed limit
        const speed = Math.sqrt(catVel.current.x**2 + catVel.current.y**2);
        if (speed > 3) {
          catVel.current.x = (catVel.current.x / speed) * 3;
          catVel.current.y = (catVel.current.y / speed) * 3;
        }
      }

      catPos.current.x += catVel.current.x;
      catPos.current.y += catVel.current.y;

      // Bounce off walls
      if (catPos.current.x < 0 || catPos.current.x > GAME_WIDTH - CAT_SIZE) catVel.current.x *= -1;
      if (catPos.current.y < 0 || catPos.current.y > GAME_HEIGHT - CAT_SIZE) catVel.current.y *= -1;

      // Catch detection
      if (dist < (CAT_SIZE + MOUSE_SIZE) / 2) {
        setScore((s) => s + 10);
        // Respawn cat far away
        catPos.current = {
          x: Math.random() * (GAME_WIDTH - CAT_SIZE),
          y: Math.random() * (GAME_HEIGHT - CAT_SIZE)
        };
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Grid (Background)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GAME_HEIGHT); ctx.stroke();
      }
      for (let i = 0; i < GAME_HEIGHT; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(GAME_WIDTH, i); ctx.stroke();
      }

      // Draw Cat
      ctx.font = '40px serif';
      ctx.fillText('🐱', catPos.current.x, catPos.current.y + 35);

      // Draw Mouse (Player)
      ctx.font = '30px serif';
      ctx.fillText('🐭', mousePos.current.x - 15, mousePos.current.y + 10);

      animationFrameId = requestAnimationFrame(() => {
        update();
        draw();
      });
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    mousePos.current = {
      x: x - rect.left,
      y: y - rect.top
    };
  };

  const startGame = () => {
    setScore(0);
    setTime(30);
    setGameState('playing');
    catPos.current = { x: 100, y: 100 };
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* HUD */}
      <div className="w-full max-w-[800px] flex justify-between items-center mb-6 px-4">
        <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3">
          <Trophy className="text-yellow-400 w-5 h-5" />
          <span className="text-white font-bold text-xl">{score}</span>
        </div>
        
        <div className="glass-card px-8 py-3 rounded-2xl">
          <span className={`font-mono text-2xl font-black ${time < 10 ? 'text-red-500 animate-pulse' : 'text-purple-400'}`}>
            00:{time < 10 ? `0${time}` : time}
          </span>
        </div>

        <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3 opacity-70">
          <Trophy className="text-slate-400 w-4 h-4" />
          <span className="text-slate-200 font-medium">HI: {highScore}</span>
        </div>
      </div>

      {/* Arena */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          className="relative bg-slate-900 rounded-3xl cursor-none border border-white/10 shadow-2xl"
        />

        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-3xl backdrop-blur-sm"
            >
              <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">
                Cat <span className="text-purple-500">Hunter</span>
              </h1>
              <p className="text-slate-400 mb-8 font-medium">The Reverse Chase: Catch the Cat!</p>
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-purple-600 text-white rounded-full font-bold text-xl hover:bg-purple-500 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                <Play className="fill-current" />
                START HUNT
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 rounded-3xl backdrop-blur-md"
            >
              <h2 className="text-4xl font-black text-red-500 mb-2 tracking-tight">TIME'S UP!</h2>
              <div className="text-center mb-8">
                <p className="text-slate-400 text-lg uppercase tracking-widest font-bold">Your Score</p>
                <p className="text-7xl font-black text-white">{score}</p>
              </div>
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-white text-slate-950 rounded-full font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
              >
                <RefreshCcw className="w-5 h-5" />
                PLAY AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <footer className="mt-8 text-slate-500 flex flex-col items-center gap-4">
        <p className="flex items-center gap-2">
          <MousePointer2 className="w-4 h-4" />
          Move your mouse to control the 🐭
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" />
            Source Code
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
