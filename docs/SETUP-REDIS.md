# Redis Setup for Local Development

Redis is used as a simple job queue for local development, allowing you to test video processing without setting up Google Cloud Pub/Sub.

## What Redis Does in Layer

- **Local Development**: Video upload → Job queued in Redis → Worker processes video
- **Production**: Video upload → Job queued in Google Cloud Pub/Sub → Worker processes video

## Installation Options

### Option 1: Docker (Recommended)

```bash
# Run Redis in a Docker container
docker run --name layer-redis -p 6379:6379 -d redis:7-alpine

# View logs
docker logs layer-redis

# Stop Redis
docker stop layer-redis

# Start Redis again
docker start layer-redis
```

### Option 2: Homebrew (macOS)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Stop Redis service
brew services stop redis

# Connect to Redis CLI
redis-cli
```

### Option 3: Direct Installation (Linux/macOS)

```bash
# Download and compile Redis
wget https://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make

# Start Redis server
src/redis-server

# In another terminal, connect to Redis
src/redis-cli
```

## Configuration

The default Redis configuration works for development:
- **Host**: `localhost`
- **Port**: `6379`
- **No password** (for local development)

Your `.env` file should have:
```env
REDIS_URL="redis://localhost:6379"
```

## Testing Redis Connection

### Using Redis CLI
```bash
# Connect to Redis
redis-cli

# Test basic operations
127.0.0.1:6379> SET test "Hello Redis"
OK
127.0.0.1:6379> GET test
"Hello Redis"
127.0.0.1:6379> DEL test
(integer) 1
127.0.0.1:6379> QUIT
```

### Using Node.js (in your project)
```javascript
// Test Redis connection
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

redis.set('test', 'Hello from Node.js')
  .then(() => redis.get('test'))
  .then(result => {
    console.log('Redis test:', result);
    redis.disconnect();
  })
  .catch(console.error);
```

## How It's Used in Layer

The job queue system in `lib/queue.ts` automatically chooses between Redis (local) and Pub/Sub (production):

```javascript
// Simplified example from lib/queue.ts
if (process.env.NODE_ENV === 'production') {
  // Use Google Cloud Pub/Sub
  await pubSubTopic.publishMessage({
    json: { jobId, videoPath, personaId }
  });
} else {
  // Use Redis for local development
  await redis.lpush('video-processing-queue', JSON.stringify({
    jobId, videoPath, personaId
  }));
}
```

## Queue Operations

### Add Job to Queue
```bash
redis-cli LPUSH video-processing-queue '{"jobId":"123","videoPath":"/tmp/video.mp4","personaId":"456"}'
```

### View Queue Length
```bash
redis-cli LLEN video-processing-queue
```

### View All Jobs in Queue
```bash
redis-cli LRANGE video-processing-queue 0 -1
```

### Process Job (Pop from Queue)
```bash
redis-cli RPOP video-processing-queue
```

### Clear Queue
```bash
redis-cli DEL video-processing-queue
```

## Development Workflow

1. **Start Redis**:
   ```bash
   docker run --name layer-redis -p 6379:6379 -d redis:7-alpine
   ```

2. **Start your Next.js app**:
   ```bash
   npm run dev
   ```

3. **Upload a video** through the web interface

4. **Check the queue**:
   ```bash
   redis-cli LLEN video-processing-queue
   ```

5. **Run the worker** (when you build it):
   ```bash
   node worker/video-processor.js
   ```

## Production vs Development

| Environment | Queue System | Setup |
|-------------|--------------|-------|
| **Development** | Redis | `docker run redis` |
| **Production** | Google Cloud Pub/Sub | Create topic in GCP |

## Monitoring Redis

### View Redis Stats
```bash
redis-cli INFO
```

### Monitor Commands in Real-time
```bash
redis-cli MONITOR
```

### Check Memory Usage
```bash
redis-cli INFO memory
```

## Troubleshooting

### Redis Not Starting
```bash
# Check if Redis is running
redis-cli ping
# Should return "PONG"

# Check what's using port 6379
lsof -i :6379

# Kill existing Redis processes
pkill redis-server
```

### Connection Issues
```bash
# Test connection with telnet
telnet localhost 6379

# Check Redis logs (Docker)
docker logs layer-redis
```

### Clear All Data
```bash
redis-cli FLUSHALL
```

## Next Steps

1. Choose an installation method (Docker recommended)
2. Start Redis
3. Test the connection
4. Your Layer app will automatically use Redis for local development queues

When you're ready for production, you'll switch to Google Cloud Pub/Sub by setting the appropriate environment variables. 