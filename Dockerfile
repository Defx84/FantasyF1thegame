FROM node:18-alpine

# Install Chromium and minimal Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

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