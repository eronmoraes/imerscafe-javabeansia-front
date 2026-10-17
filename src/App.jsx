import { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080/game';

const ingredientesDisponiveis = [
  'CAFE', 'LEITE', 'CHOCOLATE', 'ESPUMA', 'CHANTILLY',
  'CARAMELO', 'CANELA', 'ACUCAR', 'BAUNILHA', 'CREME', 'AGUA'
];

function App() {
  const [tela, setTela] = useState('inicial');
  const [nomeBarista, setNomeBarista] = useState('');
  const [resposta, setResposta] = useState('');
  const [xpTotal, setXpTotal] = useState(0);
  const [loadingReq, setLoadingReq] = useState(false);
  const [diagnosticoData, setDiagnosticoData] = useState(null);

  const [bebidaAtual, setBebidaAtual] = useState('Carregando...');
  const [selecionados, setSelecionados] = useState([]);
  const [resultado, setResultado] = useState(null);

  const [falaRegistrada, setFalaRegistrada] = useState('');
  const [ultimaBebidaPreparada, setUltimaBebidaPreparada] = useState('');
  const [avaliacaoSoftSkill, setAvaliacaoSoftSkill] = useState(null);

  const testarBackend = async () => {
    setTela('diagnostico');
    setDiagnosticoData('Carregando...');
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setDiagnosticoData(JSON.stringify(data, null, 2));
    } catch (error) {
      setDiagnosticoData('ERRO: Não foi possível conectar ao Back-end. Ele está rodando?');
    }
  };

  const carregarProximoCliente = async () => {
    try {
      const res = await fetch(`${API_BASE}/cenario`, { credentials: 'include' });
      if (res.ok) {
        const nome = await res.text();
        setBebidaAtual(nome);
      }
    } catch (error) {
      console.error('Erro ao carregar cenário');
    }
  };

  const iniciarJogo = async () => {
    if (nomeBarista.trim().length < 2) {
      return alert('Digite seu nome!');
    }

    // Envia nomeBarista para o backend para inicializar sessão
    try {
      await fetch(`${API_BASE}/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeBarista: nomeBarista.trim() }),
        credentials: 'include'
      });
    } catch (e) {
      // Se falhar, segue fluxo normal, mas idealmente exibir erro
    }

    await carregarProximoCliente();
    setTela('loading');
    setTimeout(() => setTela('jogo'), 2500);
  };

  const irParaMaquina = async () => {
    if (resposta.trim().length < 3) {
      return alert('Interaja com o cliente antes de preparar o café!');
    }

    setFalaRegistrada(resposta.trim());
    try {
      const res = await fetch(`${API_BASE}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resposta.trim()),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAvaliacaoSoftSkill(data);
      } else {
        setAvaliacaoSoftSkill(null);
      }
    } catch (err) {
      setAvaliacaoSoftSkill(null);
    }
    setTela('preparar');
  };

  const toggleIngrediente = (ing) => {
    setSelecionados((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const servirCafe = async () => {
    if (selecionados.length === 0) {
      return alert('Selecione os ingredientes!');
    }

    if (resposta.trim().length < 3) {
      return alert('Interaja com o cliente antes de servir o café!');
    }

    setLoadingReq(true);

    try {
      const bebidaDaRodada = bebidaAtual;

      const res = await fetch(`${API_BASE}/preparar-cafe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientesEscolhidos: selecionados,
          falaBarista: falaRegistrada
        }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setResultado(data);
        setXpTotal(data.pontuacaoTotal);
        // Garantir leitura correta do ganho imediato da rodada
        if (typeof data.pontosNestaRodada !== 'undefined') {
          // Opcional: pode-se exibir em outro local se necessário
        }
        setUltimaBebidaPreparada(bebidaDaRodada);
        setBebidaAtual(data.proximoCliente.nomeBebida);
        setTela('resultado');
      } else {
        alert('Erro no servidor.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoadingReq(false);
    }
  };

  const atenderProximo = () => {
    setResposta('');
    setSelecionados([]);
    setResultado(null);
    setFalaRegistrada('');
    setUltimaBebidaPreparada('');
    setTela('loading');
    setTimeout(() => setTela('jogo'), 1500);
  };

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
                <button
                  onClick={iniciarJogo}
                  className="btn btn-swing btn-red w-100 p-2 mb-2"
                >
                  INICIAR JOGO
                </button>
              </div>
            </div>
            <button
              onClick={testarBackend}
              className="btn btn-sm btn-outline-secondary w-100"
            >
              🛠️ Testar Conexão Back-end
            </button>
          </div>
        )}

        {/* TELA DIAGNÓSTICO */}
        {tela === 'diagnostico' && (
          <div>
            <h4 className="text-center mb-3">Diagnóstico de Integração</h4>
            <div className="console-box mb-3">{diagnosticoData}</div>
            <button
              onClick={() => setTela('inicial')}
              className="btn btn-swing btn-blue w-100 p-2"
            >
              VOLTAR
            </button>
          </div>
        )}

        {tela === 'loading' && (
          <div className="painel-vermelho py-4 text-center">
            <div
              className="bg-light mx-auto mb-3 d-flex align-items-center justify-content-center border border-dark"
              style={{ width: '150px', height: '150px' }}
            >
              <span className="text-dark">
                🧍 Imagem
                <br />
                Cliente
              </span>
            </div>
            <h5 className="mb-4">Um cliente está entrando na cafeteria...</h5>
            <div className="progress" style={{ height: '20px', borderRadius: 0 }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated bg-success w-100"></div>
            </div>
          </div>
        )}

        {tela === 'jogo' && (
          <div>
            <div className="painel-vermelho">
              <h5>O Cliente pediu:</h5>
              <h3 className="text-warning mt-2">{bebidaAtual}</h3>
            </div>

            <p className="fw-bold mb-1">1. Fale com o cliente (Soft Skill):</p>
            <textarea
              className="form-control mb-3 border-dark"
              rows="2"
              placeholder="Ex: Já vou preparar seu pedido! Desculpe a demora..."
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
            ></textarea>

            <div className="row g-2">
              <div className="col-6">
                <button
                  onClick={() => setTela('receitas')}
                  className="btn btn-swing btn-blue w-100 p-3"
                >
                  📘 Ver Receitas
                </button>
              </div>
              <div className="col-6">
                <button
                  onClick={irParaMaquina}
                  className="btn btn-swing btn-green w-100 p-3"
                >
                  ⚙️ Ir para Máquina ➔
                </button>
              </div>
              <div className="col-6">
                <button
                  onClick={() => setTela('detalhes')}
                  className="btn btn-swing btn-red w-100 p-3"
                >
                  📄 Detalhes
                </button>
              </div>
              <div className="col-6">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-swing btn-red w-100 p-3"
                >
                  🛑 Reiniciar Jogo
                </button>
              </div>
            </div>
          </div>
        )}

        {tela === 'preparar' && (
          <div>
            <div className="text-center mb-3 border-bottom pb-2">
              <h4>⚙️ Máquina de Café</h4>
              <p className="text-muted mb-0">
                Preparando: <strong>{bebidaAtual}</strong>
              </p>
            </div>

            <div className="bg-light border border-dark p-3 mb-3 text-start" style={{ borderRadius: 0 }}>
              <p className="mb-0">
                <strong>Sua fala ao cliente:</strong>{' '}
                {falaRegistrada || 'Nenhuma fala registrada.'}
              </p>
            </div>

            {/* Feedback educativo da IA após avaliação soft skill */}
            {avaliacaoSoftSkill && (
              <div className="alert alert-info text-start" style={{ borderRadius: 0 }}>
                <strong>Feedback da IA (Soft Skill):</strong>
                <div className="mt-1">{avaliacaoSoftSkill.feedbackEducativo || avaliacaoSoftSkill.feedback || 'Sem feedback.'}</div>
                {avaliacaoSoftSkill.xpGanho !== undefined && (
                  <div className="mt-2 small">XP Soft Skill: <strong>+{avaliacaoSoftSkill.xpGanho}</strong></div>
                )}
              </div>
            )}

            <p className="mb-2 fw-bold text-center">
              2. Selecione os Ingredientes (Hard Skill):
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                margin: '15px 0'
              }}
            >
              {ingredientesDisponiveis.map((ing) => (
                <button
                  key={ing}
                  onClick={() => toggleIngrediente(ing)}
                  className={`btn btn-swing ${
                    selecionados.includes(ing) ? 'btn-green' : 'btn-blue'
                  }`}
                  style={{ padding: '10px', fontSize: '0.85rem' }}
                >
                  {ing}
                </button>
              ))}
            </div>

            <div className="text-center my-3 p-2 border border-dark bg-light">
              <small className="text-muted d-block">Na xícara:</small>
              <strong>{selecionados.join(' + ') || 'Vazia'}</strong>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-4">
                <button
                  onClick={() => setTela('jogo')}
                  className="btn btn-swing btn-red w-100 p-3"
                  disabled={loadingReq}
                >
                  ⬅ Voltar
                </button>
              </div>
              <div className="col-8">
                <button
                  onClick={servirCafe}
                  disabled={loadingReq || selecionados.length === 0}
                  className="btn btn-swing btn-green w-100 p-3"
                >
                  {loadingReq ? 'IA Avaliando...' : '🔔 Servir Cliente!'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tela === 'detalhes' && (
          <div>
            <div className="text-center mb-3 border-bottom pb-2">
              <h4>📋 Detalhes do Cliente</h4>
            </div>
            <div
              className="bg-light p-4 border border-dark mb-3"
              style={{ textAlign: 'left', fontFamily: 'monospace' }}
            >
              <p>
                <strong>Pedido Atual:</strong> {bebidaAtual}
              </p>
            </div>
            <button
              onClick={() => setTela('jogo')}
              className="btn btn-swing btn-red w-100 p-3"
            >
              ⬅ Voltar ao Balcão
            </button>
          </div>
        )}

        {tela === 'receitas' && (
          <div>
            <div className="text-center mb-3 border-bottom pb-2">
              <h4>📖 Livro de Receitas</h4>
            </div>
            <ul className="list-unstyled" style={{ lineHeight: '2' }}>
              <li>
                <strong>Mocha:</strong> Cafe, Chocolate, Leite
              </li>
              <li>
                <strong>Cappuccino:</strong> Cafe, Leite, Espuma
              </li>
              <li>
                <strong>Latte:</strong> Cafe, Leite, Baunilha
              </li>
              <li>
                <strong>Café c/ Chantilly:</strong> Cafe, Chantilly, Caramelo
              </li>
            </ul>
            <button
              onClick={() => setTela('jogo')}
              className="btn btn-swing btn-red w-100 mt-3 p-2"
            >
              ⬅ Voltar ao Balcão
            </button>
          </div>
        )}

        {/* TELA RESULTADO */}
        {tela === 'resultado' && resultado && (
          <div className="text-center">
            <div className="mb-4">
              <h1 className={resultado.acertou ? 'text-success display-4 fw-bold' : 'text-danger display-4 fw-bold'}>
                {resultado.acertou ? '🎉 SUCESSO!' : '❌ RECEITA ERRADA'}
              </h1>
              <span className="badge bg-light text-dark border p-2 px-3">+{resultado.pontosNestaRodada} XP ADQUIRIDOS</span>
            </div>

            {/* Box Altamente Estilizado (Cozy Flat Design) */}
            <div className="ia-feedback-container my-5">
              <div className="ia-feedback-card text-start">
                <div className="ia-status-badge">
                  <div className="ia-pulse-dot"></div>
                  Análise da Inteligência Artificial
                </div>
                
                <div className="d-flex align-items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-3 bg-primary bg-opacity-10 rounded-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#0d6efd" className="bi bi-chat-left-quote" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                        <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ia-feedback-text">
                    {resultado.feedbackIA}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                   <div className="text-muted small">
                      <strong>Pedido:</strong> {ultimaBebidaPreparada}
                   </div>
                   <div className="text-muted small">
                      <strong>Barista:</strong> {nomeBarista}
                   </div>
                </div>
              </div>
            </div>

            <button
              onClick={atenderProximo}
              className="btn btn-swing btn-blue w-100 p-3 shadow-sm"
              style={{ borderRadius: '16px' }}
            >
              Atender Próximo Cliente ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;