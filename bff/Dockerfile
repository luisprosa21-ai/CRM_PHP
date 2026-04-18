FROM node:18-alpine

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Create storage directory
RUN mkdir -p storage

EXPOSE 3001

CMD ["node", "src/server.js"]
