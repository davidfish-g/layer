# Multi-stage Dockerfile for Cloud Deployment
# Optimized for Google Cloud Run with better layer caching

# Stage 1: Base image with system dependencies
FROM ubuntu:22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3.10 \
    python3.10-dev \
    python3.10-venv \
    python3-pip \
    ffmpeg \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    unzip \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Stage 2: Python dependencies
FROM base AS python-deps

# Upgrade pip and install basic Python tools
RUN python3 -m pip install --upgrade pip setuptools wheel

# Install PyTorch (CPU version for cloud efficiency)
RUN pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cpu

# Install AI tool dependencies
RUN pip install \
    diffusers==0.21.4 \
    transformers==4.33.2 \
    accelerate==0.21.0 \
    imageio==2.31.1 \
    imageio-ffmpeg==0.4.8 \
    easydict==1.10 \
    yacs==0.1.8 \
    pyyaml==6.0.1 \
    scikit-image==0.21.0 \
    dlib==19.24.2 \
    face_alignment==1.3.5 \
    librosa==0.10.1 \
    python_speech_features==0.6 \
    scipy==1.11.1 \
    opencv-python==4.8.0.76

# Stage 3: AI tools installation
FROM python-deps AS ai-tools

# Create directories for AI tools
RUN mkdir -p /opt/facefusion /opt/musetalk

# Install FaceFusion
WORKDIR /opt/facefusion
RUN git clone https://github.com/facefusion/facefusion.git . \
    && pip install -r requirements.txt \
    && python install.py --onnxruntime cpu --skip-conda

# Download FaceFusion models (cache them in the image)
RUN python download.py --model face_swapper.inswapper_128.onnx \
    && python download.py --model face_enhancer.gfpgan_1.4.onnx \
    && python download.py --model frame_enhancer.real_esrgan_x4plus.onnx

# Install MuseTalk
WORKDIR /opt/musetalk
RUN git clone https://github.com/TMElyralab/MuseTalk.git . \
    && mkdir -p models checkpoints

# Download MuseTalk models (cache them in the image)
RUN mkdir -p models/dwpose models/face-parse-bisent models/sd-vae-ft-mse \
    && cd models \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/models/dwpose/dw-ll_ucoco_384.pth -O dwpose/dw-ll_ucoco_384.pth \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/models/face-parse-bisent/79999_iter.pth -O face-parse-bisent/79999_iter.pth \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/models/face-parse-bisent/resnet18-5c106cde.pth -O face-parse-bisent/resnet18-5c106cde.pth \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/models/sd-vae-ft-mse/config.json -O sd-vae-ft-mse/config.json \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/models/sd-vae-ft-mse/diffusion_pytorch_model.bin -O sd-vae-ft-mse/diffusion_pytorch_model.bin

# Download MuseTalk checkpoints
RUN mkdir -p checkpoints/musetalk \
    && cd checkpoints \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/checkpoints/musetalk/pytorch_model.bin -O musetalk/pytorch_model.bin \
    && wget -q https://huggingface.co/TMElyralab/MuseTalk/resolve/main/checkpoints/musetalk/config.json -O musetalk/config.json

# Stage 4: Final application
FROM ai-tools AS app

# Set environment variables
ENV FACEFUSION_PATH=/opt/facefusion
ENV MUSETALK_PATH=/opt/musetalk
ENV PYTHONPATH="/opt/facefusion:/opt/musetalk:$PYTHONPATH"
ENV NODE_ENV=production
ENV PORT=8080

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create a minimal .env file for prisma generation
RUN echo "DATABASE_URL=\"postgresql://dummy:dummy@dummy:5432/dummy\"" > .env

# Generate Prisma client
RUN npx prisma generate

# Remove the dummy .env file
RUN rm .env

# Create work directory for temporary files
RUN mkdir -p /tmp/video-processing && chmod 777 /tmp/video-processing

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Start the worker
CMD ["node", "worker/video-processor.js"] 