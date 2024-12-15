# Stage 1: Build Stage
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y python3 curl

# Install yt-dlp via direct download
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install node dependencies
RUN npm install --only=production

# Copy the application code
COPY . .

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
