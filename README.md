# 🏆 BotosCodeWars

Ranking mensal do clan **BotosCodeWars** utilizando o Honor acumulado no Codewars.

A proposta é simples: acompanhar a evolução do time mês a mês, mantendo um ranking atual e um histórico das temporadas anteriores, sem backend, banco de dados ou infraestrutura dedicada.

## Como funciona

A pontuação da temporada é calculada com base na diferença entre o Honor atual do usuário e o Honor registrado no início do ciclo.

```text
Pontos da temporada = Honor atual - Honor inicial
```

Exemplo:

```text
Honor no início: 378
Honor atual:     425

Pontuação:        47 pts
```

O Honor oficial continua sendo controlado normalmente pelo Codewars.

O sistema apenas registra um ponto de referência no início de cada temporada.

---

## Ciclo da competição

Cada temporada começa no dia **21** e termina no dia **20 do mês seguinte**.

Exemplo:

```text
21/08 → 20/09
21/09 → 20/10
21/10 → 20/11
```

No dia 21, um GitHub Action:

1. Consulta o Honor atual de todos os participantes.
2. Calcula a pontuação final da temporada.
3. Salva o resultado no histórico.
4. Utiliza o Honor atual como ponto inicial da próxima temporada.
5. Atualiza o `historico.json`.
6. Faz commit automaticamente no repositório.

Todos começam a nova temporada com:

```text
0 pontos
```

---

## Arquitetura

A aplicação foi construída com o mínimo possível de infraestrutura.

```text
                   Codewars API
                        ▲
                        │
             ┌──────────┴──────────┐
             │                     │
        GitHub Pages         GitHub Actions
             │                     │
             ▼                     ▼
         index.html       atualizar-ranking.js
             │                     │
             ├─────────────┐       │
             ▼             │       ▼
          app.js           └─ historico.json
             │
             ▼
        Ranking mensal
```

Utilizamos apenas:

* HTML
* CSS
* JavaScript
* JSON
* GitHub Pages
* GitHub Actions
* API pública do Codewars

Não existe:

* backend próprio;
* banco de dados;
* servidor;
* container;
* GCP;
* AWS;
* API intermediária.

---

## Estrutura do projeto

```text
botos-codewars/
│
├── index.html
├── style.css
├── app.js
├── historico.json
│
├── scripts/
│   └── atualizar-ranking.js
│
└── .github/
    └── workflows/
        └── atualizar-ranking.yml
```

### `index.html`

Estrutura da página.

Contém:

* identificação do clan;
* informações da temporada;
* ranking;
* quantidade de participantes;
* líder atual;
* dias restantes;
* histórico;
* botão de atualização.

---

### `style.css`

Responsável por toda a interface.

A página utiliza uma identidade visual escura inspirada no ambiente de desenvolvimento e no próprio Codewars.

Também possui layout responsivo para celular.

---

### `app.js`

Responsável pelo funcionamento do frontend.

Ao abrir a página:

```text
historico.json
      │
      ▼
participantes
      │
      ▼
Codewars API
      │
      ▼
Honor atual
      │
      ▼
Honor atual - Honor inicial
      │
      ▼
Ranking
```

A consulta de cada usuário é feita diretamente na API pública:

```text
https://www.codewars.com/api/v1/users/{username}
```

Usernames são tratados com:

```javascript
encodeURIComponent(username)
```

para suportar usuários com espaços ou caracteres especiais.

---

## `historico.json`

É a fonte de dados da competição.

Exemplo:

```json
{
  "current": {
    "startDate": "2026-08-21",
    "participants": [
      {
        "name": "Kelwin",
        "codewarsUsername": "KelwinFrederik",
        "initialHonor": 378
      }
    ]
  },
  "history": []
}
```

### `current`

Representa a temporada atual.

```text
current
├── startDate
└── participants
```

Cada participante possui:

```json
{
  "name": "Kelwin",
  "codewarsUsername": "KelwinFrederik",
  "initialHonor": 378
}
```

`name` é o nome mostrado no ranking.

`codewarsUsername` é utilizado para consultar a API.

`initialHonor` é o Honor registrado no início da temporada.

---

## Histórico

Ao final de uma temporada, o resultado é gravado em:

```text
history
```

Exemplo:

```json
{
  "startDate": "2026-08-21",
  "endDate": "2026-09-20",
  "ranking": [
    {
      "name": "Kelwin",
      "username": "KelwinFrederik",
      "points": 120
    }
  ]
}
```

Esse resultado não muda mais.

