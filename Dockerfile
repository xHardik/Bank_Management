# Stage 1: Build Java Application
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app
COPY src ./src
RUN mkdir bin && javac -d bin -sourcepath src $(find src -name "*.java")

# Stage 2: Runtime Image
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/bin ./bin
COPY web ./web
COPY data ./data

EXPOSE 8080
ENV PORT=8080

CMD ["java", "-cp", "bin", "com.bank.Main"]