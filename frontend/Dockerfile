FROM node:18-alpine

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy the rest of the application
COPY . .

EXPOSE 8080

CMD ["npx", "http-server", "public", "-p", "8080", "-c-1", "--cors"]
