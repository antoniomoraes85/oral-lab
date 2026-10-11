# Relatório Completo de Testes e Validação — ORAL LAB

Data de Validação: 11/10/2026

## 1. Matriz de Conformidade e Requisitos

| Funcionalidade / Requisito | Cenário de Teste | Status | Validação Técnica |
|---|---|---|---|
| **Detecção de Omissão (Vermelho)** | Pular trechos ou palavras intermediárias | **CONCLUÍDO** | Marcado com `.word.skipped` em vermelho suave (`#c0392b`, background `#fde8e6` e sublinhado ondulado). |
| **Janela de Tolerância (Debounce)** | Micro-hesitação no início da resposta | **CONCLUÍDO** | Tolerância temporal e espacial (3 palavras). Não penaliza hesitação momentânea. |
| **Feedback Sonoro Discreto** | Omissão real confirmada | **CONCLUÍDO** | Gerado via Web Audio API (onda senoidal suave 320Hz→240Hz, volume 0.08, 140ms). Anticascata com intervalo mínimo de 1.8s. |
| **Controle de Mute** | Botão de som na topbar + persistência | **CONCLUÍDO** | Botão interativo `🔔 Som Ativo` / `🔕 Sem Som`, persistido em `localStorage`. |
| **Equivalência Semântica** | Paráfrases válidas e vocabulário equivalente | **CONCLUÍDO** | Mapeamento léxico de sinônimos jurídicos/conceituais + overlap n-grama Jaccard filtrado por stopwords. Exibido em azul `.word.semantic`. |
| **Pontuação Final (Score 0-100)** | Conclusão do treino | **CONCLUÍDO** | Fórmula transparente: `Score = (40% Cobertura) + (35% Aderência) + (15% Retenção sem Omissões) + Bônus Paráfrase`. Dashboard modal de resultados. |
| **Layout & UX Premium** | Foco no Teleprompter + Dock + Insight | **CONCLUÍDO** | Tipografia serifada clássica (Libre Baskerville / Georgia), paleta azul-petróleo e dourado, bordas suaves, sombras profundas e alta hierarquia visual. |
| **Fundo com Efeito Parallax** | Movimento suave com profundidade | **CONCLUÍDO** | 3 camadas com `translate3d` responsivo ao cursor do mouse. Respeita estritamente `prefers-reduced-motion`. |
| **Compatibilidade Mobile** | Telas compactas e touch | **CONCLUÍDO** | Media queries fluidas (dock ajustado com `env(safe-area-inset-bottom)` e navegação horizontal com scroll snap). |
| **Conteúdo Demo Preservado** | 6 questões de Direito das Famílias | **CONCLUÍDO** | As 6 questões canônicas em 3 versões (30s, 90s e completa) continuam 100% íntegras. |
| **Pacote Autocontido (Offline / GH Pages)**| Execução sem servidor | **CONCLUÍDO** | `Oral_Lab_Offline.html` e `index-publicacao.html` compilados e testados com sucesso. |

---

## 2. Testes Automatizados Executados

### 2.1. Testes de Alinhamento e Semântica (`node tests/test_alignment.mjs`)
- `PASS prefixo simples` (avanço: 67%, palavras: 4)
- `PASS acentuação e case` (avanço: 100%, palavras: 4)
- `PASS omissões` (avanço: 88%, palavras: 5)
- `PASS palavras repetidas` (avanço: 40%, palavras: 2)
- `PASS longos saltos` (avanço: 25%, palavras: 2)
- `PASS fala extra` (avanço: 67%, palavras: 4)
- `PASS variação pequena` (avanço: 100%, palavras: 4)
- `PASS correspondência integral`: score 100%
- `PASS detecção de omissão real`: 6 palavras puladas identificadas em vermelho
- `PASS tolerância a hesitação`: 0 falsos positivos em paradas momentâneas
- `PASS equivalência semântica`: overlap = 43%, score = 49%

### 2.2. Teste de Integração DOM Simulado (`node tests/test_dom.mjs`)
- Inicialização de 6 módulos e 7 fontes canônicas
- Alteração entre modos (30s, 90s, completa), edição e persistência local
- Simulação de microfone Web Speech com parciais e pausas
- Conclusão e histórico com armazenamento de score
- Montagem de impressão A4 com 9 seções formatadas
- Criação e exclusão de novos simulados na biblioteca
