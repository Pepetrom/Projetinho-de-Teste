# 🏴‍☠️ Pirate Battle - React & PixiJS Challenge

Um shooter naval 2D desenvolvido com React, TypeScript e PixiJS. O jogador assume o controle de um navio pirata navegando por uma arena, desviando de ilhas e enfrentando navios inimigos ("Shooters" e "Chasers") até o tempo acabar ou sua vida chegar a zero.

## 🚀 O que foi desenvolvido

Durante o tempo estipulado para o desafio, o foco absoluto foi entregar a melhor experiência gráfica e de jogabilidade possível dentro da engine do PixiJS, garantindo uma fundação sólida de código:

- **Arquitetura Desacoplada:** Interface e Menus geridos nativamente em React (para garantir acessibilidade via DOM), enquanto o combate e simulação contínua ocorrem isolados num Canvas WebGL gerenciado pelo PixiJS.
- **Simulação Independente de Framerate (Delta-Time):** Toda a física de movimentação e rotação foi baseada no tempo (`deltaSeconds`), garantindo que o jogo rode na mesma velocidade em monitores de 60Hz ou 144Hz.
- **Sistema Completo de Combate e Entidades:**
  - Jogador com cooldowns independentes para ataque frontal (Espaço) e lateral (Q e E).
  - Inteligência inimiga dupla: *Chasers* perseguem implacavelmente para colidir, enquanto *Shooters* mantêm distância de disparo.
- **Feedback Visual e Game Feel Avançados:** 
  - Texturas dinâmicas: O navio deteriora visualmente dependendo do nível de vida (100%, 66%, 33%).
  - Animações acopladas: Navios abaixo de 33% de vida começam a pegar fogo (AnimatedSprite) de forma orgânica.
  - Efeitos especiais: Explosões animadas na destruição de navios e efeito de "piscar em vermelho" (tint) ao sofrer dano.
- **Auto-pause de Foco:** Utilização das APIs nativas do navegador (`visibilitychange` e `blur`) para pausar a simulação automaticamente caso o jogador troque de aba.

## ⏳ O que eu faria com mais tempo (Próximos Passos)

Em virtude da forte restrição de tempo do desafio, precisei tomar decisões estritas de priorização de produto. Se o prazo fosse estendido, eu focaria nos seguintes passos estruturais:

1. **Integração de Estado Remoto (TanStack Query + MSW):**
   *A infraestrutura de arquitetura previa o uso de React Query com Axios para buscar e hidratar os dados das abas de "Ranking" e "Histórico". A ideia original era criar handlers do Mock Service Worker (MSW) para simular delays e paginação na API, garantindo robustez de rede local. Abandonei essa task nos minutos finais para garantir o deploy.*
2. **Testes E2E com Playwright:**
   *Testar um Canvas contínuo com regressão visual é complexo. Com mais tempo, eu implementaria fixtures no Playwright injetando estados na `window` para testar lógicas determinísticas, além de testar todo o fluxo de formulários, salvamento de Options e navegação de menus.*
3. **Otimização de Colisões:**
   *Substituir a colisão radial/circular simples por uma colisão baseada em SAT (Separating Axis Theorem) ou um grid espacial simples, para que ilhas maiores funcionassem com caixas delimitadoras (AABB) exatas.*

## 🛠️ Como rodar o projeto localmente

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Acesse a porta indicada (normalmente http://localhost:5173) no navegador.
```
