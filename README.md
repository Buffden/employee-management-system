# 🧩 Employee Management System API (Backend - Spring Boot)

### ⚙️ Tech Stack
- **Spring Boot 3.4.0**
- **Java 17**
- **PostgreSQL** (AWS RDS or Local Docker)
- **Hibernate JPA**
- **Maven**

---

### 📁 Project Setup

#### 1️⃣ Prerequisites
- Java 17
- Maven
- PostgreSQL (local/docker/RDS)

#### 2️⃣ Clone and Configure
```bash
git clone <backend-repo-url>
cd ems-api
```

#### 3️⃣ Configure Application Properties
Edit `src/main/resources/application.properties`

For **local development**:
```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}?sslmode=require
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PWD}

spring.web.cors.allowed-origins=http://localhost:4200,http://<EC2-PUBLIC-IP>:4200
```

> Replace with appropriate environment variables or hardcoded values for testing.

---

### 🚀 Deployment (EC2 + RDS)

1. **Build JAR**:
```bash
mvn clean package -DskipTests
```

2. **Upload JAR to EC2**:
```bash
scp -i ~/.ssh/ems-key-pair-name.pem target/employee-management-system-0.0.1-SNAPSHOT.jar ubuntu@<EC2-PUBLIC-IP>:/home/ubuntu/
```

3. **Run JAR on EC2**:
```bash
# Optional: kill previous Java processes
pkill -f 'java -jar'

# Start application
nohup java -jar employee-management-system-0.0.1-SNAPSHOT.jar --server.port=8080 > app.log 2>&1 &

# Check logs
tail -f app.log
```

---

### 🔒 AWS Notes
- Open **port 8080** in EC2 security group for your IP (or temporarily `0.0.0.0/0`).
- Make sure RDS allows EC2 security group inbound access on port 5432.

---

### 🧪 Test API (Postman or curl)
```bash
curl http://<EC2-PUBLIC-IP>:8080/departments
```

---

### 🧼 Shutdown Instructions (for cost saving)
- Stop RDS and EC2 instances manually from AWS Console.
- Alternatively, configure auto-shutdown or budget alerts.

---

### 🧩 Troubleshooting
| Problem | Fix |
|---------|-----|
| Timeout from Angular | Check EC2 port 8080 rule |
| CORS error | Update CORS allowed origins |
| Java process not stopping | Use `pkill -f` or `kill -9` with `ps aux | grep java` |

---

### ✅ Confirm Running
- Backend: [http://<EC2-PUBLIC-IP>:8080/departments](http://<EC2-PUBLIC-IP>:8080/departments)
- Frontend: [http://localhost:4200](http://localhost:4200)

### 🚀 Starting the Application

#### Using Docker
To start the application using Docker, follow these steps:

1. **Build the Docker image**:
   ```bash
   docker build -t employee-management-system -f Dockerfile.app .
   ```

2. **Run the Docker container**:
   ```bash
   docker run -p 8080:8080 \
     -e DB_HOST=<your_db_host> \
     -e DB_NAME=<your_db_name> \
     -e DB_USER=<your_db_user> \
     -e DB_PWD=<your_db_password> \
     employee-management-system
   ```

#### Using Docker Compose
To start the application using Docker Compose, follow these steps:

1. **Start the application**:
   ```bash
   docker-compose up
   ```

2. **Stop the application**:
   ```bash
   docker-compose down
   ```

### 🛠️ Jenkins Integration

Jenkins is integrated into the project for continuous integration and deployment. To start Jenkins, follow these steps:

1. **Start Jenkins using Docker Compose**:
   ```bash
   docker-compose -f docker-compose.jenkins.yml up
   ```

2. **Access Jenkins**:
   Open your browser and navigate to [http://localhost:8085](http://localhost:8085).

3. **Configure Jenkins**:
   Follow the on-screen instructions to set up Jenkins, including installing necessary plugins and configuring your project.

4. **Stop Jenkins**:
   ```bash
   docker-compose -f docker-compose.jenkins.yml down
   ```

### 📝 Additional Notes
- Ensure that the necessary environment variables are set for the application and Jenkins.
- For more detailed instructions, refer to the Jenkins documentation and the project's Docker configuration files.

### 🚀 Running the Application Locally

To run the application locally, you can use the provided shell script to set the environment variables and start the application:

1. **Set Environment Variables**:
   Edit the `load_env.sh` file to include your database credentials:
   ```bash
   #!/bin/bash
   export DB_HOST=<your_db_host>
   export DB_NAME=<your_db_name>
   export DB_USER=<your_db_user>
   export DB_PWD=<your_db_password>
   ```

2. **Run the Application**:
   Execute the script to set the environment variables and start the application:
   ```bash
   ./load_env.sh
   ```

### 🚀 Hosting on EC2

To host the application on an EC2 instance and connect it to a hosted database, follow these steps:

1. **Launch an EC2 Instance**:
   - Choose an Amazon Machine Image (AMI) that supports your application (e.g., Amazon Linux 2).
   - Configure the instance with the necessary security group settings to allow traffic on port 8080.

2. **Connect to the EC2 Instance**:
   Use SSH to connect to your EC2 instance:
   ```bash
   ssh -i <your-key-file>.pem ec2-user@<your-ec2-public-ip>
   ```

3. **Set Up the Environment**:
   - Install Java and Maven on the EC2 instance.
   - Clone your repository and navigate to the project directory.

4. **Set Environment Variables**:
   Use the `load_env.sh` script to set the environment variables for the database connection.

5. **Run the Application**:
   Execute the script to start the application:
   ```bash
   ./load_env.sh
   ```

6. **Connect Frontend to Backend**:
   Ensure that your frontend application is configured to connect to the backend server running on the EC2 instance. Update the API endpoints in your frontend code to point to the EC2 instance's public IP address.

7. **Access the Application**:
   Open your browser and navigate to `http://<your-ec2-public-ip>:8080` to access the backend API.

By following these steps, you can successfully host your application on an EC2 instance and connect it to a hosted database. If you have any further questions or need additional assistance, feel free to ask!

