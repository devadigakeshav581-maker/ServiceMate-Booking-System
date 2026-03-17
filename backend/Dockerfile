# Use a base image with Java 17
FROM openjdk:17-jdk-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the compiled JAR file from the target directory to the container
# Assumes the JAR file is named servicemate-1.0.0.jar after 'mvn clean install'
COPY target/servicemate-1.0.0.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]