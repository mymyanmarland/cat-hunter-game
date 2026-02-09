import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment, ContactShadows, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, RefreshCcw, Github, Play, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const ARENA_SIZE = 10;

// --- 3D Components ---

const MousePlayer = ({ onMove }: { onMove: (pos: THREE.Vector3) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, mouse } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Follow mouse position on the plane
    const x = (mouse.x * viewport.width) / 2;
    const y = (mouse.y * viewport.height) / 2;
    
    meshRef.current.position.set(x, 0.5, y);
    onMove(meshRef.current.position);
  });

  return (
    <group ref={meshRef}>
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 32, 32]} />
          <MeshDistortMaterial color="#f0abfc" speed={5} distort={0.4} />
        </mesh>
        <Text position={[0, 0.7, 0]} fontSize={0.8}>🐭</Text>
      </Float>
    </group>
  );
};

const CatEnemy = ({ playerPos, onCatch }: { playerPos: THREE.Vector3; onCatch: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3(0.05, 0, 0.05));

  useFrame((_state, _delta) => {
    if (!meshRef.current) return;

    const currentPos = meshRef.current.position;
    const distToPlayer = currentPos.distanceTo(playerPos);

    if (distToPlayer < 4) {
      // Run away from player
      const dir = new THREE.Vector3().subVectors(currentPos, playerPos).normalize();
      velocity.current.lerp(dir.multiplyScalar(0.15), 0.1);
    } else {
      // Wander randomly
      if (Math.random() < 0.02) {
        velocity.current.x += (Math.random() - 0.5) * 0.05;
        velocity.current.z += (Math.random() - 0.5) * 0.05;
      }
      velocity.current.clampLength(0, 0.08);
    }

    currentPos.add(velocity.current);

    // Boundary check
    const halfSize = ARENA_SIZE / 2;
    if (Math.abs(currentPos.x) > halfSize) {
      currentPos.x = Math.sign(currentPos.x) * halfSize;
      velocity.current.x *= -1;
    }
    if (Math.abs(currentPos.z) > halfSize) {
      currentPos.z = Math.sign(currentPos.z) * halfSize;
      velocity.current.z *= -1;
    }

    // Catch detection
    if (distToPlayer < 1) {
      onCatch();
      // Respawn cat
      currentPos.set(
        (Math.random() - 0.5) * ARENA_SIZE,
        0.5,
        (Math.random() - 0.5) * ARENA_SIZE
      );
    }

    // Look at movement direction
    const lookTarget = new THREE.Vector3().addVectors(currentPos, velocity.current);
    meshRef.current.lookAt(lookTarget);
  });

  return (
    <group ref={meshRef} position={[2, 0.5, 2]}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#fb923c" roughness={0.1} metalness={0.5} />
      </mesh>
      <Text position={[0, 0.8, 0]} fontSize={1}>🐱</Text>
    </group>
  );
};

const Arena = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE + 2, ARENA_SIZE + 2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
      </mesh>
      
      {/* Grid Helper */}
      <gridHelper args={[ARENA_SIZE + 2, 20, "#4f46e5", "#1e1b4b"]} position={[0, 0.01, 0]} />
      
      {/* Walls */}
      <mesh position={[0, 0.5, (ARENA_SIZE / 2) + 1]}>
        <boxGeometry args={[ARENA_SIZE + 2, 1, 0.1]} />
        <meshStandardMaterial color="#312e81" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.5, -(ARENA_SIZE / 2) - 1]}>
        <boxGeometry args={[ARENA_SIZE + 2, 1, 0.1]} />
        <meshStandardMaterial color="#312e81" transparent opacity={0.3} />
      </mesh>
      <mesh position={[(ARENA_SIZE / 2) + 1, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ARENA_SIZE + 2, 1, 0.1]} />
        <meshStandardMaterial color="#312e81" transparent opacity={0.3} />
      </mesh>
      <mesh position={[-(ARENA_SIZE / 2) - 1, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ARENA_SIZE + 2, 1, 0.1]} />
        <meshStandardMaterial color="#312e81" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(Number(localStorage.getItem('cat-hunter-highscore-3d')) || 0);
  const [time, setTime] = useState(30);
  const playerPos = useRef(new THREE.Vector3(0, 0.5, 0));

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
      localStorage.setItem('cat-hunter-highscore-3d', score.toString());
    }
  }, [score, highScore]);

  const startGame = () => {
    setScore(0);
    setTime(30);
    setGameState('playing');
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden font-sans">
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.5} minPolarAngle={Math.PI / 4} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <Arena />
          {gameState === 'playing' && (
            <>
              <MousePlayer onMove={(pos) => playerPos.current.copy(pos)} />
              <CatEnemy playerPos={playerPos.current} onCatch={() => setScore(s => s + 10)} />
            </>
          )}
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
        {/* HUD */}
        <header className="w-full max-w-4xl flex justify-between items-center pointer-events-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
            <Trophy className="text-yellow-400 w-5 h-5" />
            <span className="text-white font-black text-2xl">{score}</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 px-10 py-3 rounded-2xl shadow-2xl">
            <span className={`font-mono text-3xl font-black tracking-tighter ${time < 10 ? 'text-red-500 animate-pulse' : 'text-purple-400'}`}>
              00:{time < 10 ? `0${time}` : time}
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 opacity-60 shadow-2xl">
            <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">High Score</span>
            <span className="text-white font-bold text-xl">{highScore}</span>
          </div>
        </header>

        {/* Start / Game Over Modals */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pointer-events-auto bg-slate-950/80 backdrop-blur-2xl border border-white/10 p-12 rounded-[3rem] text-center shadow-[0_0_100px_rgba(168,85,247,0.2)]"
            >
              <h1 className="text-7xl font-black text-white mb-2 tracking-tighter uppercase italic bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                Cat <span className="text-purple-500">Hunter</span> 3D
              </h1>
              <p className="text-slate-400 mb-10 font-medium tracking-widest uppercase text-sm">The Master Edition • Reverse Chase</p>
              <button 
                onClick={startGame}
                className="group relative px-12 py-5 bg-purple-600 text-white rounded-full font-black text-2xl hover:bg-purple-500 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-95"
              >
                <Play className="fill-current w-6 h-6" />
                START THE HUNT
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto bg-slate-950/90 backdrop-blur-2xl border border-white/20 p-12 rounded-[3rem] text-center shadow-2xl"
            >
              <h2 className="text-5xl font-black text-red-500 mb-2 tracking-tighter italic uppercase">Time Expired!</h2>
              <div className="my-10">
                <p className="text-slate-400 text-sm uppercase tracking-[0.3em] font-bold mb-2">Final Capture Score</p>
                <p className="text-9xl font-black text-white tracking-tighter">{score}</p>
              </div>
              <button 
                onClick={startGame}
                className="px-12 py-4 bg-white text-slate-950 rounded-full font-black text-xl flex items-center gap-3 hover:bg-slate-200 transition-all active:scale-95"
              >
                <RefreshCcw className="w-6 h-6" />
                RETRY MISSION
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="w-full flex justify-between items-center text-slate-500 text-sm font-medium px-4 pointer-events-auto">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 bg-slate-900/40 px-4 py-2 rounded-full border border-white/5">
              <MousePointer2 className="w-4 h-4 text-purple-500" />
              Use Mouse to Chase
            </span>
          </div>
          <a href="https://github.com/mymyanmarland/cat-hunter-game" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2 bg-slate-900/40 px-4 py-2 rounded-full border border-white/5">
            <Github className="w-4 h-4" />
            Repository
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;
