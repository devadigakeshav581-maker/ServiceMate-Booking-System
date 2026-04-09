# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the pre-built jar from the host target folder
# This relies on the host build having completed successfully
COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
