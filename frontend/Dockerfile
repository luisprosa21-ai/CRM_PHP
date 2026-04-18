FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 8080

CMD ["npx", "http-server", "public", "-p", "8080", "-c-1", "--cors"]
