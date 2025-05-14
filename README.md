# Topcoder NestJS Autopilot

## Prerequisites
- Docker
- Node.js 18+
- npm
- A Kafka tool (e.g., kcat or Offset Explorer 3.0.2)

## Setup
1. Clone the repository.
2. Ensure `tsconfig.json` and `tsconfig.build.json` are in the project root.
3. Copy `.env.example` to `.env` and configure the required values.
4. Run `npm install` to install dependencies.
5. Install `class-validator`, `class-transformer`, and `joi` for DTO validation:
   ```
   npm install class-validator class-transformer joi
   ```
6. Run `docker-compose up` to start the services.
7. The application will be available at `http://localhost:3000`.

## Environment Variables
```
PORT=3000
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=autopilot-client
KAFKA_GROUP_ID=autopilot-group
AUTH_KAFKA_API_URL=https://kafka.api.example.com
AUTH_KAFKA_CLIENT_ID=your_kafka_client_id
AUTH_KAFKA_CLIENT_SECRET=your_kafka_client_secret
AUTH_TOPCODER_API_URL=https://api.topcoder.com
AUTH_TOPCODER_CLIENT_ID=your_topcoder_client_id
AUTH_TOPCODER_CLIENT_SECRET=your_topcoder_client_secret
```

## Development
- Run `npm run start:dev` for development with hot reloading.
- Run `npm run lint` to check code style.
- Run `npm run format` to format code.

## Core Services
- **ConfigService**: Loads and validates environment variables using Joi.
- **KafkaService**: Handles Kafka producer and consumer operations with retries and graceful shutdown.
- **AuthService**: Provides mock authentication token retrieval for Kafka and Topcoder APIs.
- **HealthService**: Supports health checks via the `/health` endpoint.

## Health Check
Access `http://localhost:3000/health` to check application status. Expected response:
```json
{
  "status": "ok",
  "kafka": "connected",
  "timestamp": "2025-05-14T..."
}
```

## Testing Kafka
1. **Install a Kafka Tool**:
   - Download `kcat` from https://github.com/edenhill/kcat/releases for your platform.
   - Alternatively, download Offset Explorer 3.0.2 from https://www.kafkatool.com/ for Windows, macOS, or Linux.

2. **Configure Offset Explorer** (if using):
   - Open Offset Explorer and click **Add Cluster** or go to **File > Add New Connection**.
   - In the **Properties** tab:
     - **Cluster Name**: `LocalKafkaCluster`
     - **Kafka Version**: Select `2.8.0` or higher (compatible with Confluent 7.3.0).
     - **Bootstrap Servers**: `localhost:9093`
     - **Zookeeper Host/Port**: `localhost:2181`
     - **Chroot Path**: Leave as `/` (default).
   - In the **Security** tab:
     - **Broker Security Type**: `PLAINTEXT`
     - **Zookeeper Security Type**: `PLAINTEXT`
   - In the **Advanced** and **JAAS Config** tabs, leave defaults unless specific settings are required.
   - Click **Test** to verify the connection. If successful, click **Add** to save the cluster.
   - If the connection fails, check:
     - Docker containers are running: `docker ps`.
     - Ports are accessible: `telnet localhost 9093` and `telnet localhost 2181`.
     - Kafka and Zookeeper logs: `docker logs <kafka-container-name>` and `docker logs <zookeeper-container-name>`.

