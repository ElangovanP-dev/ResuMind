package com.resumeanalyzer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIAnalysisService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public AIAnalysisService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);  // 15 seconds connect timeout
        factory.setReadTimeout(25000);     // 25 seconds read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    // ─── Common tech skill keywords used for smart mock detection ──────────────
    private static final List<String> TECH_SKILLS = Arrays.asList(
        "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Kotlin", "Swift",
        "Spring Boot", "Spring", "Django", "Flask", "FastAPI", "Node.js", "Express", "React",
        "Angular", "Vue", "Next.js", "HTML", "CSS", "TailwindCSS", "Bootstrap",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "DynamoDB",
        "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins",
        "CI/CD", "GitHub Actions", "GitLab CI", "Maven", "Gradle", "Git",
        "REST", "GraphQL", "gRPC", "Microservices", "Kafka", "RabbitMQ",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP",
        "Data Analysis", "Pandas", "NumPy", "Tableau", "Power BI", "Spark", "Hadoop",
        "Linux", "Bash", "Agile", "Scrum", "Jira", "Figma"
    );

    // ─── Common resume section headers to detect structure ─────────────────────
    private static final List<String> SECTION_HEADERS = Arrays.asList(
        "experience", "education", "skills", "summary", "objective", "projects",
        "certifications", "achievements", "publications", "awards"
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════

    public static class AnalysisResponse {
        public int ats_score;
        public List<String> skills_found;
        public List<String> missing_keywords;
        public List<String> strengths;
        public List<String> improvements;
        public String feedback_summary;
    }

    public AnalysisResponse analyzeResume(String resumeText) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_")) {
            return getMockAnalysis(resumeText);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String cleanedText = preprocessResumeText(resumeText);

            String prompt =
                "You are an expert ATS (Applicant Tracking System) analyst and resume coach.\n" +
                "Analyze the SPECIFIC resume text provided below. Do NOT generate generic advice.\n" +
                "Base ALL your output strictly on what is written in this resume — the person's actual skills, experience, and background.\n\n" +
                "Return ONLY a valid JSON object (no markdown, no backticks, no explanation text outside the JSON) with EXACTLY these keys:\n" +
                "{\n" +
                "  \"ats_score\": <integer 0-100, based on keyword density, formatting completeness, section presence, and quantifiable achievements>,\n" +
                "  \"skills_found\": [\"<skill1>\", \"<skill2>\", ...],  // ONLY skills explicitly mentioned in the resume\n" +
                "  \"missing_keywords\": [\"<kw1>\", \"<kw2>\", ...],  // 4-6 keywords commonly expected for this type of role, NOT present in the resume\n" +
                "  \"strengths\": [\"<str1>\", \"<str2>\", \"<str3>\"],  // EXACTLY 3 specific strengths BASED ON this resume's actual content\n" +
                "  \"improvements\": [\"<imp1>\", \"<imp2>\", \"<imp3>\"],  // EXACTLY 3 actionable, specific improvements for THIS resume\n" +
                "  \"feedback_summary\": \"<2-3 sentences specific to THIS person's background and profile>\"\n" +
                "}\n\n" +
                "RESUME TEXT:\n" +
                cleanedText;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("maxOutputTokens", 1500);
            generationConfig.put("responseMimeType", "application/json");
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

    // ─── Smart, dynamic mock: scans the resume text to produce varied results ──
    private AnalysisResponse getMockAnalysis(String text) {
        String lowerText = text.toLowerCase();

        // Detect skills actually present in the resume
        List<String> skillsFound = TECH_SKILLS.stream()
                .filter(skill -> lowerText.contains(skill.toLowerCase()))
                .collect(Collectors.toList());

        // Detect missing common skills (not in resume)
        List<String> potentialMissing = Arrays.asList(
            "Docker", "Kubernetes", "AWS", "CI/CD", "Redis", "GraphQL",
            "Terraform", "TypeScript", "React", "Kafka", "PostgreSQL", "Elasticsearch"
        );
        List<String> missingKeywords = potentialMissing.stream()
                .filter(skill -> !lowerText.contains(skill.toLowerCase()))
                .limit(5)
                .collect(Collectors.toList());

        // Count sections present for score calculation
        long sectionsPresent = SECTION_HEADERS.stream()
                .filter(h -> lowerText.contains(h))
                .count();

        // Compute dynamic ATS score
        int baseScore = 40;
        baseScore += (int) Math.min(sectionsPresent * 6, 24);   // up to 24 pts for sections
        baseScore += Math.min(skillsFound.size() * 2, 20);       // up to 20 pts for skills
        boolean hasNumbers = text.matches(".*\\d+.*");
        if (hasNumbers) baseScore += 8;                           // quantified achievements
        if (text.length() > 1500) baseScore += 5;                // sufficient content
        if (text.length() > 3000) baseScore -= 3;                // overly long
        int atsScore = Math.max(30, Math.min(baseScore, 92));

        // Build context-sensitive strengths
        List<String> strengths = new ArrayList<>();
        if (!skillsFound.isEmpty()) {
            String topSkills = skillsFound.stream().limit(3).collect(Collectors.joining(", "));
            strengths.add("Demonstrates hands-on proficiency in " + topSkills + ", which are highly relevant to modern technical roles.");
        } else {
            strengths.add("The resume shows a clear professional trajectory with evident domain experience.");
        }
        if (lowerText.contains("experience") || lowerText.contains("worked")) {
            strengths.add("Professional experience section provides concrete evidence of real-world contribution and role progression.");
        } else {
            strengths.add("The content reflects a clear understanding of the target domain.");
        }
        if (hasNumbers) {
            strengths.add("Use of quantifiable metrics and numbers (e.g., percentages, counts) strengthens credibility and ATS score.");
        } else {
            strengths.add("Educational background and certifications demonstrate commitment to continuous professional development.");
        }

        // Build context-sensitive improvements
        List<String> improvements = new ArrayList<>();
        if (missingKeywords.size() >= 1) {
            improvements.add("Add in-demand technologies like " + missingKeywords.get(0) +
                    (missingKeywords.size() > 1 ? " and " + missingKeywords.get(1) : "") +
                    " to your skills section to pass automated ATS filters for senior roles.");
        } else {
            improvements.add("Expand your skills section with emerging tools and frameworks relevant to your domain.");
        }
        if (!hasNumbers) {
            improvements.add("Quantify your achievements with specific numbers (e.g., 'Reduced load time by 35%', 'Led team of 5 engineers') to make impact measurable.");
        } else {
            improvements.add("Ensure every bullet point in your experience section begins with a strong action verb and includes a quantifiable outcome.");
        }
        if (!lowerText.contains("summary") && !lowerText.contains("objective")) {
            improvements.add("Add a tailored 2-3 sentence professional summary at the top that speaks directly to your target role and key differentiators.");
        } else {
            improvements.add("Tailor your professional summary specifically to each job description you apply for, incorporating relevant keywords from the JD.");
        }

        // Feedback summary
        String primarySkills = skillsFound.isEmpty() ? "domain-specific competencies"
                : skillsFound.stream().limit(2).collect(Collectors.joining(" and "));
        String feedbackSummary = "This resume demonstrates a solid foundation in " + primarySkills +
                " with " + (sectionsPresent >= 4 ? "good" : "adequate") + " structural coverage across key sections. " +
                (missingKeywords.isEmpty() ? "The skills coverage is comprehensive for the target domain." :
                 "To strengthen ATS pass rates, consider incorporating keywords like " +
                 missingKeywords.stream().limit(2).collect(Collectors.joining(", ")) + " where applicable.");

        AnalysisResponse response = new AnalysisResponse();
        response.ats_score = atsScore;
        response.skills_found = skillsFound.isEmpty() ? List.of("Professional Communication", "Problem Solving") : skillsFound;
        response.missing_keywords = missingKeywords;
        response.strengths = strengths;
        response.improvements = improvements;
        response.feedback_summary = feedbackSummary;
        return response;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TAILORING
    // ═══════════════════════════════════════════════════════════════════════════

    public static class TailorResponse {
        public int matchScore;
        public List<String> missingKeywords;
        public List<Map<String, String>> rewrittenBullets;
        public List<String> suggestedSkills;
        public String tailoredSummary;
    }

    public TailorResponse tailorResume(String resumeText, String jobDescription) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_")) {
            return getMockTailoring(resumeText, jobDescription);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String cleanedResume = preprocessResumeText(resumeText);
            String cleanedJD = jobDescription.length() > 2000
                    ? jobDescription.substring(0, 2000) : jobDescription;

            String prompt =
                "You are an expert resume coach and ATS optimization specialist.\n" +
                "Analyze the provided resume and job description. Your task is to produce SPECIFIC, PERSONALIZED output.\n\n" +
                "CRITICAL RULES:\n" +
                "- The 'rewrittenBullets' MUST use ACTUAL bullet points / experience lines extracted from the provided resume. Do NOT invent new ones.\n" +
                "- If you cannot find at least 2 bullet-like lines in the resume, create rewrites based on the experience descriptions present.\n" +
                "- The 'tailoredSummary' MUST reference the candidate's ACTUAL background from the resume, tailored to the JD.\n" +
                "- The 'matchScore' MUST reflect genuine keyword overlap between resume and JD (0-100).\n\n" +
                "Return ONLY a valid JSON object (no markdown, no backticks) with EXACTLY this structure:\n" +
                "{\n" +
                "  \"matchScore\": <integer 0-100>,\n" +
                "  \"missingKeywords\": [\"keyword1\", \"keyword2\", ...],\n" +
                "  \"rewrittenBullets\": [\n" +
                "    { \"original\": \"<exact line from resume>\", \"rewritten\": \"<ATS-optimized version for this JD>\" },\n" +
                "    ...\n" +
                "  ],\n" +
                "  \"suggestedSkills\": [\"Skill1\", \"Skill2\", ...],\n" +
                "  \"tailoredSummary\": \"<2-3 sentence summary using this candidate's real background, optimized for this specific JD>\"\n" +
                "}\n\n" +
                "RESUME:\n" + cleanedResume + "\n\n" +
                "JOB DESCRIPTION:\n" + cleanedJD;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("maxOutputTokens", 1500);
            generationConfig.put("responseMimeType", "application/json");
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

    // ─── Smart mock tailoring: computes real keyword overlap ──────────────────
    private TailorResponse getMockTailoring(String resumeText, String jobDescription) {
        String lowerResume = resumeText.toLowerCase();
        String lowerJD = jobDescription.toLowerCase();

        // Extract keywords that appear in the JD
        List<String> jdKeywords = TECH_SKILLS.stream()
                .filter(skill -> lowerJD.contains(skill.toLowerCase()))
                .collect(Collectors.toList());

        // Find which JD keywords are missing from resume
        List<String> missingKeywords = jdKeywords.stream()
                .filter(kw -> !lowerResume.contains(kw.toLowerCase()))
                .limit(6)
                .collect(Collectors.toList());

        // Find which JD keywords ARE in the resume
        long matchedCount = jdKeywords.stream()
                .filter(kw -> lowerResume.contains(kw.toLowerCase()))
                .count();

        // Compute match score based on keyword overlap
        int matchScore;
        if (jdKeywords.isEmpty()) {
            // Fallback: general text overlap heuristic
            String[] jdWords = lowerJD.split("\\W+");
            long overlapCount = Arrays.stream(jdWords)
                    .filter(w -> w.length() > 4 && lowerResume.contains(w))
                    .distinct()
                    .count();
            matchScore = (int) Math.min(40 + overlapCount * 2, 85);
        } else {
            matchScore = (int) Math.min(100, Math.round((matchedCount * 100.0) / jdKeywords.size()));
            // Clamp to realistic range
            matchScore = Math.max(20, Math.min(matchScore, 88));
        }

        // Extract actual bullet-like lines from resume
        List<String> resumeLines = Arrays.stream(resumeText.split("\n"))
                .map(String::trim)
                .filter(line -> line.length() > 30 && (
                        line.startsWith("-") || line.startsWith("•") ||
                        line.startsWith("*") || line.matches("^[A-Z][a-z].*")
                ))
                .limit(5)
                .collect(Collectors.toList());

        // Generate rewritten bullets using actual resume lines
        List<Map<String, String>> bullets = new ArrayList<>();
        if (!resumeLines.isEmpty()) {
            for (String line : resumeLines.stream().limit(3).collect(Collectors.toList())) {
                String cleanLine = line.replaceAll("^[-•*]\\s*", "").trim();
                String firstJdKw = jdKeywords.isEmpty() ? "scalable systems"
                        : jdKeywords.get(0).toLowerCase();
                Map<String, String> bullet = new HashMap<>();
                bullet.put("original", cleanLine);
                bullet.put("rewritten", rewriteBulletForJD(cleanLine, firstJdKw));
                bullets.add(bullet);
            }
        } else {
            // Fallback when no clear bullets detected
            Map<String, String> b1 = new HashMap<>();
            b1.put("original", "Worked on development projects using various technologies.");
            b1.put("rewritten", "Delivered end-to-end software development projects, applying " +
                    (jdKeywords.isEmpty() ? "industry best practices" : jdKeywords.get(0)) +
                    " to build robust, maintainable solutions.");
            bullets.add(b1);
        }

        // Suggested skills = missing JD keywords + top detected resume skills not in JD
        List<String> resumeSkills = TECH_SKILLS.stream()
                .filter(s -> lowerResume.contains(s.toLowerCase()) && !lowerJD.contains(s.toLowerCase()))
                .limit(2)
                .collect(Collectors.toList());
        List<String> suggestedSkills = new ArrayList<>(missingKeywords.stream().limit(3).collect(Collectors.toList()));
        suggestedSkills.addAll(resumeSkills);

        // Tailored summary
        List<String> sharedSkills = TECH_SKILLS.stream()
                .filter(s -> lowerResume.contains(s.toLowerCase()) && lowerJD.contains(s.toLowerCase()))
                .limit(3)
                .collect(Collectors.toList());
        String sharedSkillStr = sharedSkills.isEmpty() ? "relevant technologies"
                : String.join(", ", sharedSkills);
        String tailoredSummary =
                "Results-driven professional with proven experience in " + sharedSkillStr +
                ", directly aligned with this role's requirements. " +
                (missingKeywords.isEmpty()
                        ? "Strong keyword alignment makes this a competitive application for the position."
                        : "To further strengthen this application, incorporating experience with " +
                          missingKeywords.stream().limit(2).collect(Collectors.joining(" and ")) +
                          " would improve ATS pass rates and recruiter relevance.");

        TailorResponse response = new TailorResponse();
        response.matchScore = matchScore;
        response.missingKeywords = missingKeywords;
        response.rewrittenBullets = bullets;
        response.suggestedSkills = suggestedSkills.isEmpty() ? List.of("Agile/Scrum", "Technical Documentation") : suggestedSkills;
        response.tailoredSummary = tailoredSummary;
        return response;
    }

    // ─── Helper: rewrite a bullet point to emphasize a JD keyword ─────────────
    private String rewriteBulletForJD(String original, String jdKeyword) {
        if (original.length() < 10) return original;
        // Ensure starts with strong action verb
        String[] actionVerbs = {"Engineered", "Developed", "Delivered", "Implemented", "Optimized", "Designed"};
        String verb = actionVerbs[(Math.abs(original.hashCode())) % actionVerbs.length];
        // If original already starts with a verb, keep it but enhance
        if (original.matches("^[A-Z][a-z]+ed.*") || original.matches("^[A-Z][a-z]+ed.*")) {
            return original + ", leveraging " + jdKeyword + " to drive measurable impact and scalability.";
        }
        return verb + " " + original.substring(0, 1).toLowerCase() + original.substring(1) +
                ", applying " + jdKeyword + " principles to deliver production-ready outcomes.";
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    /** Clean raw PDF-extracted text: collapse whitespace, remove junk lines */
    private String preprocessResumeText(String text) {
        if (text == null) return "";
        // Collapse multiple blank lines into one
        String cleaned = text.replaceAll("(\r?\n){3,}", "\n\n");
        // Remove lines that are purely whitespace or very short noise (page numbers, etc.)
        cleaned = Arrays.stream(cleaned.split("\n"))
                .filter(line -> line.trim().length() > 1)
                .collect(Collectors.joining("\n"));
        // Truncate to ~4000 chars to keep Gemini response fast on constrained hosting
        if (cleaned.length() > 4000) {
            cleaned = cleaned.substring(0, 4000) + "\n...[truncated]";
        }
        return cleaned.trim();
    }

    /** Strip markdown code fences and extract the JSON object */
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
}
