# Clube do Album Feed Worker

Worker responsavel por criar atividades do feed social da plataforma Clube do Album.

## Responsabilidade

- Consumir eventos `ALBUM_RATED` publicados pela Ratings API.
- Consumir eventos `USER_FOLLOWED` publicados pela Social API.
- Criar itens de feed quando um usuario avalia um album.
- Criar itens de feed quando um usuario segue outro.
- Enriquecer mensagens do feed usando Catalog API e Identity API.
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
CATALOG_API_URL=http://localhost:3001
IDENTITY_API_URL=http://localhost:8081

RABBITMQ_EXCHANGE=clube-do-album.events
RABBITMQ_DEAD_LETTER_EXCHANGE=clube-do-album.dead-letter
ALBUM_RATED_QUEUE=feed.album-rated.queue
ALBUM_RATED_ROUTING_KEY=album.rated
USER_FOLLOWED_QUEUE=feed.user-followed.queue
USER_FOLLOWED_ROUTING_KEY=user.followed
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
Get-Content prisma\migrations\20260602090000_add_user_followed_feed_items\migration.sql | docker exec -i clube-do-album-postgres psql -U clube -d clube_do_album_feed
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

## Eventos consumidos

## Dead Letter Queues

As filas consumidas por este worker usam dead letter para mensagens rejeitadas com `nack(..., false, false)`.

```text
Dead letter exchange: clube-do-album.dead-letter
Tipo: direct
Filas:
  feed.album-rated.queue.dlq
  feed.user-followed.queue.dlq
Routing keys:
  feed.album-rated.queue.dead
  feed.user-followed.queue.dead
```

Se as filas principais ja existirem no RabbitMQ sem argumentos de dead letter, recrie as filas antes de subir a nova versao do worker.

### ALBUM_RATED

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

### USER_FOLLOWED

```text
Exchange: clube-do-album.events
Tipo: topic
Fila: feed.user-followed.queue
Routing key: user.followed
Evento consumido: USER_FOLLOWED
```

Payload esperado:

```json
{
  "event": "USER_FOLLOWED",
  "followerId": "uuid-do-seguidor",
  "followedId": "uuid-do-seguido",
  "occurredAt": "2026-05-31T18:00:00.000Z"
}
```

Ao receber os eventos, o worker cria registros em:

```text
feed_items
```

O worker tenta enriquecer as mensagens consultando:

```text
Catalog API: dados do album
Identity API: dados dos usuarios
```

Se algum servico interno estiver indisponivel, o worker usa o ID recebido no evento como fallback e continua processando a mensagem.

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
USER_FOLLOWED received for feed: followerId=user-1, followedId=user-2
Feed item created for USER_FOLLOWED: uuid-do-feed-item
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
  -e CATALOG_API_URL=http://clube-do-album-catalog-api:3001 \
  -e IDENTITY_API_URL=http://clube-do-album-identity-api:8081 \
  -e RABBITMQ_EXCHANGE=clube-do-album.events \
  -e RABBITMQ_DEAD_LETTER_EXCHANGE=clube-do-album.dead-letter \
  -e ALBUM_RATED_QUEUE=feed.album-rated.queue \
  -e ALBUM_RATED_ROUTING_KEY=album.rated \
  -e USER_FOLLOWED_QUEUE=feed.user-followed.queue \
  -e USER_FOLLOWED_ROUTING_KEY=user.followed \
  -p 3003:3003 \
  clube-do-album-feed-worker
```

## Status atual

Worker consome `ALBUM_RATED` e `USER_FOLLOWED`, enriquece mensagens com Catalog/Identity quando possivel, cria itens de feed em `feed_items` e expoe endpoints HTTP para consulta.
