# Use a single stage
FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy necessary files
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY test ./test

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Defaulting to 3000 if not specified
ARG APP_PORT=3000

# Define environment variable for the port inside the container
ENV PORT=${APP_PORT}
ENV NODE_ENV=development

CMD ["node", "dist/main.js"]