3. **Create Test Messages**:
   - **Phase Transition** (`autopilot.phase.transition.json`):
     ```json
     {
       "topic": "autopilot.phase.transition",
       "originator": "external_source",
       "timestamp": "2025-05-14T21:04:00Z",
       "mime-type": "application/json",
       "payload": {
         "date": "2025-05-14T21:04:00Z",
         "projectId": 30096982,
         "phaseId": 1027596,
         "phaseTypeName": "Registration",
         "state": "END",
         "operator": "22841596",
         "projectStatus": "Active"
       }
     }
     ```
   - **Challenge Update** (`autopilot.challenge.update.json`):
     ```json
     {
       "topic": "autopilot.challenge.update",
       "originator": "external_source",
       "timestamp": "2025-05-14T21:04:00Z",
       "mime-type": "application/json",
       "payload": {
         "date": "2025-05-14T21:04:00Z",
         "projectId": 30096982,
         "challengeId": 123456,
         "status": "Active",
         "operator": "22841596"
       }
     }
     ```
   - **Command** (`autopilot.command.json`):
     ```json
     {
       "topic": "autopilot.command",
       "originator": "external_source",
       "timestamp": "2025-05-14T21:04:00Z",
       "mime-type": "application/json",
       "payload": {
         "date": "2025-05-14T21:04:00Z",
         "command": "START_CHALLENGE",
         "operator": "22841596",
         "projectId": 30096982
       }
     }
     ```

4. **Send Test Messages**:
   - **Using kcat**:
     ```bash
     kcat -b localhost:9093 -t autopilot.phase.transition -P -T -l message.json
     kcat -b localhost:9093 -t autopilot.challenge.update -P -T -l challenge-update.json
     kcat -b localhost:9093 -t autopilot.command -P -T -l command.json
     ```
     - Note: Ensure `kcat` is installed and accessible in your PATH.
   - **Using Offset Explorer**:
     - Expand `LocalKafkaCluster`, select the topic (e.g., `autopilot.phase.transition`), and choose Partition 0.
     - In the **Data** tab, click the **plus button** and select **Add Single Message**.
     - Set **Key Content Type** to `No key`.
     - Set **Value Content Type** to `String`.
     - Paste the respective JSON content into the textarea.
     - Click the **play button** to send the message.
     - Repeat for each topic.
     - If pasting fails, type the JSON manually, drag-and-drop the file, or use **File** > **Import** (if available).

5. **Verify Message Receipt**:
   - Check application logs:
     ```bash
     docker-compose logs app
     ```
   - Expected logs for `autopilot.phase.transition`:
     ```bash
     Received phase transition on autopilot.phase.transition partition 0: {
       date: '2025-05-14T21:04:00Z',
       projectId: 30096982,
       phaseId: 1027596,
       phaseTypeName: 'Registration',
       state: 'END',
       operator: '22841596',
       projectStatus: 'Active'
     }
     Validated phase transition: {
       date: '2025-05-14T21:04:00Z',
       projectId: 30096982,
       phaseId: 1027596,
       phaseTypeName: 'Registration',
       state: 'END',
       operator: '22841596',
       projectStatus: 'Active'
     }
     ```
   - Expected logs for `autopilot.challenge.update`:
     ```bash
     Received challenge update on autopilot.challenge.update partition 0: {
       date: '2025-05-14T21:04:00Z',
       projectId: 30096982,
       challengeId: 123456,
       status: 'Active',
       operator: '22841596'
     }
     Validated challenge update: {
       date: '2025-05-14T21:04:00Z',
       projectId: 30096982,
       challengeId: 123456,
       status: 'Active',
       operator: '22841596'
     }
     ```
   - Expected logs for `autopilot.command`:
     ```bash
     Received command on autopilot.command partition 0: {
       date: '2025-05-14T21:04:00Z',
       command: 'START_CHALLENGE',
       operator: '22841596',
       projectId: 30096982
     }
     Validated command: {
       date: '2025-05-14T21:04:00Z',
       command: 'START_CHALLENGE',
       operator: '22841596',
       projectId: 30096982
     }
     ```

## Troubleshooting
- **Docker Build Issues**:
  - If `docker-compose up --build` fails with a TLS handshake timeout:
    - Log into Docker Hub: `docker login`.
    - Pull images manually: `docker pull node:18.20.4`, `docker pull confluentinc/cp-kafka:7.3.0`, `docker pull confluentinc/cp-zookeeper:7.3.0`.
    - Update `Dockerfile` to use a specific tag: `FROM node:18.20.4`.
    - Check network connectivity: `curl -I https://auth.docker.io`.
    - Run without rebuilding if images are cached: `docker-compose up`.
