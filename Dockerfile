FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Install required packages and yt-dlp using pip3
RUN apt-get update && \
    apt-get install -y python3-pip && \
    pip3 install --upgrade pip && \
    pip3 install yt-dlp

# Install node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Set environment variable for the port
ENV PORT 3000

# Expose the application port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]
