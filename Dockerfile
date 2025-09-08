# Multi-stage Dockerfile for KILO Graphics Generator
FROM node:18 as frontend

# Install system dependencies for Python and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy Flask server
COPY flask-server /app/flask-server
WORKDIR /app/flask-server
RUN pip3 install --break-system-packages -r requirements.txt

# Copy frontend files
WORKDIR /app
COPY . .

# Expose ports
EXPOSE 3000 8080

# Start the application
CMD ["npm", "start"]
