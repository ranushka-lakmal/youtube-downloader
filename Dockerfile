FROM node:18 AS build

# Set working directory
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y python3 curl

# Install yt-dlp via direct download
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Install node dependencies
COPY package*.json ./
RUN npm install

# Copy the application code
COPY . .

# Set environment variable for the application
ENV PORT 3000

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
