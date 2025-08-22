# Client Dockerfile
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Accept API base URL at build-time and expose to runtime env
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

EXPOSE 5173

# Run Vite dev server bound to 0.0.0.0 for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