O histórico representa o ranking final daquele período.

---

# Atualização automática

A automação está definida em:

```text
.github/workflows/atualizar-ranking.yml
```

Ela utiliza GitHub Actions.

O cron utilizado é:

```yaml
cron: "0 3 21 * *"
```

Isso executa no dia 21 de cada mês.

O workflow:

```text
GitHub Action
      │
      ▼
Checkout
      │
      ▼
Node.js
      │
      ▼
scripts/atualizar-ranking.js
      │
      ▼
Codewars API
      │
      ▼
historico.json
      │
      ▼
git commit
      │
      ▼
git push
```

Também existe:

```yaml
workflow_dispatch:
```

permitindo executar a atualização manualmente pela interface do GitHub.

Isso é útil principalmente para testes.

---

# Script de fechamento da temporada

O arquivo:

```text
scripts/atualizar-ranking.js
```

executa a regra da competição.

Para cada participante:

```text
Honor atual
     -
Honor inicial
     =
Pontuação final
```

Depois disso, a temporada é adicionada ao histórico.

O Honor final passa a ser:

```text
initialHonor
```

da próxima temporada.

Exemplo:

```text
Temporada encerrada

Honor inicial: 378
Honor final:   498

Resultado:     120 pts
```

Nova temporada:

```text
initialHonor: 498

Pontuação:
498 - 498 = 0
```

---

# GitHub Pages

O site é publicado utilizando GitHub Pages.

Para habilitar:

1. Abra o repositório.
2. Acesse **Settings**.
3. Entre em **Pages**.
4. Em **Build and deployment**, selecione:

```text
Source:
Deploy from a branch

Branch:
main

Folder:
/ (root)
```

5. Clique em **Save**.

Depois disso, o site ficará disponível normalmente em:

```text
https://SEU-USUARIO.github.io/botos-codewars/
```

---

# Adicionando participantes

Os participantes da temporada ficam em:

```text
historico.json
```

Dentro de:

```text
current.participants
```

Exemplo:

```json
{
  "name": "João",
  "codewarsUsername": "JoaoCodewars",
  "initialHonor": 150
}
```

O `initialHonor` deve representar o Honor existente no momento em que o participante entra na competição.

Assim ele inicia com:

```text
0 pontos
```

e não carrega Honor conquistado anteriormente.

---

# UX/UI

A página foi pensada principalmente para consulta rápida pelo time.

O ranking exibe:

```text
🥇 Jogador
Honor atual · Honor inicial

42
pontos
```

O top 3 recebe destaque visual.

Também são exibidos:

* quantidade de participantes;
* líder atual;
* dias restantes da temporada;
* horário da última atualização;
* link para o perfil do usuário no Codewars.

O histórico fica recolhido por padrão para manter o foco no ranking atual.

---

# Atualização manual

O botão:

```text
↻ Atualizar
```

não modifica nenhum dado do projeto.

Ele apenas executa novamente as consultas à API do Codewars e recalcula o ranking no navegador.

Isso permite que alguém resolva uma Kata e consulte imediatamente a nova pontuação.

---

# Fonte da pontuação

O sistema não possui pontuação própria.

Toda a pontuação depende do Honor fornecido pelo Codewars.

Portanto:

```text
Codewars = fonte do Honor

BotosCodeWars = controle do período
```

Essa separação mantém a solução simples.

---

# Tecnologias

```text
Frontend
├── HTML5
├── CSS3
└── JavaScript

Dados
└── JSON

Automação
├── GitHub Actions
└── Node.js

Hospedagem
└── GitHub Pages

Integração
└── Codewars API
```

---

# Filosofia do projeto

A ideia deste projeto é resolver um problema pequeno com uma solução igualmente pequena.

Em vez de criar:

```text
Frontend
    ↓
Backend
    ↓
Banco
    ↓
Scheduler
    ↓
Cloud
```

utilizamos:

```text
GitHub Pages
      +
GitHub Actions
      +
JSON
      +
Codewars API
```

O resultado é uma aplicação pública, automatizada, praticamente sem custo e com manutenção mínima.

Ou, em termos técnicos:

> Não precisamos de Kubernetes para descobrir quem resolveu mais Kata esse mês. 😄

## Créditos

Projeto desenvolvido por **Kelwin Frederik** para o clan **BotosCodeWars**.

A arquitetura, automação, estrutura do ranking e implementação do frontend foram desenvolvidas com apoio do **ChatGPT (OpenAI)** como coautor técnico durante o processo de definição e construção da solução.
