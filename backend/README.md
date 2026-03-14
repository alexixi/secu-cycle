🚴 Bike Project – Backend API (FastAPI + PostgreSQL)
Backend API for the bike routing and tracking application.
    Built with:
        FastAPI
        PostgreSQL
        SQLAlchemy
        Docker (for database)
        Uvicorn
    📦 1. Requirements
        You need:
        Python 3.10+
        pip
        Docker
        Docker Compose
    📥 2. Installation
        cd backend/database
        2.2 Create a virtual environment
            python -m venv venv
            source venv/bin/activate (macOS / Linux)
        2.3 Install dependencies
            pip install -r requirements.txt
    🐳 3. Start PostgreSQL with Docker
        From the folder containing docker-compose.yml:
            docker compose up -d
        This will:
            Download PostgreSQL image
            Create a container
            Create the configured database
            Expose port 5432
            To stop the database:
            docker compose down
    🗄 4. Database Configuration
        The database connection is defined in:
        database.py
        Example:
        DATABASE_URL = "postgresql://bike_user:password@localhost:5432/bike_db"
        Make sure:
        Username matches docker-compose.yml
        Password matches docker-compose.yml
    Database name exists
    🚀 5. Run the API
        From the backend folder:
        uvicorn main:app --reload
        The API will be available at:
        http://localhost:8000
        Interactive API documentation (Swagger):
        http://localhost:8000/docs


    🌐 7. Connecting the Frontend to the Backend

        The frontend communicates only with: http://localhost:8000
        Example: JavaScript Fetch (Frontend)
        Create a user:
            fetch("http://localhost:8000/users", {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({
                email: "alice@example.com",
                password: "supersecret",
                first_name: "Alice"
                })
                })
            .then(response => response.json())  
            .then(data => console.log(data))
            .catch(error => console.error(error));

        Login User:
            try {
                const response = await fetch("http://localhost:8000/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
                });

                if (!response.ok) {
                throw new Error("Identifiants invalides");
                }

                const data = await response.json();
                localStorage.setItem("token", data.access_token);
                console.log("Connexion réussie");

                } catch (error) {
                    console.error("Erreur :", error);
                }
        Get users:
            fetch("http://localhost:8000/users/me", {
            headers: {"Authorization": "Bearer " + localStorage.getItem("token") }
            })
            .then(res => res.json())
            .then(data => console.log(data));

    📌 Common Issues
        Port 5432 already in use:
        lsof -i :5432
        Stop the conflicting process or change Docker port mapping.
        Cannot connect to Docker daemon:
        Make sure Docker Desktop is running.
    ✅ Development Workflow
        Start Docker
        Activate virtual environment
        Run uvicorn
        Test endpoints via Swagger or frontend