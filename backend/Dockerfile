# Build stage using Maven
FROM maven:3.8.4-openjdk-17-slim AS build
COPY . /app
WORKDIR /app
RUN mvn clean package -DskipTests

# Run stage using OpenJDK
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/servicemate-1.0.0.jar app.jar

EXPOSE 8080

# Run the application with production flags
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]