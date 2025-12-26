# Portfolio

Welcome to my portfolio repository! 🚀 This repository showcases my personal profile, including a brief introduction about myself, and features my side project, **Word Bridge**.

## 📌 About Me

I am a passionate developer with experience in building web applications. This repository serves as a digital resume and portfolio, providing an overview of my skills, experience, and projects.

## 🏗 Projects

### **Word Bridge**

Word Bridge is a side project designed to facilitate language learning by helping users expand their vocabulary in an interactive way.

## 🚀 Technologies Used

- **Next.js** – React framework for server-side rendering and static site generation.
- **GraphQL** – Query language for APIs to fetch data efficiently.
- **Docker** – Containerized deployment for seamless hosting.
- **Synology NAS** – Hosting the application on a personal cloud environment.

## 🔧 Setup & Installation

To run this project locally:

1. Clone the repository:
   ```sh
   git clone https://github.com/pidashin/portfolio.git
   cd portfolio
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`

---

## start docker

```sh
docker-compose up -d --build
```

### force rebuild (no cache)

```sh
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

🚀 _Thank you for visiting my portfolio! Feel free to explore and contribute._
