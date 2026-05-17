# SoundSearch — Rádio Universitária

Projeto desenvolvido para a disciplina de desenvolvimento web do Instituto de Ensino Superior ICEV.

SoundSearch é uma plataforma de descoberta musical que permite buscar músicas, álbuns e artistas via iTunes Search API, ouvir previews de 30 segundos e salvar favoritos em uma playlist pessoal para sugerir à rádio universitária.

---

## Site publicado

[https://sound-search-rose.vercel.app](https://sound-search-rose.vercel.app)

---

## Estrutura do projeto

```
TRABALHO-P2/
├── index.html        # Estrutura HTML da aplicação
├── base.css          # Estilos base: variáveis, layout, header, hero, busca e filtros
├── components.css    # Estilos dos componentes: cards, botões, player, playlist e toast
└── main.js           # Lógica da aplicação e integração com a iTunes Search API
```

---

## Como executar localmente

O projeto é 100% front-end estático, sem dependências ou instalações necessárias.

**Opção 1 — Abrir direto no navegador:**
1. Faça o download ou clone o repositório
2. Abra o arquivo `index.html` no navegador

**Opção 2 — Live Server (recomendado para desenvolvimento):**
1. Instale a extensão **Live Server** no VS Code
2. Clique com o botão direito no `index.html`
3. Selecione **Open with Live Server**

---

## Funcionalidades

- Busca por músicas, álbuns ou artistas via iTunes Search API
- Filtros por tipo de conteúdo e opção de conteúdo explícito
- Página de detalhes com capa, artista, álbum, gênero, duração e preço
- Preview de 30 segundos com controle de play/pause e barra de progresso
- Playlist pessoal com opção de sugerir músicas para a rádio
- Adicionar e remover músicas da playlist

---

## API utilizada

[iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html) — pública, sem necessidade de chave de acesso.

```
https://itunes.apple.com/search?term={busca}&entity={song|album|musicArtist}&country=BR&media=music
```

---

## Integrantes

- Antonio Eduardo Paiva
