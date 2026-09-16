import React, { useEffect, useRef, useState } from 'react'
import { LoginScreen, Leaderboard } from './components/UI'
import { socket } from './services/socket'
import { PixiApp } from './game/PixiApp'

function App() {
  const [username, setUsername] = useState(null)
  const [playersState, setPlayersState] = useState({})
  const canvasContainer = useRef(null)
  const pixiAppRef = useRef(null)

  useEffect(() => {
    if (username && canvasContainer.current && !pixiAppRef.current) {
      // Inicializar Pixi
      pixiAppRef.current = new PixiApp(canvasContainer.current);

      // Conectar socket
      socket.connect();
      socket.emit('join_game', username);

      // Escutar estado global para atualizar UI React (ex: Leaderboard)
      const onGameState = (state) => {
        setPlayersState(state.players);
      };
      
      socket.on('game_state', onGameState);

      return () => {
        socket.off('game_state', onGameState);
        socket.disconnect();
        if (pixiAppRef.current) {
          pixiAppRef.current.destroy();
          pixiAppRef.current = null;
        }
      }
    }
  }, [username]);

  return (
    <>
      {!username && (
        <LoginScreen onLogin={(name) => setUsername(name)} />
      )}
      
      <div className="ui-layer">
        {username && (
          <>
            <Leaderboard players={playersState} />
            <div style={{ padding: '20px', pointerEvents: 'none' }}>
              <h2>Bem-vindo, {username}!</h2>
              <p>Use as setas ou WASD para mover. Pegue as moedas!</p>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasContainer}></canvas>
    </>
  )
}

export default App
