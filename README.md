# Clube do Album Feed Worker

Worker responsavel por criar atividades do feed social da plataforma Clube do Album.

## Responsabilidade

- Consumir eventos `ALBUM_RATED` publicados pela Ratings API.
- Criar itens de feed quando um usuario avalia um album.
- Persistir os itens no PostgreSQL.
- Expor endpoints HTTP para consultar o feed.

## Tecnologias usadas

- Node.js
- TypeScript
- Prisma
- PostgreSQL
- RabbitMQ

## Variaveis de ambiente

Crie um arquivo local a partir do exemplo:

```bash
cp .env.example .env
```

Variaveis esperadas:

```env
DATABASE_URL=postgresql://clube:clube@127.0.0.1:15432/clube_do_album_feed
RABBITMQ_URL=amqp://clube:clube@localhost:5672
SERVER_PORT=3003

RABBITMQ_EXCHANGE=clube-do-album.events
ALBUM_RATED_QUEUE=feed.album-rated.queue
ALBUM_RATED_ROUTING_KEY=album.rated
```

## Migrations

Este worker usa o database exclusivo:

```text
clube_do_album_feed
```

Para aplicar as migrations pelo Prisma:

```bash
npx prisma migrate dev
```

Se preferir aplicar manualmente pelo Docker:

```bash
docker exec -i clube-do-album-postgres psql -U clube -d clube_do_album_feed < prisma/migrations/20260601030000_init_feed_schema/migration.sql
```

No PowerShell:

```powershell
Get-Content prisma\migrations\20260601030000_init_feed_schema\migration.sql | docker exec -i clube-do-album-postgres psql -U clube -d clube_do_album_feed
```

Para gerar o Prisma Client:

```bash
npx prisma generate
```

## Como rodar localmente

Instale dependencias:

```bash
npm install
```

Inicie o worker:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

## Endpoints HTTP

### Health check

```http
GET /health
```

Exemplo:

```bash
curl.exe http://localhost:3003/health
```

### Listar feed geral

```http
GET /feed
```

Query params:

```text
limit: quantidade maxima de itens retornados, padrao 20, maximo 100
```

Exemplo:

```bash
curl.exe "http://localhost:3003/feed?limit=20"
```

### Listar feed por usuario

```http
GET /feed/users/{userId}
```

Exemplo:

```bash
curl.exe "http://localhost:3003/feed/users/user-1?limit=10"
```

### Listar feed por album

```http
GET /feed/albums/{albumId}
```

Exemplo:

```bash
curl.exe "http://localhost:3003/feed/albums/uuid-do-album?limit=10"
```

## Evento consumido

```text
Exchange: clube-do-album.events
Tipo: topic
Fila: feed.album-rated.queue
Routing key: album.rated
Evento consumido: ALBUM_RATED
```

Payload esperado:

```json
{
  "event": "ALBUM_RATED",
  "albumId": "uuid-do-album",
  "userId": "uuid-do-usuario",
  "rating": 4.5,
  "occurredAt": "2026-05-31T18:00:00.000Z"
}
```

Ao receber o evento, o worker cria um registro em:

```text
feed_items
```

## Como testar manualmente

No repositorio de infraestrutura:

```bash
docker compose up -d
```

No `clube-do-album-feed-worker`:

```bash
npm install
npx prisma migrate dev
npm run dev
```

Em outro terminal, rode a `clube-do-album-ratings-api` e crie uma avaliacao:

```http
POST /ratings
```

Body:

```json
{
  "albumId": "uuid-do-album",
  "userId": "user-1",
  "rating": 4.5
}
```

O worker deve registrar logs como:

```text
ALBUM_RATED received for feed: albumId=uuid-do-album, userId=user-1
Feed item created for ALBUM_RATED: uuid-do-feed-item
```

Depois confirme no banco:

```sql
select * from feed_items order by created_at desc;
```

## Docker

Build da imagem:

```bash
docker build -t clube-do-album-feed-worker .
```

Execucao em container na network local:

```bash
docker run -d --name clube-do-album-feed-worker \
  --network clube-do-album-network \
  -e SERVER_PORT=3003 \
  -e DATABASE_URL=postgresql://clube:clube@clube-do-album-postgres:5432/clube_do_album_feed \
  -e RABBITMQ_URL=amqp://clube:clube@clube-do-album-rabbitmq:5672 \
  -e RABBITMQ_EXCHANGE=clube-do-album.events \
  -e ALBUM_RATED_QUEUE=feed.album-rated.queue \
  -e ALBUM_RATED_ROUTING_KEY=album.rated \
  -p 3003:3003 \
  clube-do-album-feed-worker
```

## Status atual

Worker consome `ALBUM_RATED`, cria itens de feed em `feed_items` e expoe endpoints HTTP para consulta.
