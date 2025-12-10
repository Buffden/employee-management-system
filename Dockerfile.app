FROM openjdk:17-jdk-slim

ARG JAR_FILE=target/employee-management-system-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar

ENTRYPOINT ["java", "-jar", "/app.jar"]
EXPOSE 8080
