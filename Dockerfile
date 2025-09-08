# Multi-stage Dockerfile for KILO Graphics Generator
FROM node:18-alpine as frontend

# Install system dependencies for Python and FFmpeg
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    build-base \
    python3-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy Flask server
COPY ../KILO-image_to_vid /app/KILO-image_to_vid
WORKDIR /app/KILO-image_to_vid
RUN pip3 install -r requirements.txt

# Copy frontend files
WORKDIR /app
COPY . .

# Expose ports
EXPOSE 3000 8080

# Start the application
CMD ["npm", "start"]
