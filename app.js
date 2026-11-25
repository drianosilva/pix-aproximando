/* Protótipo do momento herói: Pix por aproximação entre celulares.
   Do encostar ao sucesso sincronizado, nos dois papéis (Antônio paga, Cristina recebe).

   Modos (pela URL):
   - sem parâmetros: demonstração com os dois celulares lado a lado (computador, vídeo).
   - ?papel=antonio | ?papel=cristina: um celular por aparelho, sincronizados pelo server.js na rede local.
   - ?papel=antonio&solo=1: um celular só; o outro lado é simulado (para testar sozinho num link público).
   - ?confirmar=a | b | d: como quem paga confirma depois de ver quem recebe (v2, 23/11; ver
     06-v2/diagnostico/04-friccao-e-opcoes.md). A: aproximar de novo (v1). B: tocar e segurar
     "Pagar" na tela. D: manter os celulares perto até a barra completar; afastar antes cancela.

   Princípios aplicados (skills apple-design e emil-design-eng):
   - o arrastar acompanha o dedo 1:1, respeitando onde a pessoa pegou, e pode ser interrompido;
   - ao soltar, a mola herda a velocidade do dedo, e a decisão usa a projeção do movimento;
   - acima do topo, resistência progressiva (rubber band);
   - sucesso: visual, som e vibração no mesmo quadro, nos dois celulares;
   - movimento reduzido: esmaecimento no lugar de deslocamento. */

