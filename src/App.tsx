import { useState, useEffect, useRef } from "react";
import { GameApp } from "./game/GameApp";
import { GameConfig } from "./game/GameConfig";

type Screen = "MENU" | "OPTIONS" | "GAME" | "RESULT" | "PAUSE" | "COMING_SOON";

const simulateKey = (code: string, type: 'keydown' | 'keyup') => {
    window.dispatchEvent(new KeyboardEvent(type, { code }));
};

const TouchButton = ({ code, label, style = {} }: any) => (
    <div
        onTouchStart={(e) => { e.preventDefault(); simulateKey(code, 'keydown'); }}
        onTouchEnd={(e) => { e.preventDefault(); simulateKey(code, 'keyup'); }}
        onMouseDown={() => simulateKey(code, 'keydown')}
        onMouseUp={() => simulateKey(code, 'keyup')}
        onMouseLeave={() => simulateKey(code, 'keyup')}
        style={{
            userSelect: 'none',
            touchAction: 'none',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '50%',
            width: 'clamp(35px, 10vw, 55px)',
            height: 'clamp(35px, 10vw, 55px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer',
            fontSize: 'clamp(0.7rem, 2.5vw, 1rem)',
            ...style
        }}
    >
        {label}
    </div>
);

export default function App() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const [screen, setScreen] = useState<Screen>("MENU");
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [resultReason, setResultReason] = useState("");
    const [resultTime, setResultTime] = useState(0);

    const [matchDuration, setMatchDuration] = useState(120);
    const [spawnInterval, setSpawnInterval] = useState(3.0);

    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const gameAppRef = useRef<GameApp | null>(null);

    // Load player configs as the game is oppened
    useEffect(() => {
        const savedDuration = localStorage.getItem("matchDuration");
        const savedSpawn = localStorage.getItem("spawnInterval");
        if (savedDuration) setMatchDuration(Number(savedDuration));
        if (savedSpawn) setSpawnInterval(Number(savedSpawn));
        
        const handleVisibilityChange = () => {
            if (document.hidden && screen === "GAME") {
                setScreen("PAUSE");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    // Main Game update
    useEffect(() => {
        if (screen === "GAME" && pixiContainerRef.current && !gameAppRef.current) 
        {
            GameConfig.matchDuration = matchDuration;
            GameConfig.spawnInterval = spawnInterval;

            gameAppRef.current = new GameApp(
                pixiContainerRef.current,
                (reason, finalScore, time) => 
                {
                    setResultReason(reason);
                    setScore(finalScore);
                    setResultTime(time);
                    setScreen("RESULT");
                },
                (currentScore, currentTime) => 
                {
                    setScore(currentScore);
                    setTimeLeft(currentTime);
                }
            );
        }

        return () => {
            if (screen !== "GAME" && screen !== "PAUSE" && gameAppRef.current) {
                gameAppRef.current.destroy();
                gameAppRef.current = null;
            }
        };
    }, [screen]);

    // Controlls Pause and Resume, changing the gameTime
    useEffect(() => {
        if (gameAppRef.current) {
            gameAppRef.current.isGameOver = (screen !== "GAME");
        }
    }, [screen]);

    return (
        <>
            {screen === "MENU" && (
                <div className="screen-container">
                    <div className="panel" style={{ width: "min(95vw, 800px)", maxHeight: "95vh", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
                        <img 
                            src="/assets/png/default/ui/menu/title_pirate_battle.png"
                            alt="Pirate Battle" 
                            style={{ width: "100%", maxWidth: "450px", height: "auto", display: "block", margin: "0 auto 2rem auto" }}
                        />
                        
                        <div className="menu-buttons" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "300px", margin: "0 auto 2rem auto" }}>
                            <button className="button" onClick={() => setScreen("GAME")}>
                                Play Game
                            </button>
                            <button className="button secondary" onClick={() => setScreen("OPTIONS")}>
                                Options
                            </button>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                            <button className="button terciary" onClick={() => setScreen("COMING_SOON")}>
                                Ranking
                            </button>
                            <button className="button terciary" onClick={() => setScreen("COMING_SOON")}>
                                Match History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {screen === "COMING_SOON" && (
                <div className="screen-container">
                    <div className="panel" style={{ width: "min(95vw, 800px)", maxHeight: "95vh", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
                        <h1 className="title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Coming Soon</h1>
                        <p style={{ marginBottom: "2rem", color: "#94a3b8", textAlign: "center", fontSize: "1.1rem" }}>
                            This feature is currently under development. Stay tuned for future updates!
                        </p>
                        
                        <button className="button" onClick={() => setScreen("MENU")}>
                            Back to Menu
                        </button>
                    </div>
                </div>
            )}

            {screen === "OPTIONS" && (
                <div className="screen-container">
                    <div className="panel" style={{ width: "min(95vw, 600px)", maxHeight: "95vh", overflowY: "auto", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
                        <h1 className="title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Options</h1>
                        
                        <div style={{ marginBottom: "2rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e2e8f0" }}>
                                Game Session Time (seconds): {matchDuration}
                            </label>
                            <input 
                                type="range" 
                                min="60" 
                                max="180" 
                                step="10"
                                value={matchDuration}
                                onChange={(e) => setMatchDuration(Number(e.target.value))}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div style={{ marginBottom: "3rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e2e8f0" }}>
                                Enemy Spawn Time (seconds): {spawnInterval.toFixed(1)}
                            </label>
                            <input 
                                type="range" 
                                min="1.0" 
                                max="10.0" 
                                step="0.5"
                                value={spawnInterval}
                                onChange={(e) => setSpawnInterval(Number(e.target.value))}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <button className="button" onClick={() => {
                            localStorage.setItem("matchDuration", matchDuration.toString());
                            localStorage.setItem("spawnInterval", spawnInterval.toString());
                            setScreen("MENU");
                        }}>
                            Save & Back
                        </button>
                    </div>
                </div>
            )}

            {screen === "GAME" && (
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}>
                    <div ref={pixiContainerRef} style={{ width: "100%", height: "100%" }} />
                    
                    <div style={{
                        position: "absolute",
                        top: 20,
                        left: 20,
                        zIndex: 20,
                        color: "white",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                        fontWeight: "bold",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
                    }}>
                        Score: {score} <br/>
                        Time: {timeLeft}s
                    </div>

                    <button className="button" style={{
                            position: "absolute",
                            top: 20,
                            right: 20,
                            zIndex: 20,
                            padding: "0.5rem 1.5rem",
                            fontSize: "clamp(0.8rem, 2vw, 1rem)"}}
                        onClick={() => setScreen("PAUSE")}>
                        Pause
                    </button>

                    {isTouch ? (
                        <>
                            <div className="mobile-controls" style={{ position: "absolute", bottom: "clamp(10px, 3vw, 20px)", right: "clamp(10px, 3vw, 20px)", zIndex: 30, display: "flex", gap: "clamp(5px, 2vw, 10px)", alignItems: "flex-end" }}>
                                <TouchButton code="KeyQ" label="Q" />
                                <TouchButton code="Space" label="FIRE" style={{ width: 'clamp(50px, 15vw, 75px)', height: 'clamp(50px, 15vw, 75px)', background: 'rgba(239,68,68,0.5)', border: '2px solid rgba(239,68,68,0.8)', fontSize: 'clamp(0.8rem, 3vw, 1.2rem)' }} />
                                <TouchButton code="KeyE" label="E" />
                            </div>
                            <div className="mobile-controls" style={{ position: "absolute", bottom: "clamp(10px, 3vw, 20px)", left: "clamp(10px, 3vw, 20px)", zIndex: 30 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, clamp(35px, 10vw, 55px))', gap: 'clamp(2px, 1vw, 5px)' }}>
                                    <div /> <TouchButton code="KeyW" label="W" /> <div />
                                    <TouchButton code="KeyA" label="A" /> <TouchButton code="KeyS" label="S" /> <TouchButton code="KeyD" label="D" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            position: "absolute",
                            bottom: 20,
                            left: 20,
                            zIndex: 20,
                            background: "rgba(30, 41, 59, 0.7)",
                            padding: "1rem",
                            borderRadius: "12px",
                            color: "white",
                            fontFamily: "'Outfit', sans-serif",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                        }}>
                            <h3 style={{ marginBottom: "0.5rem", color: "#60a5fa" }}>Comandos:</h3>
                            <p style={{ margin: "0.2rem 0" }}><b>WASD / Setas</b> : Mover e Girar</p>
                            <p style={{ margin: "0.2rem 0" }}><b>Espaço</b> : Atirar (Frente)</p>
                            <p style={{ margin: "0.2rem 0" }}><b>Q</b> / <b>E</b> : Atirar (Laterais)</p>
                        </div>
                    )}
                </div>
            )}

            {screen === "PAUSE" && (
                <div className="screen-container"
                    style={{ background: "rgba(0,0,0,0.7)", zIndex: 30 }}>
                    <div className="panel" style={{ width: "min(95vw, 600px)", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
                        <h1 className="title" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                            Paused
                        </h1>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <button className="button"
                                onClick={() => setScreen("GAME")}>
                            Resume
                        </button>
                        <button className="button"
                            onClick={() => {
                                if (gameAppRef.current) {
                                    gameAppRef.current.destroy();
                                    gameAppRef.current = null;
                                }
                                setScreen("MENU");
                            }}>
                            Abandon Match
                        </button>
                        </div>
                    </div>
                </div>
            )}

            {screen === "RESULT" && (
                <div className="screen-container">
                    <div className="panel" style={{ width: "min(95vw, 600px)", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
                        <h1 className="title" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                            Game Over
                        </h1>
                        <h2 style={{ marginBottom: "1rem" }}>Score: {score}</h2>
                        <h3 style={{ marginBottom: "1rem" }}>
                            Time Played: {resultTime}s
                        </h3>
                        {resultReason && (
                            <p style={{
                                    marginBottom: "2rem",
                                    color: "var(--negative)",
                                }}>
                                {resultReason}
                            </p>)}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <button className="button"
                                onClick={() => setScreen("GAME")}>
                                Play Again
                            </button>
                            <button className="button"
                                onClick={() => setScreen("MENU")}>
                                Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
