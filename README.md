# ScreenCloud Challenge

## Introduction

This project implements the backend for a new order management system for ScreenCloud's SCOS devices, as specified in the associated challenge document (`CHALLENGE.md`). 

The system allows sales representatives to verify potential orders based on quantity and shipping destination. This verification will check stock availability, calculates discounts and shipping costs, and checks overall order validity. 

It also allows submitting valid orders, which updates warehouse inventory accordingly.

## Installation & Use

1.  **Prerequisites:** Ensure you have Docker and Docker Compose installed. Optionally, use pnpm (https://pnpm.io/installation) for dependency management.
2.  **Dependencies:** Run `pnpm install` (or `npm install`) to install project dependencies.
3.  **Environment:** Copy the `.env.example` file to `.env`.

### Running the Application

- **First Run / Initialization:**
    1.  Run `npm run start`. This builds the images and starts the application, database, and pgAdmin containers.
    2.  Once the containers are running and healthy, prepare the database by running 
        ```bash
        npm run db:prepare
        ```
        This command should be executed **after** the `app` and `db` containers are running and healthy. It connects to the database inside the `app` container, resets the schema, and runs the seed script (`prisma/seed.ts`) to populate the initial warehouse data (based on the stock levels and locations specified in `CHALLENGE.md`).

- **Subsequent Runs:**
    - To start the application: Run `npm run start` (or `docker compose up -d`).
    - To stop the application: Run `npm run stop` (or `docker compose down`). This preserves the database data.

### Available Endpoints

Once running, the following are available:

- **API Base URL:** `http://localhost:3000` (or the `APP_PORT` you set in `.env`)
    - `POST /orders/verify`
    - `POST /orders/submit`
    - `GET /health`
- **pgAdmin4:** `http://localhost:5050` (or the `PGADMIN_PORT` you set in `.env`)
    - Log in with the `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from your `.env` file.
    - The database server (`Docker DB`) should be pre-configured.
- **OpenAPI:** 
    - OpenAPI json document: `http://localhost:3000/api-docs`
    - Swagger UI: `http://localhost:3000/docs/`

### Testing

Run tests using npm scripts:
- **Run all tests:**
    ```bash
    npm test
    ```
- **Run Domain Layer unit tests:** (Fast, no external dependencies)
    ```bash
    npm run test:domain
    ```
- **Run Application Layer integration tests:** (Mocks persistence)
    ```bash
    npm run test:application
    ```
- **Run Infrastructure/E2E tests:** (Requires Docker environment to be running and database prepared)
    1.  Ensure containers are running: `npm run start`
    2.  Prepare the test database (resets and seeds): `npm run db:prepare`
    3.  Run the tests: `npm run test:infrastructure`

### Monitoring

   - Install `dry`, on ubuntu: `sudo apt install dry`
   - Use `dry` for command line Docker management and log monitoring

### Configuration

- **Environment variables from `.env.example`**:
    ```bash
    DATABASE_URL=postgresql://screencloud_user:screencloud_password@db:5432/screencloud_app?schema=public
    POSTGRES_USER=screencloud_user
    POSTGRES_PASSWORD=screencloud_password
    POSTGRES_DB=screencloud_app
    APP_PORT=3000
    ```

- **Dockerfile - Docker compose:**
    The compose file references the `.env` for its container level environment variables configuration and for some of it's port variables ( `APP_PORT`, and `PGADMIN_PORT` ).

    The services are initialized according to the user/password configurations in the `.env`


## Foundational Approach

First principles is the core foundational approach, in my opinion, for any software solution.

This means;
- **Clear separation of concerns:** it's critical to separate functionality, and logic in distinct area's such that they not overlap. 
- **Single responsibility principle:** uncoupled as much as possible and clear functional responsibility per method, and class.
- **Don't Repeat Yourself (DRY):** re-use of code, avoiding duplication. 
- **Encapsulation with interfaces / black boxes:** clear input/output design improves testability.
- **Loose coupling:** modularity increases maintability, reduces code error surface.

### Architecture Choices

- **Hexagonal Design**: layered design where the dependencies only 'point' inwards, the inner most layer is the Domain Layer. Essentially, the architecture is like an union:

  `Infrastructure layer (Outer) > Application Layer > Domain Layer (Core)`

    We can test each area in isolation (black boxes). We can ecapsulate each layer, this enables loose coupling, and it's DRY and clear around responsibilities.

- **Domain Driven Design Principles**;

    We have some complex domain logic, models, aggregates and value objects that need clearly to be defined.

    This also improves testability when we align the business language (Domain) with the technical implementation (naming, modelling of concepts).

### Implementation separation;

The source code is therefore logically distributed in these 3 folders (layers of responsibility and abstraction):

1.  **Domain:** governs the domain model, value objects, domain services and repository interfaces. The domain describes the context and its business rules in which we must operate.
2.  **Application:** governs the use-cases to be exposed by the API's, and the data-transfer-objects. The use cases are the tasks the application needs to fullfil (Tasks To be Done).
3.  **Infrastructure:** this exposes our previous layer via an API, and enables persistence with an ORM solution. The infrastructure is therefore what exposes the tasks to the consumer(s).

### Technology choices:

For each of the layers of our implementation we require technical solutions to help speed up and simplify our solution programming:

1. **Domain:** The domain layer is plain Typescript.
2. **Application:** 
    - Tsyringe ( https://github.com/microsoft/tsyringe ) dependency injection for loose coupling.
    - Zod ( https://zod.dev/ ) type/schema validator, we improve our security, type safety
3. **Infrastructure:** 
    - Restify ( https://restify.com/ ) rest web server, used by major players such as Netflix
    - Prisma ( https://www.prisma.io ) ORM, Repository implementation.
    - Postgres ( https://www.postgresql.org/ ) ANSI SQL compatible database, industry leading database.
    - Docker / Docker compose ( https://www.docker.com/ ) Container and Container orchestration. Ideal for exact local deployments, CI/CD pipelines, and cloud/server deployments.
4. **Testing:**
    - Vitest ( https://vitest.dev/ ) for unit testing in general.
    - Supertest ( https://github.com/ladjs/supertest ) for E2E / integration testing

### Deployment / CI-CD

Currently this is only a local dev deployment. To extend this to the cloud or server environment we can create a continuous integration pipeline either in Github or AWS as part of CodePipeline.

This CodeBuild or Github Actions pipeline would build the docker containers, push them to a private registry, and then pulled in the pipeline for deployment to a Container Service (AWS ECS) or for instance as a Deployment on Kubernetes. Environments/secrets can then be managed by AWS Parameter Store/Secrets Manager or for Kubernetes we have Secrets.

For logging/monitoring we should ideally have a centralized solution such as AWS CloudWatch or Loki/Prometheus/Grafana in case of Kubernetes for example. 

For high performant deployments we have the option to vertically, and horizontally scale the Container instances and perform Application Level Load Balancing as the immediate first step. 

Other considations are queues, rate limiting, application level firewalls to further enhance availability, scalability and security.