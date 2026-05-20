# Portfolio Website

This is my personal developer portfolio website. It showcases my projects, skills, and background as an Informatics student and software developer.

## Local Development

To run the website locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/Wolfi-OwO/portfolio-webpage.git
    cd portfolio-webpage
   ```

2. Install dependencies (Server and Client):

   ```bash
    cd app
    npm install

    cd client
    npm install
    ```

3. Start the mongo database (docker):

   ```bash
    docker run -d -p 27017:27017 --name portfolio-mongo mongo
   ```

4. Build the client application:

   ```bash
    npm run build
   ```

5. Start the server:

   ```bash
    npm start
   ```

In order to test the backend, you can run the tests using:

1. Start the mongo database (docker):

   ```bash
    docker run -d -p 50000:27017 --name portfolio-mongo mongo
   ```

2. Run the tests:

    ```bash
    npm test
    ```

## Live Demo

<!--The live version of the website can be accessed at: [https://my-portfolio.vercel.app](https://my-portfolio.vercel.app) -->

## Purpose

The goal of this website is to:

- Present my software development projects
- Highlight my technical skills and experience
- Provide a central place for contact and collaboration
- Serve as a foundation for freelance and professional opportunities

## Tech Stack

The website is built using the following technologies:

- React (JavaScript) for the frontend
- Tailwind CSS for styling
- Node.js (for tooling / backend integration)
- Microsoft Azure (deployment)

## Project Structure

The webapplications root directory `app/` contains the main express and in `app/client/` the React application. The structure is organized as follows:

```txt
├── app
│   ├── client
│   ├── handlers
│   ├── models
│   ├── routes
│   ├── tests
│   ├── utils
│   ├── package.json
│   ├── package-lock.json
│   ├── dockerfile
│   ├── eslint.config.js
│   └── server.js
├── LICENSE
└── README.md
```

- `client/`: Contains the React frontend application (default vite setup)
- `handlers/`: Contains request handlers for the backend
- `models/`: Contains data models and schemas
- `routes/`: Contains API route definitions
- `tests/`: Contains unit and integration tests
- `utils/`: Contains utility functions and helpers
- `package.json`: Contains project dependencies and scripts
- `dockerfile`: Contains instructions for building a Docker image of the application
- `eslint.config.js`: Contains configuration for ESLint code linting
- `server.js`: Entry point for the backend server
