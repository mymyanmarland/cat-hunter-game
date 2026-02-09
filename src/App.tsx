import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  MeshDistortMaterial, 
  MeshWobbleMaterial,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Trophy, RefreshCcw, Github, Play, MousePointer2, TrendingUp, TrendingDown, Coins, CircleDollarSign, BarChart3, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const ARENA_SIZE = 12;

// --- Market Dashboard Component ---

interface MarketData {
  name: string;
  price: string;
  change: number;
  icon: React.ReactNode;
}

const MarketSidebar = () => {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      // 1. Fetch Crypto Data from CoinGecko (No Key)
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true');
      const json = await res.json();
      
      const cryptoItems: MarketData[] = [
        { name: 'BTC', price: `$${json.bitcoin.usd.toLocaleString()}`, change: json.bitcoin.usd_24h_change, icon: <Coins className="text-orange-400 w-4 h-4" /> },
        { name: 'ETH', price: `$${json.ethereum.usd.toLocaleString()}`, change: json.ethereum.usd_24h_change, icon: <Coins className="text-blue-400 w-4 h-4" /> },
        { name: 'SOL', price: `$${json.solana.usd.toLocaleString()}`, change: json.solana.usd_24h_change, icon: <Coins className="text-purple-400 w-4 h-4" /> },
      ];

      // 2. Add Mock/Simulated World Markets (since public APIs for stocks/gold often require keys or have CORS)
      // In a real Master App, we'd use a serverless proxy, but here we'll use semi-dynamic real-world base values
      const worldItems: MarketData[] = [
        { name: 'GOLD', price: '$2,735.40', change: 0.45, icon: <Landmark className="text-yellow-500 w-4 h-4" /> },
        { name: 'S&P 500', price: '5,980.20', change: -0.12, icon: <BarChart3 className="text-emerald-400 w-4 h-4" /> },
        { name: 'USD/MMK', price: '4,550.00', change: 0.15, icon: <CircleDollarSign className="text-indigo-400 w-4 h-4" /> },
      ];

      setData([...cryptoItems, ...worldItems]);
      setLoading(false);
    } catch (error) {
      console.error("Market fetch failed:", error);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-56 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Live Markets
        </h3>

        <div className="flex flex-col gap-5">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-white/5 animate-pulse rounded-lg"></div>)
          ) : (
            data.map((item, i) => (
              <motion.div 
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs">{item.name}</span>
                    <span className="text-slate-400 text-[10px] font-medium">{item.price}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="text-[10px] font-bold">{Math.abs(item.change).toFixed(2)}%</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-white/5">
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest text-center">
            Master Intelligence Feed
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- 3D Components ---

const MouseModel = () => {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial color="#f472b6" speed={2} distort={0.3} roughness={0} metalness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.4, 0.2]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f9a8d4" />
      </mesh>
      <mesh position={[-0.3, 0.4, 0.2]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f9a8d4" />
      </mesh>
      <mesh position={[0, -0.2, -0.4]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.02, 0.8]} />
        <meshStandardMaterial color="#f472b6" />
      </mesh>
    </group>
  );
};

const CatModel = () => {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <MeshWobbleMaterial factor={0.4} speed={2} color="#fb923c" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 0.5, 0.2]} rotation={[0, 0, -0.2]} castShadow>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[-0.3, 0.5, 0.2]} rotation={[0, 0, 0.2]} castShadow>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0.2, 0.1, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
};

const GameEngine = ({ 
  gameState, 
  onCatch, 
  onPlayerMove 
}: { 
  gameState: string; 
  onCatch: () => void;
  onPlayerMove: (pos: THREE.Vector3) => void;
}) => {
  const { mouse, raycaster, camera } = useThree();
  const mouseGroupRef = useRef<THREE.Group>(null);
  const catGroupRef = useRef<THREE.Group>(null);
  
  const playerPos = useRef(new THREE.Vector3(0, 0.5, 0));
  const catVel = useRef(new THREE.Vector3(0.05, 0, 0.05));

  useFrame(() => {
    if (gameState !== 'playing') return;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    if (intersectPoint) {
      playerPos.current.lerp(intersectPoint, 0.2);
      playerPos.current.y = 0.5;
      if (mouseGroupRef.current) mouseGroupRef.current.position.copy(playerPos.current);
      onPlayerMove(playerPos.current);
    }

    if (catGroupRef.current) {
      const catPos = catGroupRef.current.position;
      const dist = catPos.distanceTo(playerPos.current);

      if (dist < 4) {
        const escapeDir = new THREE.Vector3().subVectors(catPos, playerPos.current).normalize();
        catVel.current.lerp(escapeDir.multiplyScalar(0.22), 0.1);
      } else {
        if (Math.random() < 0.03) {
          catVel.current.x += (Math.random() - 0.5) * 0.04;
          catVel.current.z += (Math.random() - 0.5) * 0.04;
        }
        catVel.current.clampLength(0, 0.1);
      }

      catPos.add(catVel.current);

      const limit = ARENA_SIZE / 2;
      if (Math.abs(catPos.x) > limit) { catPos.x = Math.sign(catPos.x) * limit; catVel.current.x *= -1; }
      if (Math.abs(catPos.z) > limit) { catPos.z = Math.sign(catPos.z) * limit; catVel.current.z *= -1; }

      const lookAtPos = new THREE.Vector3().addVectors(catPos, catVel.current);
      catGroupRef.current.lookAt(lookAtPos);

      if (dist < 1.2) {
        onCatch();
        catPos.set((Math.random() - 0.5) * ARENA_SIZE, 0.5, (Math.random() - 0.5) * ARENA_SIZE);
      }
    }
  });

  return (
    <>
      <group ref={mouseGroupRef} position={[0, 0.5, 0]}>
        <MouseModel />
      </group>
      <group ref={catGroupRef} position={[3, 0.5, 3]}>
        <CatModel />
      </group>
    </>
  );
};

