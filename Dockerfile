# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Expose the application port
EXPOSE 3000

ENTRYPOINT []
# Start the application
CMD ["npm", "start"]
