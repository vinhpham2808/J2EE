# Stage 1: Build Maven project with dependency caching
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml thôi - Maven sẽ cache dependencies layer
COPY Backend/moneymanager/pom.xml ./pom.xml
RUN mvn dependency:resolve dependency:resolve-plugins -q

# Copy source code và build
COPY Backend/moneymanager/src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime image (optimized for 0.5GB RAM)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR từ build stage
COPY --from=build /app/target/*.jar app.jar

# JVM flags tối ưu cho Free plan:
# -XX:TieredStopAtLevel=1 = Fast startup (disable C2 compiler)
# -XX:+UseSerialGC = Sinh garbage collector for small heap
# -Xmx350m = Max heap 350MB (để lại 150MB cho system)
# -XX:CICompilerCount=2 = Reduce compiler threads
ENV JAVA_OPTS="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xmx350m -XX:CICompilerCount=2 -Dfile.encoding=UTF-8"

EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -noverify -jar app.jar"]