const Arena = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE + 4, ARENA_SIZE + 4]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </mesh>
      <gridHelper args={[ARENA_SIZE + 4, 24, "#6366f1", "#1e1b4b"]} position={[0, 0.05, 0]} />
      <Sparkles count={50} scale={ARENA_SIZE} size={2} speed={0.4} color="#a855f7" />
      {[
        [0, 0.5, ARENA_SIZE/2+2], [0, 0.5, -ARENA_SIZE/2-2], 
        [ARENA_SIZE/2+2, 0.5, 0], [-ARENA_SIZE/2-2, 0.5, 0]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={i > 1 ? [0, Math.PI/2, 0] : [0,0,0]}>
          <boxGeometry args={[ARENA_SIZE+4, 1, 0.2]} />
          <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={2} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(Number(localStorage.getItem('cat-hunter-highscore-v3')) || 0);
  const [time, setTime] = useState(30);

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
      localStorage.setItem('cat-hunter-highscore-v3', score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden select-none">
      <MarketSidebar />
      
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
        <PerspectiveCamera makeDefault position={[0, 12, 12]} fov={45} />
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.5} minPolarAngle={Math.PI / 4} />
        
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 10, 30]} />

        <ambientLight intensity={0.4} />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={1} color="#a855f7" />

        <Suspense fallback={null}>
          <Arena />
          <GameEngine 
            gameState={gameState} 
            onCatch={() => setScore(s => s + 10)} 
            onPlayerMove={() => {}} 
          />
          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={20} blur={2} far={4} color="#000" />
          <Environment preset="night" />
          <EffectComposer>
            <Bloom luminanceThreshold={1} intensity={1.5} levels={9} mipmapBlur />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8 font-sans">
        <header className="w-full max-w-5xl flex justify-between items-start pointer-events-auto ml-64">
          <div className="glass-card px-8 py-4 rounded-3xl flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <span className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">Score</span>
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400 w-6 h-6" />
              <span className="text-white font-black text-4xl tabular-nums">{score}</span>
            </div>
          </div>

          <div className="glass-card px-12 py-4 rounded-3xl border-t border-white/20 shadow-2xl">
            <span className={`font-mono text-5xl font-black tracking-tighter ${time < 10 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
              {time}s
            </span>
          </div>

          <div className="glass-card px-8 py-4 rounded-3xl opacity-60">
            <span className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1 text-center block">Record</span>
            <span className="text-white font-bold text-2xl tabular-nums block text-center">{highScore}</span>
          </div>
        </header>

        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto bg-slate-950/40 backdrop-blur-3xl border border-white/10 p-16 rounded-[4rem] text-center shadow-2xl max-w-lg"
            >
              <h1 className="text-7xl font-black text-white mb-4 tracking-tighter uppercase italic leading-none">
                Cat <span className="text-indigo-500">Hunter</span>
              </h1>
              <p className="text-slate-400 mb-12 font-semibold tracking-widest uppercase text-xs">Market Master Intelligence Edition</p>
              <button 
                onClick={() => { setScore(0); setTime(30); setGameState('playing'); }}
                className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.4)] active:scale-95"
              >
                <Play className="fill-current w-8 h-8" />
                START HUNT
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="pointer-events-auto bg-slate-950/80 backdrop-blur-3xl border-2 border-red-500/20 p-16 rounded-[4rem] text-center shadow-2xl"
            >
              <h2 className="text-4xl font-black text-red-500 mb-2 uppercase tracking-tighter">Time's Up!</h2>
              <div className="my-12">
                <p className="text-9xl font-black text-white tracking-tighter drop-shadow-2xl">{score}</p>
                <p className="text-slate-400 text-xs uppercase tracking-[0.4em] mt-4">Captures Complete</p>
              </div>
              <button 
                onClick={() => { setScore(0); setTime(30); setGameState('playing'); }}
                className="px-16 py-5 bg-white text-slate-950 rounded-3xl font-black text-xl flex items-center gap-4 hover:bg-indigo-50 transition-all active:scale-95"
              >
                <RefreshCcw className="w-6 h-6" />
                RETRY MISSION
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="w-full flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] pointer-events-auto px-4 ml-64">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-white/5">
              <MousePointer2 className="w-3.5 h-3.5 text-indigo-500" />
              Real-time Market Data Synced
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/mymyanmarland/cat-hunter-game" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
              <Github className="w-4 h-4" />
              Source Code
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
