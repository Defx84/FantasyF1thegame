FROM node:18-slim

# Install Chromium and minimal Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Prevent Puppeteer from downloading Chromium again
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

EXPOSE 8080

CMD ["npm", "start"] 