(() => {
  const params = new URLSearchParams(location.search);
  const PAPEL = params.get('papel');
  const SOLO = params.get('solo') === '1';
  const SALA = params.get('sala') || 'demo';
  const MODO = PAPEL ? 'aparelho' : 'demo';
  const CONFIRMAR = ['a', 'b', 'd'].includes(params.get('confirmar')) ? params.get('confirmar') : 'b';
  // Nível do par (v2): a tecnologia que os DOIS celulares têm em comum decide a experiência, e as duas telas
  // mostram o mesmo nível (P5). iPhone com Android cai em Bluetooth: UWB e NFC entre eles estão a verificar.
  // direcao: UWB com direção e distância (iPhone 11 ou mais novo); distancia: só distância aproximada (Bluetooth,
  // a maioria dos Android no Brasil); contato: só o toque (NFC), sem aproximação gradual.
  const NIVEL = ['direcao', 'distancia', 'contato'].includes(params.get('nivel')) ? params.get('nivel') : 'direcao';
  const SEGURAR_MS = 800; // B: tempo de segurar "Pagar"
  const PERTO_MS = 1500; // D: tempo com os celulares perto para confirmar
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PESSOAS = {
    antonio: { nome: 'Antônio', completo: 'Antônio Almeida', iniciais: 'AA', cpf: 'CPF ***.123.456-** · Mercado Pago' },
    cristina: { nome: 'Cristina', completo: 'Cristina Souza', iniciais: 'CS', cpf: 'CPF ***.456.789-** · Mercado Pago' },
  };
  const VALOR = 'R$ 50,00';

  // ---------- Barra de status do iOS (modo demonstração e vídeo): sinal, Wi-Fi e bateria no desenho do sistema ----------
  const ICONES_IOS = `
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7.5" width="3.2" height="4.5" rx="1"/><rect x="4.8" y="5.2" width="3.2" height="6.8" rx="1"/><rect x="9.6" y="2.7" width="3.2" height="9.3" rx="1"/><rect x="14.4" y="0" width="3.2" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .7C5.2.7 2.7 1.8.8 3.6L2 4.8a8.5 8.5 0 0 1 6-2.4Z"/><path d="M8 5.8c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 4.1 6.8 6.8 0 0 0 3.2 6l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Z"/><path d="M8 9.2c.5 0 .9.2 1.2.5L8 11.6 6.8 9.7c.3-.3.7-.5 1.2-.5Z"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.8" stroke="currentColor" stroke-opacity=".35"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" fill-opacity=".4"/></svg>`;

  // ---------- Ícones (mesmo desenho do pacote Line Icons do Figma, traço 1,5) ----------
  const svg = (d, s = 24, w = 1.5) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONE = {
    voltar: svg('<path d="M4 12h15"/><path d="M10 6 4 12l6 6"/>', 20),
    fechar: svg('<path d="m8 8 8 8"/><path d="m16 8-8 8"/>', 20),
    check: svg('<path d="M20 6.5 9 17.5l-5-5"/>', 16, 2),
    aproximacao: svg('<path d="M9 7.24a4.24 4.24 0 0 1 6 0"/><path d="M5.63 17.37a9 9 0 1 1 12.74 0"/><path d="M10.5 9.62a2.12 2.12 0 0 1 3 0"/><path d="M11.25 19.75h1.5"/><rect x="8.5" y="13" width="7" height="9" rx="1.8"/>', 32),
    setaCima: svg('<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>', 20, 2),
    chevron: svg('<path d="m6 15 6-6 6 6"/>', 24),
    escudo: svg('<path d="M20 13a8 8 0 0 1-16 0V6.9c0-.5.4-.95.9-1A11.5 11.5 0 0 0 11.36 3.2a1 1 0 0 1 1.28 0A11.5 11.5 0 0 0 19.1 5.9c.5.05.9.5.9 1Z"/><path d="m15.3 10.3-4.1 4.2L8.7 12"/>', 24),
    checkGrande: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6.5 9 17.5l-5-5"/></svg>',
  };

  // ---------- Mola (Apple: razão de amortecimento + resposta) ----------
  // k = (2π/resposta)², c = 4π·amortecimento/resposta, massa 1. Integra em subpassos.
  function mola({ de, para, velocidade = 0, amortecimento = 1, resposta = 0.35, aoAtualizar, aoTerminar }) {
    const k = Math.pow((2 * Math.PI) / resposta, 2);
    const c = (4 * Math.PI * amortecimento) / resposta;
    let x = de, v = velocidade, ultimo = performance.now(), parado = false, id;
    const passo = (agora) => {
      if (parado) return;
      let dt = Math.min((agora - ultimo) / 1000, 0.064);
      ultimo = agora;
      const n = Math.ceil(dt / 0.004);
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        const a = -k * (x - para) - c * v;
        v += a * h;
        x += v * h;
      }
      aoAtualizar(x);
      if (Math.abs(x - para) < 0.4 && Math.abs(v) < 6) {
        aoAtualizar(para);
        aoTerminar && aoTerminar();
        return;
      }
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return { parar: () => { parado = true; cancelAnimationFrame(id); }, valor: () => x, velocidade: () => v };
  }

  // Projeção de momento (função da Apple em Designing Fluid Interfaces)
  const projetar = (v, taxa = 0.99) => ((v / 1000) * taxa) / (1 - taxa);
  // Resistência progressiva além do limite
  const elastico = (excesso, dimensao, k = 0.55) => (excesso * dimensao * k) / (dimensao + k * Math.abs(excesso));

  // ---------- Som (Web Audio; um som curto de sucesso, D-009) ----------
  let audio = null;
  let somLigado = true;
  function destravarAudio() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch {}
  }
  function somSucesso() {
    if (!audio || !somLigado) return;
    const t = audio.currentTime + 0.01;
    const saida = audio.createGain();
    saida.gain.value = 0.22;
    saida.connect(audio.destination);
    // duas notas que sobem (sol e dó), ataque curto, cauda de meio segundo
    [[783.99, 0], [1046.5, 0.09]].forEach(([freq, atraso]) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + atraso);
      g.gain.exponentialRampToValueAtTime(1, t + atraso + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + atraso + 0.55);
      o.connect(g).connect(saida);
      o.start(t + atraso);
      o.stop(t + atraso + 0.6);
    });
  }

  // ---------- Vibração (real quando o aparelho deixa; visível sempre) ----------
  // Padrões aproximados da tabela de 03-ui/motion-vibracao-som.md
  const VIBRACOES = {
    busca: { padrao: [6], rotulo: null, barras: [4, 6, 4] },
    conexao: { padrao: [18], rotulo: 'Vibração · conexão', barras: [8, 14, 8] },
    limiar: { padrao: [8], rotulo: 'Vibração · ponto de envio', barras: [5, 9, 5] },
    saida: { padrao: [10, 45, 24], rotulo: 'Vibração · saída', barras: [6, 12, 14] },
    chegada: { padrao: [34], rotulo: 'Vibração · chegada', barras: [14, 14, 14] },
  };
  const rotuloIOS = document.getElementById('haptica-ios');
  function vibrarReal(nome) {
    const p = VIBRACOES[nome].padrao;
    if (navigator.vibrate) return navigator.vibrate(p);
    // iOS 18: tocar no interruptor nativo dá um toque leve. Só costuma funcionar
    // dentro de um gesto da pessoa (encostar, soltar o arraste).
    try {
      rotuloIOS.click();
      if (p.length > 1) setTimeout(() => rotuloIOS.click(), p[0] + p[1]);
    } catch {}
  }

  // ---------- Encostar de verdade: acelerômetro ----------
  // Quando os dois celulares batem de leve um no outro, os dois sentem um tranco curto no mesmo instante.
  // Cada um avisa o servidor; ele só conecta se as duas batidas caírem juntas (server.js).
  // O iPhone só libera o sensor em https e depois de um toque da pessoa.
  const DEBUG = params.get('debug') === '1';
  const LIMIAR = Number(params.get('limiar') || 2.5); // m/s², aceleração sem a gravidade
  const LIMIAR_TRANCO = Number(params.get('tranco') || 1.2); // salto entre duas leituras seguidas
  let aoBater = null;
  let ultimaBatida = 0;
  let anterior = 0;
  let pico = 0;
  function aoMovimento(e) {
    const a = e.acceleration;
    if (!a || a.x === null) return;
    const m = Math.hypot(a.x, a.y, a.z);
    const tranco = m - anterior;
    anterior = m;
    pico = Math.max(pico * 0.97, m);
    if (DEBUG) {
      const d = document.getElementById('debug-sensor');
      if (d) d.textContent = `força ${m.toFixed(1)} · pico ${pico.toFixed(1)} · limiar ${LIMIAR}/${LIMIAR_TRANCO}`;
    }
    const agora = performance.now();
    if (m > LIMIAR && tranco > LIMIAR_TRANCO && agora - ultimaBatida > 1200) {
      ultimaBatida = agora;
      aoBater && aoBater(m, tranco);
    }
  }
  function ligarSensor() {
    if (typeof DeviceMotionEvent === 'undefined') return Promise.resolve('indisponível');
    const ligar = () => { addEventListener('devicemotion', aoMovimento); return 'ok'; };
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // precisa ser chamado direto dentro do toque
      return DeviceMotionEvent.requestPermission().then((r) => (r === 'granted' ? ligar() : 'negado')).catch(() => 'precisa de https');
    }
    return Promise.resolve(ligar());
  }

  // ---------- Canal entre os celulares ----------
  const ouvintes = [];
  const aoEvento = (fn) => ouvintes.push(fn);
  const distribuir = (ev) => ouvintes.forEach((fn) => fn(ev));
  let emitir;
  if (MODO === 'aparelho' && !SOLO) {
    // espera longa: o servidor responde quando acontece algo; pede de novo na hora
    let ultimo = -1;
    const esperar = () =>
      fetch(`/espera?sala=${encodeURIComponent(SALA)}&desde=${ultimo}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then(({ eventos, ultimo: u }) => { ultimo = u; eventos.forEach(distribuir); esperar(); })
        .catch(() => setTimeout(esperar, 800));
    esperar();
    emitir = (ev) =>
      fetch('/evento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ev, sala: SALA }) }).catch(() => {});
  } else {
    // demonstração ou solo: tudo na mesma página
    emitir = (ev) => queueMicrotask(() => distribuir(ev));
  }

  const horaAgora = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  setInterval(() => document.querySelectorAll('[data-relogio]').forEach((n) => (n.textContent = horaAgora())), 15000);

  // ---------- Montagem de um celular ----------
  function criarCelular(papel) {
    const eu = PESSOAS[papel];
    // Teste com pessoas (v2): &cenario=2 no celular de quem paga (nome neutro, porque a pessoa vê o endereço) mostra outra pessoa no lugar da Cristina,
    // para observar se quem paga confere o nome antes de segurar "Pagar". Só muda o que este celular mostra.
    const ERRADA = { nome: 'Carla', completo: 'Carla Souza', iniciais: 'CS', cpf: 'CPF ***.912.034-** · Banco Inter' };
    // B9 (revisora): quem recebe pode ser uma empresa. &recebe=empresa, no celular de quem paga, mostra o titular
    // da conta como o Pix devolve (razão social e CNPJ), com a marca "Empresa". Dados fictícios.
    const EMPRESA = { nome: 'Doces da Cris', completo: 'Doces da Cris Ltda', iniciais: 'DC', cpf: 'CNPJ 12.345.678/0001-90 · Mercado Pago', empresa: true };
    const outro = papel === 'antonio' && params.get('cenario') === '2' ? ERRADA
      : papel === 'antonio' && params.get('recebe') === 'empresa' ? EMPRESA
      : PESSOAS[papel === 'antonio' ? 'cristina' : 'antonio'];
    const paga = papel === 'antonio';
    const el = document.createElement('div');
    el.className = 'celular';
    el.dataset.papel = papel;
    // v2 (direção A): os celulares ficam lado a lado, nunca topo com topo (no iPhone, o topo abre o NameDrop).
    // A luz acende na borda de dentro, onde o outro celular está: à direita de quem paga, à esquerda de quem recebe.
    // No app, com UWB, essa borda seguiria a direção real do outro aparelho. &lado= troca no aparelho.
    const lado = ['esquerda', 'direita'].includes(params.get('lado')) ? params.get('lado') : (paga ? 'direita' : 'esquerda');
    const sinal = lado === 'direita' ? 1 : -1;
    el.dataset.lado = lado;
    el.dataset.nivel = NIVEL;
    el.style.setProperty('--perto', '0');
    // Direção e distância do outro celular (no app: Nearby Interaction com UWB, que dá direção e distância
    // em metros com o app em primeiro plano). A luz fica no ponto da borda que aponta para o outro aparelho,
    // o fundo nasce dali e o contorno do outro celular entra por ali. ux, uy: direção unitária; p: 0 a 1.
    let dirX = sinal, dirY = 0;
    function posicionar(ux, uy, p) {
      const W = el.offsetWidth, H = el.offsetHeight;
      if (!W) return;
      if (NIVEL !== 'direcao') {
        // sem direção: a luz contorna a tela inteira. Só distância: cresce em 4 níveis (o sinal do Bluetooth oscila,
        // e uma luz contínua piscaria). Só contato: nada antes do toque.
        dirX = 0; dirY = 0;
        const nivelLuz = NIVEL === 'distancia' ? Math.round(p * 3) / 3 : 0;
        el.style.setProperty('--aura', nivelLuz.toFixed(3));
        el.style.setProperty('--gx', '50%'); el.style.setProperty('--gy', '50%');
        el.style.setProperty('--perto', '0');
        return;
      }
      const n = Math.hypot(ux, uy) || 1;
      ux /= n; uy /= n;
      dirX = ux; dirY = uy;
      const cx = W / 2, cy = H / 2;
      const t = Math.min(Math.abs(ux) > 1e-3 ? cx / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-3 ? cy / Math.abs(uy) : Infinity);
      const lx = cx + ux * t, ly = cy + uy * t;
      const e = Math.abs(ux) * 75 + Math.abs(uy) * 160; // meia largura do contorno na direção do outro
      const fora = e * (1 - 0.76 * p) + 4;
      const v = {
        '--lx': `${lx}px`, '--ly': `${ly}px`, '--ang': `${(Math.atan2(uy, ux) * 180) / Math.PI}deg`,
        '--gx': `${lx + ux * 40}px`, '--gy': `${ly + uy * 40}px`,
        '--fx': `${lx + ux * fora}px`, '--fy': `${ly + uy * fora}px`, '--perto': p.toFixed(3),
      };
      for (const k in v) el.style.setProperty(k, v[k]);
    }

    // textos que mudam com a opção de confirmação
    const TXT = {
      tituloPaga: CONFIRMAR === 'd' ? 'Aproxime e mantenha perto do celular de quem vai receber' : 'Aproxime o seu celular do celular de quem vai receber',
      tituloRecebe: CONFIRMAR === 'd' ? 'Aproxime e mantenha perto do celular de quem vai pagar' : 'Aproxime o seu celular do celular de quem vai pagar',
      apoioPaga: CONFIRMAR === 'd' ? 'O nome aparece na hora. Afastar antes de completar cancela.' : 'Depois de aproximar, você confere o nome antes de pagar.',
      estadoVer: paga
        ? { a: 'Aproxime de novo para pagar', b: '', d: 'Mantenha perto para pagar' }[CONFIRMAR]
        : { a: 'Aproxime de novo para receber', b: `Esperando ${outro.nome} confirmar`, d: 'Mantenha perto para receber' }[CONFIRMAR],
    };

    // pictograma do gesto: dois celulares lado a lado, telas para cima, luz entre eles
    const GUIA = `
      <div class="guia">
        <svg class="guia-picto" width="56" height="40" viewBox="0 0 56 40" fill="none" aria-hidden="true">
          <rect x="6" y="4" width="18" height="32" rx="4" stroke="currentColor" stroke-width="1.5"/>
          <rect x="32" y="4" width="18" height="32" rx="4" stroke="currentColor" stroke-width="1.5"/>
          <rect x="26.5" y="10" width="3" height="20" rx="1.5" fill="#8f97ff"/>
        </svg>
        <p class="legenda">Lado a lado, com as telas para cima, nunca topo com topo.</p>
      </div>`;
    // NFC: a antena costuma ficar nas costas do aparelho, então o contato é costas com costas (D-017)
    const GUIA_NFC = `
      <div class="guia">
        <svg class="guia-picto" width="56" height="40" viewBox="0 0 56 40" fill="none" aria-hidden="true">
          <rect x="18" y="4" width="9" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <rect x="29" y="4" width="9" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <rect x="26.6" y="12" width="2.8" height="16" rx="1.4" fill="#8f97ff"/>
        </svg>
        <p class="legenda">Costas com costas: a antena fica atrás do celular.</p>
      </div>`;
    // luz da borda de dentro e o contorno do outro celular entrando por ela; os dois seguem --perto (0 a 1)
    const AMBIENTE = '<div class="luz-borda" aria-hidden="true"></div><div class="fantasma" aria-hidden="true"></div><div class="aura" aria-hidden="true"></div>';
    const NUCLEO = `
          <div class="busca" data-encostar role="button" aria-label="Simular aproximar os celulares">
            <span class="anel"></span><span class="anel"></span><span class="anel"></span>
            <span class="nucleo"><span class="nucleo-icone">${ICONE.aproximacao}</span><span class="nucleo-avatar">${outro.iniciais}</span></span>
          </div>`;
    const telaBusca = paga
      ? `
      <section class="tela tela-noite" data-tela="busca" aria-label="Aproximar para pagar">
        ${AMBIENTE}
        <header class="appbar claro"><button class="icone-botao" aria-label="Voltar">${ICONE.voltar}</button><span>Pagar por aproximação</span></header>
        <div class="conteudo">
          <div class="status-linha">
            <span class="chip-ok">${ICONE.check} Pix de ${VALOR} autorizado</span>
            <span class="legenda sec timer oculto" data-timer>Válido por 0:58</span>
          </div>
        </div>
        <div class="centro-busca">${NUCLEO}<p class="valor-busca"><span class="moeda">R$</span>50,00</p></div>
        <div class="espaco"></div>
        <div class="conteudo texto-busca">
          <h1 class="titulo-g">${TXT.tituloPaga}</h1>
          <p class="corpo sec" data-apoio-busca>${TXT.apoioPaga}</p>
          ${NIVEL === 'contato' ? GUIA_NFC : GUIA}
        </div>
        <div class="rodape"><button class="botao texto claro">Cancelar</button></div>
      </section>`
      : `
      <section class="tela tela-noite" data-tela="busca" aria-label="Aproximar para receber">
        ${AMBIENTE}
        <header class="appbar claro"><button class="icone-botao" aria-label="Voltar">${ICONE.voltar}</button><span>Receber por aproximação</span></header>
        <div class="centro-busca">${NUCLEO}</div>
        <div class="espaco"></div>
        <div class="conteudo texto-busca">
          <h1 class="titulo-g">${TXT.tituloRecebe}</h1>
          <p class="corpo sec">Seu nome fica visível só enquanto esta tela estiver aberta.</p>
          ${NIVEL === 'contato' ? GUIA_NFC : GUIA}
        </div>
        <div class="rodape"><button class="botao sobre-cor-sec">Definir um valor</button></div>
      </section>`;

    const cartao = `
      <div class="cartao claro entra" data-cartao>
        <span class="avatar" data-avatar-destino>${outro.iniciais}</span>
        <div><div class="nome">${outro.completo}</div>${outro.empresa ? '<span class="tag-empresa">Empresa</span>' : ''}<div class="legenda">${outro.cpf}</div></div>
      </div>`;

    // Tela cheia em cor com a identidade e o valor grande. Como quem paga confirma depende da opção:
    // A (v1): aproximar de novo, com "Confirmar sem aproximar" como alternativa.
    // B (v2): tocar e segurar "Pagar" por 0,8 s; Enter ou espaço confirmam direto (teclado e leitor de tela).
    // D (v2): manter os celulares perto até a barra completar (1,5 s); afastar antes cancela.
    // Quem recebe nunca confirma nada, em nenhuma opção.
    const rodapePaga = {
      a: '<button class="botao texto claro" data-confirmar>Confirmar sem aproximar</button>',
      b: `<p class="legenda suave centro dica" data-dica>Toque e segure para pagar</p>
          <button class="botao sobre-cor segurar-pagar" data-segurar aria-label="Pagar ${VALOR} para ${outro.completo}"><span class="segurar" aria-hidden="true"></span><span class="rotulo-botao">Pagar ${VALOR}</span></button>`,
      d: '<button class="botao texto claro" data-confirmar>Confirmar sem manter perto</button>',
    }[CONFIRMAR];
    const telaVer = `
      <section class="tela tela-cor ${paga ? 'cor-paga' : 'cor-recebe'}" data-tela="ver" aria-label="${paga ? 'Confirmar o pagamento' : 'Quem está pagando'}">
        <header class="appbar claro"><button class="icone-botao" data-cancelar aria-label="Cancelar">${ICONE.fechar}</button><span><span class="marca-pix">Pix</span> · ${paga ? 'Pagar' : 'Receber'} por aproximação</span></header>
        <div class="conteudo">
          <p class="corpo suave">${paga ? (outro.empresa ? 'Confira se é a empresa que vai receber' : 'Confira se é a pessoa que está com você') : 'Confira quem está pagando'}</p>
          ${cartao}
        </div>
        <div class="espaco"></div>
        <div class="bloco-valor entra" data-bloco aria-live="polite">
          <p class="frase-valor">${paga ? `Você paga para ${outro.nome}` : `${outro.nome} vai te pagar`}</p>
          <p class="valor-xl" data-valor><span class="moeda">R$</span>50,00</p>
          <p class="estado-valor${TXT.estadoVer ? '' : ' oculto'}" data-estado-caixa><span class="preenche" data-preenche aria-hidden="true"></span><span data-estado>${TXT.estadoVer}</span></p>
        </div>
        <div class="espaco"></div>
        <div class="rodape">
          ${paga
            ? rodapePaga
            : `<div class="aviso-claro">${ICONE.escudo}<p class="legenda">Para receber, você não precisa confirmar nada. Se o app pedir sua digital agora, não confirme.</p></div>`}
        </div>
      </section>`;

    const telaSucesso = `
      <section class="tela tela-cor ${paga ? 'cor-paga' : 'cor-recebe'}" data-tela="sucesso" aria-label="${paga ? 'Pago' : 'Recebido'}" aria-live="polite">
        <div style="height:56px"></div>
        <div class="espaco"></div>
        <div class="bloco-valor">
          <span class="avatar-sucesso"><span class="iniciais">${outro.iniciais}</span><span class="check-claro" data-check>${ICONE.checkGrande}</span></span>
          <p class="titulo-xl">${paga ? 'Pago' : 'Recebido'}</p>
          <p class="corpo suave">${paga ? `Pix de ${VALOR} para ${outro.completo}` : `Pix de ${VALOR} de ${outro.completo}`}</p>
          <p class="legenda suave" data-hora>Agora</p>
        </div>
        <div class="espaco"></div>
        <div class="rodape">
          <button class="botao sobre-cor-sec">Ver comprovante</button>
          <button class="botao sobre-cor" data-concluir>Concluir</button>
        </div>
      </section>`;

    el.innerHTML = `
      <div class="barra-status">
        <span class="orelha"><span class="hora" data-relogio>${horaAgora()}</span></span>
        <span class="ilha" aria-hidden="true"></span>
        <span class="orelha"><span class="icones-ios" aria-hidden="true">${ICONES_IOS}</span></span>
      </div>
      <div class="indicador-home" aria-hidden="true"></div>
      <div class="brilho" data-brilho></div>
      <div class="haptica" data-haptica><span class="ondas"><i></i><i></i><i></i></span><span data-haptica-rotulo></span></div>
      ${telaBusca}${telaVer}${telaSucesso}`;

    const $ = (s) => el.querySelector(s);
    const $$ = (s) => [...el.querySelectorAll(s)];
    const telas = Object.fromEntries($$('.tela').map((t) => [t.dataset.tela, t]));

    let estado = 'busca';
    let verDesde = Infinity; // quando a tela de identidade ficou à vista
    let timerSeg = 58;
    let relogio = null;
    let pulso = null;
    let perto = false; // D: os celulares estão perto agora
    let preenchimento = null; // D: animação da barra de confirmação

    function definirEstado(txt) {
      $('[data-estado]').textContent = txt;
      $('[data-estado-caixa]').classList.toggle('oculto', !txt);
    }

    // D: a barra de "mantenha perto" se completa em 1,5 s, nos dois celulares ao mesmo tempo (P5)
    function iniciarPreenchimento() {
      if (CONFIRMAR !== 'd' || estado !== 'ver' || !perto) return;
      const barra = $('[data-preenche]');
      pararPreenchimento(true);
      preenchimento = barra.animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: reduzido() ? 1 : PERTO_MS, easing: 'linear', fill: 'forwards' });
      const concluir = () => {
        if (!perto || estado !== 'ver') return;
        vibrar('limiar');
        if (paga) iniciarEnvio();
      };
      // com movimento reduzido a barra não anda, mas o tempo de confirmação é o mesmo
      if (reduzido()) setTimeout(concluir, PERTO_MS);
      else preenchimento.onfinish = concluir;
    }
    function pararPreenchimento(instantaneo) {
      const barra = $('[data-preenche]');
      if (!preenchimento) return;
      const atual = getComputedStyle(barra).transform;
      preenchimento.cancel();
      preenchimento = null;
      if (!instantaneo && !reduzido()) {
        barra.animate([{ transform: atual }, { transform: 'scaleX(0)' }], { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
    }
    // D: afastar antes de completar cancela, e a tela diz que nada aconteceu
    function cancelarPerto() {
      if (CONFIRMAR !== 'd' || estado !== 'ver') return;
      if (!telas.ver.classList.contains('ativa')) {
        // afastou antes de a pessoa aparecer: volta à busca e explica
        entrarBusca();
        const apoio = $('[data-apoio-busca]');
        if (apoio) apoio.textContent = 'Afastou cedo demais. Aproxime e mantenha perto até completar.';
        return;
      }
      pararPreenchimento(false);
      estado = 'cancelado';
      definirEstado(paga ? 'Afastou antes de completar. Nada foi pago.' : 'Afastou antes de completar. Nada foi recebido.');
      setTimeout(() => { if (estado === 'cancelado') entrarBusca(); }, 1800);
    }
    // depois que a tela de identidade aparece
    function aoVer() {
      if (CONFIRMAR === 'd') iniciarPreenchimento();
    }

    function mostrar(nome) {
      Object.entries(telas).forEach(([k, t]) => t.classList.toggle('ativa', k === nome));
      const colorida = nome === 'ver' || nome === 'sucesso';
      if (colorida) el.dataset.cor = paga ? 'paga' : 'recebe';
      else delete el.dataset.cor;
      if (MODO === 'aparelho') {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = colorida ? (paga ? '#141a7a' : '#0a3a6b') : '#070a26';
      }
    }

    // vibração: real + visível no mesmo instante
    let tempoHaptica;
    function vibrar(nome) {
      vibrarReal(nome);
      const conf = VIBRACOES[nome];
      const caixa = $('[data-haptica]');
      if (!conf.rotulo) return;
      const [prefixo, nomeVib] = conf.rotulo.split(' · ');
      $('[data-haptica-rotulo]').innerHTML = `<span class="prefixo">${prefixo} · </span>${nomeVib}`;
      caixa.querySelectorAll('.ondas i').forEach((i, n) => (i.style.height = conf.barras[n] + 'px'));
      caixa.classList.remove('mostra');
      void caixa.offsetWidth;
      caixa.classList.add('mostra');
      clearTimeout(tempoHaptica);
      tempoHaptica = setTimeout(() => caixa.classList.remove('mostra'), 1100);
    }

    function entrarBusca() {
      estado = 'busca';
      verDesde = Infinity;
      $$('.entra').forEach((n) => { n.style.opacity = ''; n.style.transform = ''; n.style.transition = ''; });
      const bloco = $('[data-bloco]');
      bloco.getAnimations().forEach((an) => an.cancel());
      $('[data-valor]').getAnimations().forEach((an) => an.cancel());
      definirEstado(TXT.estadoVer);
      pararPreenchimento(true);
      perto = false;
      const seg = $('[data-segurar]');
      if (seg) seg.classList.remove('segurando');
      $$('.particula').forEach((n) => n.remove());
      $('[data-tela="busca"] .busca').classList.remove('encontrou');
      $('[data-tela="busca"] .nucleo').style.visibility = '';
      const dest = $('[data-avatar-destino]');
      if (dest) dest.style.opacity = '';
      $$('.avatar-voo').forEach((n) => n.remove());
      const apoio = $('[data-apoio-busca]');
      if (apoio) apoio.textContent = TXT.apoioPaga;
      mostrar('busca');
      timerSeg = 58;
      const t = $('[data-timer]');
      clearInterval(relogio);
      // no modo demonstração o contador não roda: sem o estado "autorização expirada", um 0:00 parado parece defeito
      if (t && MODO !== 'demo') {
        // v2: o tempo só aparece nos últimos 10 s (um cronômetro fixo põe pressão onde a atenção é na outra pessoa)
        t.textContent = 'Válido por 0:58';
        t.classList.add('oculto');
        relogio = setInterval(() => {
          timerSeg = Math.max(0, timerSeg - 1);
          t.textContent = `Válido por 0:${String(timerSeg).padStart(2, '0')}`;
          t.classList.toggle('oculto', timerSeg > 10);
        }, 1000);
      }
      // pulso de vibração "procurando" junto com cada anel (só onde o aparelho deixa vibrar sem gesto)
      clearInterval(pulso);
      pulso = setInterval(() => estado === 'busca' && navigator.vibrate && navigator.vibrate(VIBRACOES.busca.padrao), 1600);
    }

    function conectar() {
      if (estado !== 'busca') return;
      estado = 'ver';
      clearInterval(relogio);
      clearInterval(pulso);
      // no instante do toque: brilho no topo, vibração de conexão, e o centro do radar vira o avatar de quem foi tocado
      const b = $('[data-brilho]');
      b.classList.remove('acende');
      void b.offsetWidth;
      b.classList.add('acende');
      vibrar('conexao');
      const busca = $('[data-tela="busca"] .busca');
      busca.classList.add('encontrou');
      const entrarConteudo = () => {
        // o cartão e a frase entram com mola suave, sem quique (mola/suave)
        $$('.entra').forEach((n, i) => {
          if (reduzido()) {
            n.style.transition = 'opacity 200ms ease';
            n.style.opacity = '1';
            n.style.transform = 'none';
            return;
          }
          setTimeout(() => {
            n.style.opacity = '1';
            mola({ de: -10, para: 0, amortecimento: 1, resposta: 0.3, aoAtualizar: (y) => (n.style.transform = `translateY(${y}px)`) });
          }, 40 + i * 50);
        });
      };
      if (reduzido()) {
        setTimeout(() => { if (estado !== 'ver') return; mostrar('ver'); verDesde = performance.now(); entrarConteudo(); aoVer(); }, MODO === 'demo' ? 180 : 700);
        return;
      }
      // o avatar fica no radar antes de deslizar até o cartão. Na A, quase 1 s: durante a batida ninguém olha a tela.
      // Na B e na D, 0,5 s: a identidade continua à vista na tela seguinte, então o radar não precisa segurar o olhar
      // (teste da v2, 25/11: na B, a aproximação pareceu demorada).
      setTimeout(() => {
        if (estado !== 'ver') return; // afastou durante a espera (D)
        const base = el.getBoundingClientRect();
        const escala = base.width / el.offsetWidth; // no modo demonstração o palco está em escala
        const local = (r) => ({ x: (r.left - base.left) / escala, y: (r.top - base.top) / escala, w: r.width / escala });
        const nucleo = busca.querySelector('.nucleo');
        const de = local(nucleo.getBoundingClientRect());
        nucleo.style.visibility = 'hidden'; // a cópia que voa assume o lugar do original
        // v2 (motion, item 1): a cor da tela nasce do avatar; a pessoa encontrada vira a tela
        const tv = telas.ver;
        const cx = de.x + de.w / 2, cy = de.y + de.w / 2;
        tv.style.transition = 'none';
        mostrar('ver');
        tv.animate(
          [{ clipPath: `circle(${de.w / 2}px at ${cx}px ${cy}px)` }, { clipPath: `circle(150% at ${cx}px ${cy}px)` }],
          { duration: 350, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        ).onfinish = () => { tv.style.transition = ''; };
        verDesde = performance.now();
        aoVer();
        const destino = $('[data-avatar-destino]');
        destino.style.opacity = '0';
        const para = local(destino.getBoundingClientRect());
        para.y += 2; // medido no início da entrada: a tela está 8 px abaixo e o cartão 10 px acima do lugar final
        const voa = document.createElement('div');
        voa.className = 'avatar-voo';
        voa.textContent = outro.iniciais;
        voa.style.width = voa.style.height = `${de.w}px`;
        el.appendChild(voa);
        entrarConteudo();
        mola({
          de: 0, para: 1, amortecimento: 1, resposta: 0.42,
          aoAtualizar: (p) => {
            const x = de.x + (para.x - de.x) * p;
            const y = de.y + (para.y - de.y) * p;
            const s = 1 + (para.w / de.w - 1) * p;
            voa.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
          },
          aoTerminar: () => { destino.style.opacity = ''; voa.remove(); },
        });
      }, MODO === 'demo' ? 260 : CONFIRMAR === 'a' ? 900 : 500);
    }

    // ---------- Segunda aproximação = confirmação ----------
    // Trava: só vale com a identidade à vista há pelo menos 1 s (e, pela batida, com os celulares afastados
    // entre uma aproximação e outra). Evita pagar por acidente com os celulares ainda juntos.
    const TRAVA = 1000;
    function segundaAproximacao() {
      if (estado !== 'ver' || performance.now() - verDesde < TRAVA) return;
      const b = $('[data-brilho]');
      b.classList.remove('acende');
      void b.offsetWidth;
      b.classList.add('acende');
      vibrar('conexao');
      if (paga) iniciarEnvio();
      else { estado = 'recebendo'; definirEstado('Recebendo…'); }
    }

    // v2 (motion, item 2): o valor sai pela borda de dentro de quem paga e entra pela borda de dentro de quem recebe,
    // onde está o outro celular (lado a lado). Cabe nos 700 ms de processamento que já existem: não atrasa o sucesso.
    function iniciarEnvio() {
      if (!paga || estado !== 'ver') return;
      estado = 'enviando';
      definirEstado('Enviando…');
      const valor = $('[data-valor]');
      if (reduzido()) valor.animate([{ opacity: 1 }, { opacity: 0.4 }], { duration: 200, fill: 'forwards' });
      else valor.animate(
        [{ transform: 'translate(0, 0)', opacity: 1, filter: 'blur(0)' }, { transform: `translate(${dirX * 220}px, ${dirY * 220}px) scale(${dirX || dirY ? 1 : 0.85})`, opacity: 0, filter: 'blur(2px)' }],
        { duration: 320, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' });
      emitir({ tipo: 'enviado' });
      // confirmação do "servidor" depois do tempo do momento-assinatura
      setTimeout(() => emitir({ tipo: 'confirmado' }), 700);
    }

    function aoEnviado() {
      if (paga) return;
      estado = 'recebendo';
      pararPreenchimento(true);
      definirEstado('Recebendo…');
      const valor = $('[data-valor]');
      if (reduzido()) valor.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200 });
      else valor.animate(
        [{ transform: `translate(${dirX * 220}px, ${dirY * 220}px) scale(${dirX || dirY ? 1 : 1.15})`, opacity: 0, filter: 'blur(2px)' }, { transform: 'translate(0, 0) scale(1)', opacity: 1, filter: 'blur(0)' }],
        { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }

    // B: tocar e segurar "Pagar" por 0,8 s. Soltar antes desfaz; um toque rápido só mostra a dica.
    let segurarTimer = null;
    let segurarInicio = 0;
    function confirmarB() {
      if (estado !== 'ver') return;
      const falta = TRAVA - (performance.now() - verDesde); // a identidade precisa estar à vista há 1 s
      if (falta > 0) { segurarTimer = setTimeout(confirmarB, falta); return; }
      $('[data-segurar]').classList.remove('segurando');
      vibrar('limiar');
      iniciarEnvio();
    }
    function comecarSegurar() {
      if (estado !== 'ver') return;
      destravarAudio();
      segurarInicio = performance.now();
      $('[data-segurar]').classList.add('segurando');
      clearTimeout(segurarTimer);
      segurarTimer = setTimeout(confirmarB, SEGURAR_MS);
    }
    function soltarSegurar() {
      const botao = $('[data-segurar]');
      if (!botao || !botao.classList.contains('segurando')) return;
      clearTimeout(segurarTimer);
      botao.classList.remove('segurando');
      if (performance.now() - segurarInicio < 300 && !reduzido()) {
        $('[data-dica]').animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
          { duration: 240, easing: 'ease-in-out' });
      }
    }

    // estouro curto, só para quem recebe: sai do próprio check, cores da marca, menos de 0,7 s
    function estouro() {
      if (reduzido()) return;
      const check = $('[data-check]');
      const base = el.getBoundingClientRect();
      const escala = base.width / el.offsetWidth;
      const r = check.getBoundingClientRect();
      const cx = (r.left - base.left + r.width / 2) / escala;
      const cy = (r.top - base.top + r.height / 2) / escala - 8; // a tela ainda está entrando 8 px abaixo
      const cores = ['#7cd3ff', '#f8e44c', '#ffffff', '#c9dcf8'];
      const n = 22;
      for (let i = 0; i < n; i++) {
        const pt = document.createElement('i');
        pt.className = 'particula';
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.25;
        const dist = 64 + Math.random() * 64;
        const tam = 4 + Math.random() * 5;
        pt.style.cssText = `left:${cx}px;top:${cy}px;width:${tam}px;height:${tam}px;background:${cores[i % cores.length]};border-radius:${i % 3 ? '50%' : '2px'}`;
        el.appendChild(pt);
        pt.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 16}px)) scale(1)`, opacity: 0 },
          ],
          { duration: 520 + Math.random() * 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        ).onfinish = () => pt.remove();
      }
    }

    function sucesso() {
      if (estado === 'sucesso') return;
      estado = 'sucesso';
      $('[data-hora]').textContent = `Hoje, ${horaAgora()}`;
      // mesmo quadro: tela, som e vibração (e o estouro, só em quem recebe)
      mostrar('sucesso');
      somSucesso();
      vibrar(paga ? 'saida' : 'chegada');
      if (!paga) estouro();
    }

    // ---------- Eventos ----------
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-encostar]') && estado === 'busca' && CONFIRMAR !== 'd') {
        destravarAudio();
        emitir({ tipo: 'encostar' });
      }
      if (e.target.closest('[data-confirmar]') && estado === 'ver' && performance.now() - verDesde >= TRAVA) {
        destravarAudio();
        vibrar('conexao');
        iniciarEnvio();
      }
      if (e.target.closest('[data-cancelar]') || e.target.closest('[data-concluir]')) emitir({ tipo: 'recomecar' });
    });

    // B: segurar "Pagar" (ponteiro) ou Enter e espaço (teclado e leitor de tela confirmam direto)
    const botaoSegurar = $('[data-segurar]');
    if (botaoSegurar) {
      botaoSegurar.addEventListener('pointerdown', (e) => { try { botaoSegurar.setPointerCapture(e.pointerId); } catch {} comecarSegurar(); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => botaoSegurar.addEventListener(t, soltarSegurar));
      botaoSegurar.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); destravarAudio(); confirmarB(); }
      });
    }

    // D no aparelho: sem sensor de proximidade na web, segurar o radar simula "manter perto"
    if (CONFIRMAR === 'd') {
      const radar = $('[data-encostar]');
      radar.addEventListener('pointerdown', (e) => {
        if (estado !== 'busca') return;
        try { radar.setPointerCapture(e.pointerId); } catch {}
        destravarAudio();
        emitir({ tipo: 'perto' });
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) =>
        radar.addEventListener(t, () => { if (perto) emitir({ tipo: 'afastar' }); }));
    }

    aoEvento((ev) => {
      if (ev.tipo === 'encostar') {
        if (estado === 'busca') conectar();
        else if (estado === 'ver' && CONFIRMAR === 'a') segundaAproximacao();
      }
      if (ev.tipo === 'perto') {
        perto = true;
        if (estado === 'busca') conectar();
        else if (estado === 'ver') iniciarPreenchimento();
      }
      if (ev.tipo === 'afastar') {
        perto = false;
        if (estado === 'ver') cancelarPerto();
      }
      if (ev.tipo === 'enviado') aoEnviado();
      if (ev.tipo === 'confirmado') sucesso();
      if (ev.tipo === 'recomecar') entrarBusca();
    });

    aoBater = (m, tranco) => {
      if (CONFIRMAR === 'd') return; // D precisa de "manter perto", que a batida não mede
      if (CONFIRMAR === 'b' && estado !== 'busca') return; // em B, aproximar de novo não faz nada
      if (estado !== 'busca' && estado !== 'ver') return;
      if (estado === 'ver' && performance.now() - verDesde < TRAVA) return;
      // reconhecimento local imediato: o centro do radar (ou o valor) afunda de leve, como um toque
      const n = estado === 'busca' ? $('[data-tela="busca"] .nucleo') : $('[data-bloco]');
      n.animate([{ scale: '1' }, { scale: '0.96' }, { scale: '1' }], { duration: 160, easing: 'ease-out' });
      if (SOLO) emitir({ tipo: 'encostar', via: 'batida' });
      else emitir({ tipo: 'batida', papel, mag: m, jerk: tranco });
    };

    entrarBusca();
    return { el, conectar, entrarBusca, posicionar: (ux, uy, p) => posicionar(ux, uy, p), sinal };
  }

  // ---------- Montagem da página ----------
  const app = document.getElementById('app');

  // Captura de uma tela parada, para compor o vídeo das mãos (03-ui/primeira-vez-video/v6):
  // ?captura=antonio|cristina&tela=busca|ver|sucesso&perto=0..1&segurar=0..1
  if (params.get('captura')) {
    document.body.classList.add('modo-captura', 'sem-haptica-visivel');
    if (params.get('fantasma') === '0') document.body.classList.add('sem-fantasma'); // no vídeo, o celular de verdade já está ao lado
    const papelCap = params.get('captura') === 'cristina' ? 'cristina' : 'antonio';
    const cel = criarCelular(papelCap);
    app.appendChild(cel.el);
    cel.el.querySelectorAll('[data-relogio]').forEach((n) => (n.textContent = '9:41'));
    const telaCap = params.get('tela') || 'busca';
    const pertoCap = Math.max(0, Math.min(1, Number(params.get('perto') || 0)));
    requestAnimationFrame(() => {
      cel.posicionar(cel.sinal, 0, pertoCap);
      if (telaCap !== 'busca') {
        cel.conectar();
        if (telaCap === 'sucesso') setTimeout(() => emitir({ tipo: 'confirmado' }), 1400);
        // o Chrome sem janela não avança as animações: leva tudo ao estado final antes da foto
        const finalizar = () => {
          document.getAnimations().forEach((an) => { try { an.finish(); } catch {} });
          cel.el.querySelectorAll('.avatar-voo, .particula').forEach((n) => n.remove());
          const dest = cel.el.querySelector('[data-avatar-destino]');
          if (dest) dest.style.opacity = '';
          cel.el.querySelectorAll('.entra').forEach((n) => { n.style.transition = 'none'; n.style.opacity = '1'; n.style.transform = 'none'; });
          cel.el.querySelectorAll('.tela').forEach((t) => { t.style.transition = 'none'; t.style.clipPath = ''; });
          const hora = cel.el.querySelector('[data-hora]');
          if (hora) hora.textContent = 'Hoje, 9:41';
          const seg = Number(params.get('segurar') || 0);
          const f = cel.el.querySelector('[data-segurar] .segurar');
          if (f && seg > 0) { f.style.transition = 'none'; f.style.clipPath = `inset(0 ${(1 - seg) * 100}% 0 0)`; }
        };
        setTimeout(finalizar, 2600);
        setTimeout(finalizar, 3200);
      }
    });
  } else if (MODO === 'demo') {
    document.body.classList.add('modo-demo');
    const OPCOES = { a: 'A · aproximar de novo', b: 'B · segurar "Pagar"', d: 'D · manter perto' };
    const linkOpcao = (k) => { const p = new URLSearchParams(location.search); p.set('confirmar', k); return `?${p}`; };
    const NIVEIS = { direcao: 'Os dois com UWB', distancia: 'iPhone com Android · Bluetooth', contato: 'Dois Android · NFC' };
    const linkNivel = (k) => { const p = new URLSearchParams(location.search); p.set('nivel', k); return `?${p}`; };
    app.innerHTML = `
      <div class="palco">
        <p class="palco-titulo">Pix aproximando os celulares · momento herói · protótipo v2</p>
        <nav class="opcoes" aria-label="Como quem paga confirma">
          <span class="opcoes-rotulo">Confirmação</span>
          ${Object.entries(OPCOES).map(([k, t]) => `<a class="opcao" href="${linkOpcao(k)}" ${k === CONFIRMAR ? 'aria-current="true"' : ''}>${t}</a>`).join('')}
        </nav>
        <nav class="opcoes" aria-label="Tecnologia que os dois celulares têm em comum">
          <span class="opcoes-rotulo">Par de celulares</span>
          ${Object.entries(NIVEIS).map(([k, t]) => `<a class="opcao" href="${linkNivel(k)}" ${k === NIVEL ? 'aria-current="true"' : ''}>${t}</a>`).join('')}
        </nav>
        <div class="dupla" data-dupla>
          <div class="aparelho-demo"><div class="moldura" data-a></div><span class="rotulo">Antônio · paga</span></div>
          <div class="aparelho-demo"><div class="moldura" data-c></div><span class="rotulo">Cristina · recebe</span></div>
        </div>
        <div class="controles">
          <button class="controle principal" data-encostar-tudo>${CONFIRMAR === 'd' ? 'Segure para manter perto' : 'Aproximar os celulares'}</button>
          <span class="dica-palco">ou arraste um celular para qualquer lado</span>
          <button class="controle" data-recomecar>Recomeçar</button>
          <button class="controle" data-haptica-toggle aria-pressed="true">Vibração visível</button>
          <button class="controle" data-som-toggle aria-pressed="true">Som</button>
        </div>
      </div>`;
    const a = criarCelular('antonio');
    const c = criarCelular('cristina');
    app.querySelector('[data-a]').appendChild(a.el);
    app.querySelector('[data-c]').appendChild(c.el);
    const dupla = app.querySelector('[data-dupla]');

    // escala o palco para caber na janela
    const ajustar = () => {
      const s = Math.min(1, (innerHeight - 200) / 840, (innerWidth - 48) / 1000);
      dupla.style.transform = `scale(${s})`;
      dupla.style.marginBottom = `${-(1 - s) * 860}px`;
    };
    addEventListener('resize', ajustar);
    ajustar();

    // ---------- Aproximação em tempo real (v2, direção A) ----------
    // Arraste um celular para qualquer lado: a luz de cada tela fica no ponto da borda que aponta para o outro
    // e cresce com a proximidade, como a direção e a distância do UWB no app. Quando as molduras se tocam,
    // os celulares conectam. Soltar devolve os dois ao lugar com mola, sem quique.
    const [apA, apC] = app.querySelectorAll('.aparelho-demo');
    const celA = a.el, celC = c.el;
    const VAO = 208; // distância entre as molduras no repouso (48 do layout + 80 de cada lado)
    const REPOUSO = { a: { x: -80, y: 0 }, c: { x: 80, y: 0 } };
    const pos = { a: { ...REPOUSO.a }, c: { ...REPOUSO.c } };
    let tocou = false, molaVolta = null, arraste = null, animando = false;
    apA.style.transition = apC.style.transition = 'none';
    const escalaPalco = () => dupla.getBoundingClientRect().width / dupla.offsetWidth || 1;
    const render = () => {
      apA.style.transform = `translate(${pos.a.x}px, ${pos.a.y}px)`;
      apC.style.transform = `translate(${pos.c.x}px, ${pos.c.y}px)`;
      const s = escalaPalco();
      const ma = apA.querySelector('.moldura').getBoundingClientRect(), mc = apC.querySelector('.moldura').getBoundingClientRect();
      const gx = Math.max(0, mc.left - ma.right, ma.left - mc.right) / s;
      const gy = Math.max(0, mc.top - ma.bottom, ma.top - mc.bottom) / s;
      const vao = Math.hypot(gx, gy);
      const p = Math.max(0, Math.min(1, 1 - vao / VAO));
      const luz = p * p; // a luz cresce mais no fim: perto de verdade é que importa
      const ca = celA.getBoundingClientRect(), cc = celC.getBoundingClientRect();
      const ux = (cc.left + cc.width / 2) - (ca.left + ca.width / 2);
      const uy = (cc.top + cc.height / 2) - (ca.top + ca.height / 2);
      a.posicionar(ux, uy, luz);
      c.posicionar(-ux, -uy, luz);
      if (vao <= 1 && !tocou) {
        tocou = true;
        destravarAudio();
        emitir({ tipo: CONFIRMAR === 'd' ? 'perto' : 'encostar', via: 'arrastar' });
      } else if (vao > 24 && tocou) {
        tocou = false;
        if (CONFIRMAR === 'd') emitir({ tipo: 'afastar' });
      }
    };
    // vai de onde estão até um alvo (posições de a e c), com mola sem quique
    const levar = (alvo, resposta = 0.45, depois) => {
      molaVolta && molaVolta.parar();
      const de = { a: { ...pos.a }, c: { ...pos.c } };
      molaVolta = mola({
        de: 0, para: 1000, amortecimento: 1, resposta,
        aoAtualizar: (k) => {
          const t = k / 1000;
          for (const q of ['a', 'c']) { pos[q].x = de[q].x + (alvo[q].x - de[q].x) * t; pos[q].y = de[q].y + (alvo[q].y - de[q].y) * t; }
          render();
        },
        aoTerminar: depois,
      });
    };
    const JUNTOS = { a: { x: 24, y: 0 }, c: { x: -24, y: 0 } };
    const voltar = () => levar(REPOUSO, 0.45);
    requestAnimationFrame(render);
    addEventListener('resize', () => requestAnimationFrame(render));

    // arrastar em qualquer direção; só depois de 6 px (histerese), para os toques nas telas continuarem funcionando
    dupla.addEventListener('pointerdown', (e) => {
      const emA = e.target.closest('[data-a]'), emC = e.target.closest('[data-c]');
      if ((!emA && !emC) || e.target.closest('button, [data-segurar]') || animando) return;
      const q = emA ? 'a' : 'c';
      arraste = { q, x: e.clientX, y: e.clientY, p0: { ...pos[q] }, ativo: false, id: e.pointerId };
    });
    dupla.addEventListener('pointermove', (e) => {
      if (!arraste || e.pointerId !== arraste.id) return;
      const s = escalaPalco();
      const dx = (e.clientX - arraste.x) / s, dy = (e.clientY - arraste.y) / s;
      if (!arraste.ativo) {
        if (Math.hypot(dx, dy) < 6) return;
        arraste.ativo = true;
        try { dupla.setPointerCapture(e.pointerId); } catch {}
        molaVolta && molaVolta.parar();
        dupla.classList.add('arrastando');
      }
      pos[arraste.q].x = arraste.p0.x + dx;
      pos[arraste.q].y = Math.max(-300, Math.min(300, arraste.p0.y + dy));
      render();
    });
    const fimArraste = () => {
      if (!arraste) return;
      const estava = arraste.ativo;
      arraste = null;
      dupla.classList.remove('arrastando');
      if (estava) voltar();
    };
    ['pointerup', 'pointercancel'].forEach((t) => dupla.addEventListener(t, fimArraste));

    // aproximação pedida de outro lugar (botão ou toque no radar): os dois se juntam e voltam
    const aproximarEVoltar = () => {
      if (animando || arraste) return;
      animando = true;
      destravarAudio();
      levar(JUNTOS, reduzido() ? 0.05 : 0.7, () => setTimeout(() => { animando = false; voltar(); }, 420));
    };
    aoEvento((ev) => {
      if (ev.tipo === 'encostar' && ev.via !== 'arrastar') aproximarEVoltar();
      if (ev.tipo === 'recomecar' && !arraste) voltar();
    });

    const botaoEncostar = app.querySelector('[data-encostar-tudo]');
    if (CONFIRMAR === 'd') {
      let segurando = false;
      const segurar = () => { segurando = true; destravarAudio(); levar(JUNTOS, 0.6); };
      const soltar = () => { if (segurando) { segurando = false; voltar(); } };
      botaoEncostar.addEventListener('pointerdown', (e) => {
        try { botaoEncostar.setPointerCapture(e.pointerId); } catch {}
        segurar();
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => botaoEncostar.addEventListener(t, soltar));
      botaoEncostar.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !segurando) { e.preventDefault(); segurar(); }
      });
      botaoEncostar.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') soltar(); });
    } else {
      // um clique faz a aproximação inteira, devagar o bastante para a luz ser vista crescendo
      botaoEncostar.addEventListener('click', aproximarEVoltar);
    }
    app.querySelector('[data-recomecar]').addEventListener('click', () => emitir({ tipo: 'recomecar' }));
    app.querySelector('[data-haptica-toggle]').addEventListener('click', (e) => {
      const ligado = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(ligado));
      document.body.classList.toggle('sem-haptica-visivel', !ligado);
    });
    app.querySelector('[data-som-toggle]').addEventListener('click', (e) => {
      somLigado = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(somLigado));
    });
  } else {
    document.body.classList.add('modo-aparelho');
    const papel = PAPEL === 'cristina' ? 'cristina' : 'antonio';
    const cel = criarCelular(papel);
    app.appendChild(cel.el);
    // no aparelho, uma página web não mede a distância nem a direção: a luz fica na borda de dentro e só respira
    const posicionarAparelho = () => cel.posicionar(cel.sinal, 0, 0);
    requestAnimationFrame(posicionarAparelho);
    addEventListener('resize', posicionarAparelho);
    if (params.get('haptica') === '0') document.body.classList.add('sem-haptica-visivel');

    // no modo solo, o outro celular é simulado
    if (SOLO) {
      // no papel da Cristina, simula o Antônio: depois do encontro, ele aproxima de novo e envia
      let simulando = false;
      let timerD = null;
      aoEvento((ev) => {
        if (papel !== 'cristina') return;
        if (CONFIRMAR === 'd') {
          // o Antônio simulado conclui quando a barra completa; afastar antes cancela
          if (ev.tipo === 'perto') {
            clearTimeout(timerD);
            timerD = setTimeout(() => {
              emitir({ tipo: 'enviado' });
              setTimeout(() => emitir({ tipo: 'confirmado' }), 700);
            }, 500 + PERTO_MS);
          }
          if (ev.tipo === 'afastar') clearTimeout(timerD);
          return;
        }
        if (ev.tipo !== 'encostar' || simulando) return;
        simulando = true;
        setTimeout(() => {
          if (CONFIRMAR === 'a') emitir({ tipo: 'encostar' }); // A: o Antônio aproxima de novo
          setTimeout(() => emitir({ tipo: 'enviado' }), 300);
          setTimeout(() => { emitir({ tipo: 'confirmado' }); simulando = false; }, 1000);
        }, 2800);
      });
    }

    // tela de início: o toque destrava som e vibração no iPhone
    const inicio = document.createElement('div');
    inicio.className = 'inicio';
    inicio.innerHTML = `
      <span class="papel">${papel === 'antonio' ? 'Antônio · paga' : 'Cristina · recebe'}</span>
      <h1 class="titulo-g">Pix aproximando os celulares</h1>
      <p class="corpo sec">${params.get('teste') === '1' ? 'Toque para começar.' : `Protótipo do momento herói (confirmação ${CONFIRMAR.toUpperCase()}). Toque para começar.`}</p>`;
    cel.el.appendChild(inicio);
    const st = document.createElement('div');
    st.id = 'estado-sensor';
    st.className = 'estado-sensor';
    cel.el.appendChild(st);
    if (DEBUG) {
      const d = document.createElement('div');
      d.id = 'debug-sensor';
      d.className = 'estado-sensor debug';
      cel.el.appendChild(d);
    }
    inicio.addEventListener('click', () => {
      ligarSensor().then((r) => {
        const st = document.getElementById('estado-sensor');
        if (st) st.textContent = CONFIRMAR === 'd'
          ? 'Manter perto: segure o radar'
          : r === 'ok' ? 'Aproximar: sensor ligado' : `Aproximar: toque no radar (sensor ${r})`;
      });
      destravarAudio();
      vibrarReal('conexao');
      inicio.style.transition = 'opacity 200ms ease';
      inicio.style.opacity = '0';
      setTimeout(() => inicio.remove(), 210);
    });
  }
})();
