# ORAL LAB — Estúdio Premium de Preparação para Provas Orais & Entrevistas

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://antoniomoraes85.github.io/oral-lab/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla%20%2B%20Parallax-blue)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![SpeechRecognition](https://img.shields.io/badge/Web%20Speech%20API-pt--BR-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

Uma plataforma web de alta performance voltada ao treinamento intensivo de sustentação oral, arguições em bancas examinadoras (concursos jurídicos, mestrados e doutorados) e apresentações de alta relevância.

O sistema integra teleprompter adaptativo com reconhecimento de voz contínuo, alinhamento textual progressivo, tolerância temporal a micro-hesitações, detecção precisa de palavras puladas/omitidas com alerta visual em vermelho e feedback sonoro discreto, além de aceitação de paráfrases conceituais por equivalência semântica e pontuação percentual transparente (0 a 100%).

---

## 🎯 Demonstração e Links

- **Aplicação Publicada (GitHub Pages):** [https://antoniomoraes85.github.io/oral-lab/](https://antoniomoraes85.github.io/oral-lab/)
- **Repositório GitHub:** [https://github.com/antoniomoraes85/oral-lab](https://github.com/antoniomoraes85/oral-lab)

---

## 💎 Diferenciais e Funcionalidades

### 1. Detecção Inteligente de Omissões (Palavras Puladas)
- Identifica quando o candidato salta palavras ou passagens cruciais do roteiro.
- **Destaque Visual Preciso:** As palavras omitidas são destacadas em **vermelho** (`#c0392b`) com fundo suave e sublinhado estilizado.
- **Janela de Tolerância & Debounce Temporal:** Micro-hesitações momentâneas ou pausas reflexivas não geram marcações de erro imediatas. Se o candidato retomar o ponto em seguida, o sistema reclassifica o trecho automaticamente.

### 2. Feedback Sonoro Discreto em Omissões
- Som curto, suave e discreto (onda senoidal sintetizada via **Web Audio API** nativa de 320 Hz a 240 Hz em volume sutil, sem dependência de arquivos externos).
- **Mecanismo Anticascata:** Intervalo mínimo inteligente para evitar repetições em disparada caso muitas palavras sejam puladas de uma vez.
- **Controle de Mute:** Botão de alternância de som integrado à barra superior (`🔔 Som Ativo` / `🔕 Sem Som`), com persistência da preferência em `localStorage`.

### 3. Camada de Equivalência Semântica
- Reconhece que respostas orais qualificadas não dependem de repetição robótica palavra por palavra.
- **Abordagem Híbrida no Front-end:**
  - Normalização lexical (remoção de diacríticos, pontuação e caixas).
  - Tabela de sinônimos jurídicos e conceituais (ex.: *cuidado* ↔ *zelo/assistência*, *mulheres* ↔ *feminino/mães*, *trabalho remunerado* ↔ *assalariado/produtivo*, *dissolução* ↔ *separação/divórcio*).
  - Análise de proximidade com distância de Levenshtein restrita (1 erro tolerável para termos longos).
  - Overlap de n-gramas e Jaccard filtrado por stopwords conceituais.
  - Trechos aceitos por equivalência semântica são destacados em azul e computados no resumo final.

### 4. Relatório e Pontuação Final Transparente (0 a 100%)
Ao clicar em **"✓ Concluir ensaio"** ou finalizar o treino, um dashboard modal de desempenho é exibido com:
- **Score Final (%):** Nota percentual ponderada.
- **Cobertura do Roteiro (%):** Percentual de argumentos e palavras da resposta atingidos.
- **Aderência Semântica (%):** Fidelidade conceitual dos termos utilizados.
- **Contagem de Omissões:** Quantidade exata de palavras puladas com exibição das tags dos termos esquecidos.
- **Equivalências Semânticas Aceitas:** Quantidade de paráfrases reconhecidas como corretas.
- **Tempo de Treino e Salvar no Histórico Local.**

#### Fórmula de Pontuação:
$$\text{Score} = (0.45 \times \text{Cobertura}) + (0.35 \times \text{Aderência Semântica}) + (0.20 \times \text{Retenção sem Omissões}) + \text{Bônus Paráfrases}$$

### 5. Layout Premium & Fundo Parallax Sutil
- **Design de Alto Nível:** Estética editorial baseada em tons de azul-petróleo profundo (`#103d46`), superfícies translúcidas com efeito *glassmorphism*, dourado nobre (`#c5a059`) e tipografia serifada clássica (*Libre Baskerville* / *Georgia*).
- **Efeito Parallax:** Três camadas de fundo que reagem de maneira sutil e elegante ao movimento do cursor, proporcionando tridimensionalidade sem comprometer a legibilidade dos textos.
- **Acessibilidade:** Suporte total a `prefers-reduced-motion` (o efeito é automaticamente desligado para usuários sensíveis a movimento).

### 6. Estados Visuais no Teleprompter
- **Verde (`.word.matched`):** Pronunciado corretamente.
- **Vermelho (`.word.skipped`):** Omitido / não identificado após tolerância.
- **Dourado (`.word.current`):** Palavra em foco no momento da fala.
- **Azul (`.word.semantic`):** Paráfrase ou termo equivalente aceito.
- **Pontilhado Neutro (`.word.pending`):** Zona imediata de hesitação.

---

## 📂 Estrutura dos Arquivos

```
oral-lab/
├── index.html              # Estrutura semântica principal com layout premium e camadas parallax
├── styles.css              # Design system completo, temas, tipografia, animações e responsividade
├── app.js                  # Lógica do app, controle de áudio Web Audio API, gravação e teleprompter
├── alignment.js            # Motor de alinhamento com tolerância temporal, sinônimos e score
├── content.js              # 6 Questões canônicas em 3 versões (30s, 90s e completa) + fontes
├── content-data.json       # Dados brutos estruturados das questões
├── manifest.webmanifest    # Manifesto para instalação como PWA (Mobile e Desktop)
├── service-worker.js       # Cache offline para funcionamento instantâneo em PWA
├── index-publicacao.html   # Pacote autocontido compilado para publicação
├── Oral_Lab_Offline.html   # Pacote autocontido para execução offline direta via file://
└── tests/
    ├── test_alignment.mjs  # Testes de unidade do alinhamento, omissões e equivalência semântica
    ├── test_dom.mjs        # Teste de integração do ciclo de vida da interface em DOM simulado
    └── build_offline.py    # Script utilitário para empacotamento dos bundles autocontidos
```

---

## 🛠️ Como Executar Localmente

Como a aplicação é 100% estática e utiliza JavaScript moderno (ES Modules), execute um servidor HTTP simples:

```bash
# Clone o repositório
git clone https://github.com/antoniomoraes85/oral-lab.git
cd oral-lab

# Inicie um servidor local
python -m http.server 8080
# Ou via Node.js
npx serve .
```

Abra no navegador em `http://localhost:8080/`.

> **Nota sobre o Microfone:** A Web Speech API requer ambiente seguro (`HTTPS` ou `localhost`) para permitir o acesso ao microfone no Chrome, Edge e navegadores Android.

---

## 🧪 Executando os Testes Automatizados

```bash
# Teste de alinhamento, omissões e semântica
node tests/test_alignment.mjs

# Teste de integração de interface e DOM
node tests/test_dom.mjs
```

---

## 🚀 Como Publicar no GitHub Pages

O projeto já está configurado na branch `main`:
1. Acesse o repositório no GitHub: `https://github.com/antoniomoraes85/oral-lab`.
2. Vá em **Settings > Pages**.
3. Em **Build and deployment > Branch**, selecione `main` e a pasta `/(root)`.
4. Clique em **Save**. O deploy HTTPS é disparado automaticamente.

---

## 🛡️ Privacidade e Dados

- Todos os simulados criados, edições de roteiro e históricos de treino são armazenados exclusivamente no `localStorage` do seu próprio navegador.
- Não há envio de áudio para servidores próprios ou bancos de dados externos.
- É possível exportar e importar backups completos em formato JSON a qualquer momento pelo menu de configurações.