- **Kafka Connection Issues**:
  - If logs show `ECONNREFUSED` or `ENOTFOUND` for `kafka:9092`:
    - Verify `KAFKA_BROKERS=kafka:9092` in `.env` (no `localhost:9092`).
    - Check Kafka container status: `docker ps` and `docker logs <kafka-container-name>`.
    - Ensure Kafka is healthy: `docker exec -it <kafka-container-name> kafka-broker-api-versions --bootstrap-server localhost:9093`.
    - Verify Docker network: `docker network inspect bridge`.
  - If Kafka logs show a listener port conflict:
    - Ensure `KAFKA_ADVERTISED_LISTENERS` uses unique ports (e.g., `PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093`).
    - Update `KAFKA_LISTENERS` to match (e.g., `PLAINTEXT://0.0.0.0:9092,PLAINTEXT_HOST://0.0.0.0:9093`).
- **Kafka Consumer Issues**:
  - If logs show `The group coordinator is not available`:
    - Ensure Kafka is fully started before the app (handled by `depends_on` with `service_healthy`).
    - Increase `retries` and `initialRetryTime` in `kafka.service.ts` (e.g., `retries: 10`, `initialRetryTime: 1000`).
  - If logs show rebalancing or unsubscribed topics:
    - Verify unique `groupId`s in `autopilot.service.ts` (`autopilot-phase-group`, `autopilot-challenge-group`, `autopilot-command-group`).
  - If logs show `Invalid phase transition payload` or similar:
    - Ensure the payload matches the Joi schema in `autopilot.service.ts`.
    - Phase transition schema expects:
      ```json
      {
        "projectId": number,
        "phaseId": number,
        "phaseTypeName": string,
        "state": "START" or "END",
        "operator": string,
        "projectStatus": string,
        "date": optional ISO date string
      }
      ```
    - Challenge update schema expects:
      ```json
      {
        "projectId": number,
        "challengeId": number,
        "status": string,
        "operator": string,
        "date": optional ISO date string
      }
      ```
    - Command schema expects:
      ```json
      {
        "command": string,
        "operator": string,
        "projectId": optional number,
        "date": optional ISO date string
      }
      ```
  - If logs repeat indefinitely (infinite loop):
    - Ensure `handlePhaseTransition` skips producing messages with `originator: 'auto_pilot'`.
    - Reset the topic or consumer offset to clear old messages:
      ```bash
      docker exec -it <kafka-container-name> kafka-topics --bootstrap-server localhost:9093 --delete --topic autopilot.phase.transition
      docker exec -it <kafka-container-name> kafka-topics --bootstrap-server localhost:9093 --create --topic autopilot.phase.transition --partitions 1 --replication-factor 1
      ```
- **Offset Explorer Issues**:
  - If you can’t paste in the Data tab:
    - Ensure produce mode is active (click **plus button** > **Add Single Message**).
    - Try keyboard shortcuts (`Cmd+V` on macOS, `Ctrl+V` on Windows/Linux) or drag-and-drop the JSON file.
    - Restart Offset Explorer or try version 2.x from https://www.kafkatool.com/.
    - Use `kcat` as a fallback: `kcat -b localhost:9093 -t <topic> -P -T -l <file>.json`.
  - If only `Delete` appears on right-click:
    - Select the topic and Partition 0, then use the **plus button** in the Data tab.
- **Application Errors**:
  - Ensure `class-validator`, `class-transformer`, and `joi` are installed.
  - If the health endpoint (`/health`) fails, verify `health.controller.ts` and its module dependencies.
  - If `AuthService` is unused, note it’s a mock implementation for local testing.