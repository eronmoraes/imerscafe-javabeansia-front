import { useState } from 'react';
import './App.css';

function App() {
  // Telas: 'inicial', 'diagnostico', 'loading', 'jogo', 'receitas', 'detalhes', 'resultado', 'gameover'
  const [tela, setTela] = useState('inicial');
  const [nomeBarista, setNomeBarista] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [resposta, setResposta] = useState('');
  const [xpTotal, setXpTotal] = useState(0);
  const [loadingReq, setLoadingReq] = useState(false);
  const [diagnosticoData, setDiagnosticoData] = useState(null);
  const [resultadoIA, setResultadoIA] = useState({ xpGanho: 0, feedbackEducativo: '' });

  // Funções de Navegação e Lógica
  const iniciarJogo = () => {
    if (nomeBarista.trim().length < 2) return alert("Digite seu nome!");
    setSessionId(`${nomeBarista}-${Date.now()}`);
    setTela('loading');
    setTimeout(() => setTela('jogo'), 2500); // Aumentei um pouco para dar tempo de ver a tela de loading
  };

  const testarBackend = async () => {
    setTela('diagnostico');
    setDiagnosticoData('Carregando...');
    try {
      const res = await fetch("http://localhost:8080/game/diagnostico");
      const data = await res.json();
      setDiagnosticoData(JSON.stringify(data, null, 2));
    } catch (error) {
      setDiagnosticoData("ERRO: Não foi possível conectar ao Back-end (localhost:8080). Ele está rodando?");
    }
  };

  const entregarPedido = async () => {
    if (resposta.trim().length < 3) return alert("A resposta deve ter mais de 3 caracteres.");
    setLoadingReq(true);
    try {
      const res = await fetch("http://localhost:8080/game/avaliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, resposta })
      });
      if (res.ok) {
        const data = await res.json();
        setResultadoIA({ xpGanho: data.xpGanho, feedbackEducativo: data.feedbackEducativo });
        setXpTotal(prev => prev + data.xpGanho);
        setTela('resultado');
      } else {
        alert("Erro na IA: Status " + res.status);
      }
    } catch (error) {
      alert("Erro de conexão com o Back-end.");
    } finally {
      setLoadingReq(false);
    }
  };

  // Renderização
  return (
    <div className="simulador-card">
      <div className="header">
        <span>☕ Java Beans - {tela.toUpperCase()}</span>
        <span>Pontuação: {xpTotal}</span>
      </div>
      
      <div className="body-p">
        
        {/* TELA INICIAL */}
        {tela === 'inicial' && (
          <div className="text-center">
            <div className="painel-vermelho">
              <h2>JAVABEANS</h2>
              <p>CAFETERIA</p>
              <div className="mt-4">
                <p className="mb-1">Digite seu nome:</p>
                <input 
                  type="text" 
                  className="form-control text-center mb-3" 
                  value={nomeBarista}
                  onChange={(e) => setNomeBarista(e.target.value)}
                />
                <button onClick={iniciarJogo} className="btn btn-swing btn-red w-100 p-2 mb-2">INICIAR JOGO</button>
              </div>
            </div>
            <button onClick={testarBackend} className="btn btn-sm btn-outline-secondary w-100">🛠️ Testar Conexão Back-end</button>
          </div>
        )}

        {/* TELA DIAGNÓSTICO */}
        {tela === 'diagnostico' && (
          <div>
            <h4 className="text-center mb-3">Diagnóstico de Integração</h4>
            <div className="console-box mb-3">{diagnosticoData}</div>
            <button onClick={() => setTela('inicial')} className="btn btn-swing btn-blue w-100 p-2">VOLTAR</button>
          </div>
        )}

        {/* TELA LOADING (CLIENTE CHEGANDO) */}
        {tela === 'loading' && (
          <div className="painel-vermelho py-4 text-center">
            {/* Espaço reservado para o GIF/Imagem do cliente entrando, igual ao Swing */}
            <div className="bg-light mx-auto mb-3 d-flex align-items-center justify-content-center border border-dark" style={{ width: '150px', height: '150px' }}>
               <span className="text-dark">🧍 Imagem<br/>Cliente</span>
            </div>
            <h5 className="mb-4">Um cliente está entrando na cafeteria...</h5>
            <div className="progress" style={{ height: '20px', borderRadius: 0 }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated bg-success w-100"></div>
            </div>
          </div>
        )}

        {/* TELA JOGO */}
        {tela === 'jogo' && (
          <div>
            <div className="painel-vermelho">
              <h5>Cliente: Prof. Leandro</h5>
              <p className="fst-italic mt-3">"Não sei o que escolher... O sistema de vocês caiu e estou atrasado."</p>
            </div>
            
            <textarea 
              className="form-control mb-3" 
              rows="3" 
              placeholder="Digite sua resposta/ação como barista..."
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              disabled={loadingReq}
            ></textarea>

            <div className="row g-2">
              <div className="col-6">
                <button onClick={() => setTela('receitas')} className="btn btn-swing btn-blue w-100 p-3">📘 Ver Receitas</button>
              </div>
              <div className="col-6">
                <button onClick={entregarPedido} className="btn btn-swing btn-green w-100 p-3" disabled={loadingReq}>
                  {loadingReq ? 'IA Pensando...' : '☕ Ir Preparar (Enviar)'}
                </button>
              </div>
              <div className="col-6">
                {/* O botão agora leva para a tela certa de Detalhes */}
                <button onClick={() => setTela('detalhes')} className="btn btn-swing btn-red w-100 p-3" disabled={loadingReq}>📄 Esqueci Pedido</button>
              </div>
              <div className="col-6">
                <button onClick={() => setTela('gameover')} className="btn btn-swing btn-red w-100 p-3" disabled={loadingReq}>🛑 Finalizar Jogo</button>
              </div>
            </div>
          </div>
        )}

        {/* TELA DETALHES DO CLIENTE (A TELA QUE FALTAVA) */}
        {tela === 'detalhes' && (
          <div>
            <div className="text-center mb-3 border-bottom pb-2">
              <h4>📋 Detalhes do Cliente</h4>
            </div>
            <div className="bg-light p-4 border border-dark mb-3" style={{ textAlign: 'left', fontFamily: 'monospace' }}>
              <p><strong>Tipo:</strong> Apressado</p>
              <p><strong>Pedido:</strong> Cappuccino</p>
              <p><strong>Ingredientes:</strong> Café, Água, Leite, Açúcar, Cacau</p>
            </div>
            <button onClick={() => setTela('jogo')} className="btn btn-swing btn-red w-100 p-3">⬅ Voltar ao Jogo</button>
          </div>
        )}

        {/* TELA RECEITAS */}
        {tela === 'receitas' && (
          <div>
            <div className="text-center mb-3 border-bottom pb-2">
              <h4>📖 Livro de Receitas</h4>
            </div>
            <ul className="list-unstyled" style={{ lineHeight: '2' }}>
              <li><strong>Café Preto:</strong> Café, Água</li>
              <li><strong>Café Latte:</strong> Café, Água, Leite</li>
              <li><strong>Cappuccino:</strong> Café, Água, Leite, Açúcar, Cacau</li>
              <li><strong>Matcha Latte:</strong> Água, Leite, Matcha</li>
            </ul>
            <button onClick={() => setTela('jogo')} className="btn btn-swing btn-red w-100 mt-3 p-2">⬅ Voltar ao Jogo</button>
          </div>
        )}

        {/* TELA RESULTADO (Feedback da IA) */}
        {tela === 'resultado' && (
          <div className="text-center">
            <h3 className="mb-3">Resultado do Atendimento</h3>
            <h1 className="text-success mb-3">+{resultadoIA.xpGanho} XP</h1>
            <div className="alert alert-info text-start border-dark" style={{ borderRadius: 0 }}>
              {resultadoIA.feedbackEducativo}
            </div>
            <button onClick={() => { setResposta(''); setTela('loading'); setTimeout(() => setTela('jogo'), 1500); }} className="btn btn-swing btn-green w-100 p-3 mt-2">Atender Próximo Cliente</button>
          </div>
        )}

        {/* TELA GAME OVER */}
        {tela === 'gameover' && (
          <div className="painel-vermelho py-5">
            <h1 className="display-5 fw-bold mb-4">GAME OVER!</h1>
            <h4>Pontuação Final: {xpTotal}</h4>
            <div className="mt-5">
              <button onClick={() => window.location.reload()} className="btn btn-swing btn-blue w-100 p-3">MAIS CAFÉ? (Reiniciar)</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
