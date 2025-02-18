# Use Node.js LTS (Long Term Support) version
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
# Clean install for production
RUN npm ci --only=production

# Copy project files with proper structure
COPY server.js ./
COPY config/ ./config/
COPY middlewares/ ./middlewares/
COPY docs/ ./docs/
COPY models/ ./models/
COPY routes/ ./routes/

# Set Node.js to run in production mode
ENV NODE_ENV=production

# Expose the port the app runs on
ARG PORT=5000
ENV PORT=$PORT
EXPOSE $PORT


# Start the application
CMD ["npm", "start"]