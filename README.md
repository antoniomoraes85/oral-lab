# Oral Lab — Estúdio de Provas Orais

Plataforma mobile-first e gratuita para treinar arguições, provas orais, entrevistas acadêmicas e apresentações profissionais.

## Recursos

- Biblioteca de simulados: criar, renomear, excluir e alternar temas de estudo;
- Simulado inicial **Direito das Famílias — Trabalho de cuidado** com as seis perguntas, seis respostas completas e duas versões resumidas por questão fornecidas para a entrevista acadêmica; conteúdo do exemplo separável da identidade do produto;
- Criar, editar e excluir perguntas, incluindo título, enunciado, três roteiros e guia pedagógico;
- Teleprompter com reconhecimento de voz em pt-BR (Web Speech API, quando suportada), modo manual e alinhamento incremental;
- Pausar, retomar, reiniciar; acompanhar duração, avanço estimado e palavras identificadas;
- Treino de memória, mapas mentais, palavras-chave, repescagem e pontos de atenção;
- Salvamento local por dispositivo; backup JSON de todos os simulados; exportação via impressão do navegador para PDF A4.

## Abrir e publicar

- **Sem instalação:** `index-publicacao.html` ou `Oral_Lab_Offline.html`. Para o microfone, prefira HTTPS, pois o reconhecimento de voz pode não operar via `file://`.
- **GitHub Pages:** publique o arquivo `index-publicacao.html` como `index.html` na raiz de uma branch `gh-pages` e escolha `Settings > Pages > Deploy from a branch > gh-pages > /(root)`.
- **Desenvolvimento modular:** `index.html`, `app.js`, `content.js`, `alignment.js`, `styles.css`, `manifest.webmanifest`, `service-worker.js`. Para teste: `python -m http.server 8080` nesta pasta.

## Dados e privacidade

- As respostas e simulados editados ficam em `localStorage` na origem do site. Backups JSON são recomendados antes de limpar dados do navegador ou trocar de dispositivo.
- Não há login nem backend, nem armazenamento de áudio pelo aplicativo.
- A Web Speech API pode transmitir áudio a serviços externos do navegador. O aplicativo solicita consentimento previamente, mas a disponibilidade e tratamento dependem do fabricante.
- O reconhecimento e o alinhamento são aproximações, não avaliação de mérito jurídico ou oratória.

## Fontes do simulado inicial

As perguntas e respostas seguem o material fornecido para a preparação da entrevista. As referências à tese de 2025 e ao Texto para Discussão nº 370 (2026) são preservadas na seção de fontes do exemplo e nas exportações. A referência aos projetos legislativos deve ser conferida em fontes oficiais na data de uso.

## Testes

- `node tests/test_alignment.mjs`
- `node tests/test_dom.mjs` — integrações com DOM simulado. Não é teste físico do microfone.
- `python tests/test_browser.py` — browser real pendente quando a política do ambiente permitir.

## Publicação

O usuário deve ativar o GitHub Pages em `Settings > Pages`. A existência de commit GitHub não confirma que o site HTTPS já esteja ativo.
