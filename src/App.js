import React, { useState, useEffect, useCallback, useRef } from 'react';

// Constants for game physics and sizing
const BIRD_SIZE = 38;
const BIRD_X = 50;
const GRAVITY = 0.18; // Heavily reduced from 0.32 for a very slow, smooth fall
const JUMP_STRENGTH = -4.2; // Adjusted to match lower gravity for gentle hops
const PIPE_WIDTH = 60;
const PIPE_GAP = 230; // Even wider gap for maximum playability
const PIPE_SPEED = 1.8; // Slightly slower horizontal movement
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

const App = () => {
  // Game State
  const [birdPos, setBirdPos] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('START'); // START, PLAYING, GAME_OVER
  const [highScore, setHighScore] = useState(0);

  const gameLoopRef = useRef();

  // Initialize/Reset Game
  const initGame = (e) => {
    if (e) e.stopPropagation();
    
    setBirdPos(GAME_HEIGHT / 2);
    setBirdVelocity(0); 
    setPipes([]);
    setScore(0);
    setGameStatus('PLAYING');
  };

  // Bird Jump Action
  const jump = useCallback((e) => {
    if (e) e.stopPropagation();
    
    if (gameStatus === 'PLAYING') {
      // Set velocity for a gentle upward glide
      setBirdVelocity(JUMP_STRENGTH);
    } else {
      initGame(e);
    }
  }, [gameStatus]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === 'PLAYING') {
          setBirdVelocity(JUMP_STRENGTH);
        } else {
          initGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus]);

  // Main Game Loop
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(gameLoopRef.current);
    }
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameStatus, birdPos, birdVelocity, pipes]);

  const update = () => {
    // 1. Update Bird Physics
    const newVelocity = birdVelocity + GRAVITY;
    const newBirdPos = birdPos + newVelocity;

    // Check floor collision (No ceiling collision for smoother play)
    if (newBirdPos > GAME_HEIGHT - BIRD_SIZE - 10) {
      endGame();
      return;
    }

    // 2. Update Pipes
    let newPipes = [...pipes];
    
    // Add new pipe with generous horizontal spacing
    if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - 280) {
      // Randomize height but keep it within comfortable bounds
      const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 180) + 60;
      newPipes.push({
        x: GAME_WIDTH,
        topHeight: topHeight,
        passed: false
      });
    }

    // Move pipes and check collisions
    newPipes = newPipes
      .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
      .filter(pipe => pipe.x + PIPE_WIDTH > 0);

    for (let pipe of newPipes) {
      // Very forgiving hitboxes (hitbox is smaller than the visual bird)
      const birdRect = { 
        top: newBirdPos + 12, 
        bottom: newBirdPos + BIRD_SIZE - 12, 
        left: BIRD_X + 12, 
        right: BIRD_X + BIRD_SIZE - 12 
      };
      
      const pipeRectTop = { top: 0, bottom: pipe.topHeight, left: pipe.x, right: pipe.x + PIPE_WIDTH };
      const pipeRectBottom = { top: pipe.topHeight + PIPE_GAP, bottom: GAME_HEIGHT, left: pipe.x, right: pipe.x + PIPE_WIDTH };

      if (
        (birdRect.right > pipeRectTop.left && birdRect.left < pipeRectTop.right && birdRect.top < pipeRectTop.bottom) ||
        (birdRect.right > pipeRectBottom.left && birdRect.left < pipeRectBottom.right && birdRect.bottom > pipeRectBottom.top)
      ) {
        endGame();
        return;
      }

      // Score tracking
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        setScore(s => s + 1);
      }
    }

    setBirdPos(newBirdPos);
    setBirdVelocity(newVelocity);
    setPipes(newPipes);
  };

  const endGame = () => {
    setGameStatus('GAME_OVER');
    if (score > highScore) setHighScore(score);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 font-sans select-none overflow-hidden touch-none">
      <div className="mb-4 text-white text-center">
        <h1 className="text-4xl font-extrabold mb-1 tracking-tighter italic text-red-500 uppercase">Angry Smooth</h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Low Gravity • Wide Gaps</p>
      </div>

      {/* Game Area */}
      <div 
        onMouseDown={jump}
        onTouchStart={jump}
        className="relative bg-gradient-to-b from-sky-300 to-sky-500 border-4 border-slate-700 rounded-2xl shadow-2xl overflow-hidden cursor-pointer active:brightness-95"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Angry Bird (Red) */}
        <div 
          className="absolute"
          style={{ 
            width: BIRD_SIZE, 
            height: BIRD_SIZE, 
            left: BIRD_X, 
            top: birdPos,
            transform: `rotate(${Math.min(birdVelocity * 3, 90)}deg)`,
            transition: 'transform 0.15s linear'
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            {/* Body */}
            <circle cx="50" cy="50" r="45" fill="#e11d48" stroke="#9f1239" strokeWidth="4" />
            {/* White Tummy */}
            <path d="M 20 70 Q 50 95 80 70 Q 50 80 20 70" fill="white" opacity="0.8" />
            {/* Eyes Section */}
            <circle cx="38" cy="45" r="10" fill="white" stroke="black" strokeWidth="1" />
            <circle cx="38" cy="45" r="3" fill="black" />
            <circle cx="62" cy="45" r="10" fill="white" stroke="black" strokeWidth="1" />
            <circle cx="62" cy="45" r="3" fill="black" />
            {/* Angry Brows */}
            <path d="M 25 35 L 50 45 L 75 35" fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" />
            {/* Beak */}
            <path d="M 45 52 L 55 52 L 50 65 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            {/* Feather Tuft */}
            <path d="M 45 10 Q 50 -5 60 10" fill="none" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Pipes */}
        {pipes.map((pipe, i) => (
          <React.Fragment key={i}>
            <div 
              className="absolute bg-emerald-500 border-x-4 border-b-8 border-emerald-800 rounded-b-lg shadow-lg"
              style={{ width: PIPE_WIDTH, height: pipe.topHeight, left: pipe.x, top: 0 }}
            />
            <div 
              className="absolute bg-emerald-500 border-x-4 border-t-8 border-emerald-800 rounded-t-lg shadow-lg"
              style={{ width: PIPE_WIDTH, height: GAME_HEIGHT - (pipe.topHeight + PIPE_GAP), left: pipe.x, top: pipe.topHeight + PIPE_GAP }}
            />
          </React.Fragment>
        ))}

        {/* HUD Score */}
        {gameStatus === 'PLAYING' && (
          <div className="absolute top-10 w-full text-center text-8xl font-black text-white/50 drop-shadow-lg pointer-events-none z-10">
            {score}
          </div>
        )}

        {/* Overlays */}
        {gameStatus !== 'PLAYING' && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white p-12 rounded-[3rem] text-slate-900 text-center shadow-2xl border-b-[12px] border-slate-300 transform scale-100">
              {gameStatus === 'START' ? (
                <>
                  <h2 className="text-4xl font-black mb-8 tracking-tight text-red-600 uppercase">Angry Smooth</h2>
                  <button 
                    onClick={initGame}
                    className="bg-red-500 hover:bg-red-600 text-white font-black py-5 px-16 rounded-2xl shadow-[0_8px_0_0_#9f1239] active:translate-y-1 active:shadow-none transition-all text-3xl uppercase"
                  >
                    Launch
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-slate-400 mb-2 uppercase tracking-tighter">Score</h2>
                  <div className="text-8xl font-black mb-10 tracking-tighter text-slate-900">{score}</div>
                  <button 
                    onClick={initGame}
                    className="bg-red-500 hover:bg-red-600 text-white font-black py-5 px-14 rounded-2xl shadow-[0_8px_0_0_#9f1239] active:translate-y-1 active:shadow-none transition-all text-2xl uppercase tracking-widest"
                  >
                    Retry
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-8 bg-slate-800 border-t-4 border-slate-900 z-20" />
      </div>

      {/* Stats footer */}
      <div className="mt-8 flex gap-12 text-slate-500 uppercase tracking-widest font-bold text-xs">
        <div className="text-center">
          <div className="mb-2">Current</div>
          <div className="text-3xl text-white font-mono bg-slate-800/50 px-6 py-2 rounded-xl border border-slate-700">{score}</div>
        </div>
        <div className="text-center">
          <div className="mb-2">Best</div>
          <div className="text-3xl text-yellow-400 font-mono bg-slate-800/50 px-6 py-2 rounded-xl border border-slate-700">{highScore}</div>
        </div>
      </div>
    </div>
  );
};

export default App;