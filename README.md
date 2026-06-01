# Clube do Album Feed Worker

Worker responsavel pelo futuro processamento de feed e notificacoes da plataforma Clube do Album.

## Responsabilidade futura

- Consumir eventos sociais.
- Criar itens de feed.
- Gerar notificacoes.
- Processar eventos como USER_FOLLOWED, ALBUM_RATED e REVIEW_CREATED.

## Tecnologias usadas

- Node.js
- TypeScript

## Como rodar localmente

```bash
npm install
npm run dev
```

Status atual: projeto inicial criado apenas com estrutura base. As funcionalidades serão implementadas nas próximas etapas.

## Docker

Crie um arquivo local de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

Build da imagem:

```bash
docker build -t clube-do-album-feed-worker .
```

Execucao local:

```bash
docker run --env-file .env clube-do-album-feed-worker
```
