# Build Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Final Image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Copy built frontend to backend public folder
COPY --from=build-frontend /app/frontend/dist ./public

EXPOSE 3000
CMD ["npm", "start"]
