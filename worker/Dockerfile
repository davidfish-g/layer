# Use Ubuntu as base image for better compatibility with AI tools
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    ffmpeg \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install Python dependencies for AI tools
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install FaceFusion (placeholder - actual installation would depend on their setup)
# RUN pip3 install facefusion

# Install MuseTalk (placeholder - actual installation would depend on their setup)
# RUN pip3 install musetalk

# Copy worker code
COPY . .

# Create temp directory for processing
RUN mkdir -p /tmp/video-processing

# Set environment variables
ENV NODE_ENV=production

# Run the worker
CMD ["node", "video-processor.js"] 