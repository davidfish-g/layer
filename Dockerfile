# Multi-stage Dockerfile for Cloud Deployment  
# Simplified approach focusing on core requirements

FROM ubuntu:22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive

# Install core system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3.10 \
    python3.10-dev \
    python3-pip \
    ffmpeg \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1

# Install Node.js 18 for the worker
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Upgrade pip and install basic tools
RUN python3 -m pip install --upgrade pip setuptools wheel

# Install core Python dependencies for video processing
RUN pip install \
    opencv-python==4.8.0.76 \
    imageio==2.31.1 \
    imageio-ffmpeg==0.4.8 \
    scipy==1.11.1 \
    numpy==1.24.3 \
    Pillow==10.0.0

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Create app directory and work directory
WORKDIR /app
RUN mkdir -p /tmp/video-processing && chmod 777 /tmp/video-processing

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client (with dummy DATABASE_URL)
RUN echo "DATABASE_URL=\"postgresql://dummy:dummy@dummy:5432/dummy\"" > .env && \
    npx prisma generate && \
    rm .env

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Start the worker
CMD ["node", "worker/video-processor.js"] 