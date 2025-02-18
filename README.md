# advanced-url-shortner

## Steps for running the project

1. Create a .env file and set the environment variables there
```
PORT=5000
MONGO_URI=mongodb://admin:password@mongodb:27017 # not needed if you are using docker compose
SESSION_SECRET=**********************
GOOGLE_CLIENT_ID=*************
GOOGLE_CLIENT_SECRET=*****************
JWT_SECRET=*****************
REDIS_HOST=redis
REDIS_PORT=6379
MONGO_USERNAME=admin
MONGO_PASSWORD=password
MONGO_HOST=mongoDB
```

2. Create a network
```
docker create network app_network
```
3. Run the project
```
docker compose up --build
```

And done

Swagger is available at http://localhost:5000/api-docs

