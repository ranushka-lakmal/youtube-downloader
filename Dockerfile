FROM node:18
WORKDIR /app

# Install yt-dlp
RUN apt-get update && apt-get install -y python3-pip && pip3 install yt-dlp

# Install node dependencies
COPY package*.json ./
RUN npm install

COPY . .
ENV PORT 3000
EXPOSE 3000
CMD ["node", "server.js"]
