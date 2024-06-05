# Open Webtoon Reader - API

A RESTful API for the upcoming webtoon reader and downloader application.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
    - [On a basic server](#on-a-basic-server)
    - [With Pterodactyl](with-pterodactyl)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Overview
OWR-API provides endpoints to fetch, read, and download webtoons, supporting the webtoon reader and downloader application.

## Features
- Download and save webtoons
- Fetch webtoons, episodes list and content

## Getting Started

### Prerequisites
- Node.js
- npm/pnpm package manager

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/Open-Webtoon-Reader/OWR-API.git
   cd OWR-API
   ```
2. Install dependencies:
   ```sh
   pnpm install
   ```

## Configuration
Create a `.env` file in the root directory with the following variables:
```ini
# Server
SERVER_TYPE="http"
BIND_ADDRESS="0.0.0.0"
HTTP_PORT="3000"
HTTPS_PORT="3001"

# SSL
SSL_KEY_FILE=""
SSL_CERT_FILE=""

# API
PREFIX="api/v1/"

# Security
ADMIN_KEY="admin"
```

### Running the Application
#### On a basic server
1. Start the server:
   ```sh
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   pnpm run start
   ```
2. The API will be available at `http://localhost:3000` (depending of your `.env` configuration).

#### With Pterodactyl
1. Create a new service on your Pterodactyl panel from nodejs egg.
2. Configure the startup command as the following:
   ```sh
   if [ ! -d "OWR-API" ]; then git clone https://github.com/Open-Webtoon-Reader/OWR-API; fi; cd OWR-API || exit; git pull; if [ ! -f ".env" ]; then cp .env.example .env; fi; npm install --force; npx prisma generate; npx prisma migrate deploy; npx prisma db seed; npm run start
   ```

## API Endpoints
The API endpoints will be available at `http://localhost:3000/api/` (depending of your `.env` configuration).

## Technologies Used
- **TypeScript**
- **NestJS**
- **Prisma**
- **RESTful API**

## Contributing
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
