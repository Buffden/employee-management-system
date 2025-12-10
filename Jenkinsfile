pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18' // Use the Node.js version configured in Jenkins
    }

    environment {
        DOCKER_NETWORK = 'ems-network' // Docker network name
    }

    stages {
        stage('Clone Repository') {
            steps {
                echo 'Cloning the repository...'
                git branch: 'main', url: 'https://github.com/Buffden/employee-management-system-gui'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies and Angular CLI...'
                sh '''
                    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                    apt-get install -y nodejs
                    npm install -g @angular/cli
                    npm install
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building the Angular application...'
                sh 'ng build --configuration production'
            }
        }

        stage('Dockerize Frontend') {
            steps {
                echo 'Dockerizing the Angular application...'
                sh '''
                    docker build -t angular-app .
                    docker images
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Running the Docker container...'
                sh '''
                    # Create Docker network if it doesn't exist
                    docker network ls | grep $DOCKER_NETWORK || docker network create $DOCKER_NETWORK

                    # Remove the existing container if it exists
                    docker rm -f angular-app-container || true

                    # Run the application container in the Docker network
                    docker run -d --network $DOCKER_NETWORK --name angular-app-container angular-app

                    # Check if Jenkins container is already connected to the network
                    if ! docker network inspect $DOCKER_NETWORK | grep $(hostname); then
                        docker network connect $DOCKER_NETWORK $(hostname)
                    else
                        echo "Jenkins container is already connected to the network."
                    fi
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Verifying the deployment...'
                sh '''
                    # Verify the app using its container name within the Docker network
                    curl -I http://angular-app-container:80 || echo "App not reachable"
                '''
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker artifacts...'
            sh 'docker ps -a'
        }
        success {
            echo 'Build and deployment completed successfully!'
        }
        failure {
            echo 'Build or deployment failed. Check logs for errors.'
        }
    }
}
