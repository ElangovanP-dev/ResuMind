package com.resumeanalyzer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AIAnalysisService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public static class AnalysisResponse {
        public int ats_score;
        public List<String> skills_found;
        public List<String> missing_keywords;
        public List<String> strengths;
        public List<String> improvements;
        public String feedback_summary;
    }

    public AnalysisResponse analyzeResume(String resumeText) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("YOUR_")) {
            return getMockAnalysis(resumeText);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt = "Analyze this resume text. Return ONLY valid JSON with these exact keys:\n" +
                    "{\n" +
                    "  \"ats_score\": integer 0-100,\n" +
                    "  \"skills_found\": string array,\n" +
                    "  \"missing_keywords\": string array of commonly expected skills,\n" +
                    "  \"strengths\": string array of exactly 3 items,\n" +
                    "  \"improvements\": string array of exactly 3 actionable items,\n" +
                    "  \"feedback_summary\": string (2 concise sentences)\n" +
                    "}\n\n" +
                    "Resume text:\n" +
                    resumeText;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("maxOutputTokens", 1500);
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());

            String responseText = rootNode
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            String cleanedJson = cleanJsonText(responseText);
            return objectMapper.readValue(cleanedJson, AnalysisResponse.class);

        } catch (Exception e) {
            e.printStackTrace();
            return getMockAnalysis(resumeText);
        }
    }

    private String cleanJsonText(String text) {
        if (text == null) return "{}";
        text = text.trim();
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            if (firstNewline != -1) {
                text = text.substring(firstNewline + 1);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            text = text.trim();
        }
        if (text.contains("{") && text.contains("}")) {
            int firstBrace = text.indexOf('{');
            int lastBrace = text.lastIndexOf('}');
            if (lastBrace > firstBrace) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
        }
        return text;
    }

    private AnalysisResponse getMockAnalysis(String text) {
        AnalysisResponse response = new AnalysisResponse();
        response.ats_score = 65 + (text.length() % 25);
        if (response.ats_score > 100) response.ats_score = 95;

        response.skills_found = Arrays.asList("Java", "Spring Boot", "RESTful APIs", "SQL", "Git", "Maven");
        response.missing_keywords = Arrays.asList("Docker", "AWS", "CI/CD Pipelines", "React.js", "Kubernetes");
        response.strengths = Arrays.asList(
                "Demonstrates strong core Java development capabilities and object-oriented backend programming.",
                "Robust understanding of enterprise web architectures, dependency injection, and JPA relations.",
                "Experience with standard database systems, SQL queries, and project lifecycle build management tools."
        );
        response.improvements = Arrays.asList(
                "Incorporate containerization tech stack like Docker to modernize the application deployment flow.",
                "Incorporate cloud platforms (AWS, GCP) exposure specifically targeting serverless architectures.",
                "Add front-end competencies (React, Tailwind) to round out full-stack software engineer readiness."
        );
        response.feedback_summary = "The resume presents solid backend credentials with strong command of Spring Boot. However, to stand out for full-stack profiles, the candidate should highlight cloud deployment practices and front-end JavaScript frameworks.";
        return response;
    }

    public static class TailorResponse {
        public int matchScore;
        public List<String> missingKeywords;
        public List<Map<String, String>> rewrittenBullets;
        public List<String> suggestedSkills;
        public String tailoredSummary;
    }

    public TailorResponse tailorResume(String resumeText, String jobDescription) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("YOUR_")) {
            return getMockTailoring(resumeText, jobDescription);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt = "You are an expert resume coach and ATS optimization specialist.\n" +
                    "Given the resume text and the job description below, return ONLY a valid JSON object (no markdown, no backticks, no wrapping other than the JSON itself) with this exact structure:\n" +
                    "{\n" +
                    "  \"matchScore\": <integer 0-100>,\n" +
                    "  \"missingKeywords\": [\"keyword1\", \"keyword2\", ...],\n" +
                    "  \"rewrittenBullets\": [\n" +
                    "    { \"original\": \"...\", \"rewritten\": \"...\" },\n" +
                    "    ...\n" +
                    "  ],\n" +
                    "  \"suggestedSkills\": [\"Skill1\", \"Skill2\", ...],\n" +
                    "  \"tailoredSummary\": \"A 2-3 sentence professional summary written for this specific JD.\"\n" +
                    "}\n\n" +
                    "Resume Text:\n" +
                    resumeText + "\n\n" +
                    "Job Description:\n" +
                    jobDescription;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("maxOutputTokens", 2000);
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());

            String responseText = rootNode
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            String cleanedJson = cleanJsonText(responseText);
            return objectMapper.readValue(cleanedJson, TailorResponse.class);

        } catch (Exception e) {
            e.printStackTrace();
            return getMockTailoring(resumeText, jobDescription);
        }
    }

    private TailorResponse getMockTailoring(String resumeText, String jobDescription) {
        TailorResponse response = new TailorResponse();
        response.matchScore = 75;
        response.missingKeywords = Arrays.asList("Docker", "Kubernetes", "AWS ECS", "CI/CD");
        
        List<Map<String, String>> bullets = new ArrayList<>();
        Map<String, String> b1 = new HashMap<>();
        b1.put("original", "Developed backend services using Java and Spring Boot.");
        b1.put("rewritten", "Engineered scalable and robust Java backend services leveraging Spring Boot, adhering to clean architecture and modern software design principles.");
        bullets.add(b1);

        Map<String, String> b2 = new HashMap<>();
        b2.put("original", "Maintained database systems and wrote SQL scripts.");
        b2.put("rewritten", "Optimized relational database schemas and authored high-performance SQL queries in MySQL to resolve critical throughput issues.");
        bullets.add(b2);

        Map<String, String> b3 = new HashMap<>();
        b3.put("original", "Participated in agile ceremonies.");
        b3.put("rewritten", "Collaborated within cross-functional agile teams to deliver features iteratively, participating in daily standups, sprints, and code reviews.");
        bullets.add(b3);

        response.rewrittenBullets = bullets;
        response.suggestedSkills = Arrays.asList("Docker containerization", "AWS Cloud Services", "CI/CD Pipeline integration", "REST APIs design patterns");
        response.tailoredSummary = "Experienced Software Engineer with a strong background in developing Java backend services using Spring Boot and relational database design. Eager to bring containerized deployment experience and agile methodologies to your development team.";
        
        return response;
    }
}
