@echo off
set GEMINI_API_KEY=AQ.AbBRN6L0AASh8FdJAEtV5jZC2E25gL-1YRWrd52609KRV7RkXw
set SPRING_DATASOURCE_URL=jdbc:mysql://mysql-254754ec-resumind.h.aivencloud.com:15476/defaultdb?sslMode=REQUIRED
set SPRING_DATASOURCE_USERNAME=avnadmin
set SPRING_DATASOURCE_PASSWORD=AVNS_ivsjJ2RMxx8spdA3r2T
set PORT=8080

echo Starting ResuMind Backend locally (connected to Aiven Cloud DB)...
mvn spring-boot:run
pause
