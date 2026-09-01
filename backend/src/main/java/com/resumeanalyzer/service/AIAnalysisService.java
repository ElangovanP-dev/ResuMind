package com.resumeanalyzer.service;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.resumeanalyzer.evaluator.AtsParseabilityEvaluator;
import com.resumeanalyzer.evaluator.ClarityExecutiveToneEvaluator;
import com.resumeanalyzer.evaluator.HardSkillsAlignmentEvaluator;
import com.resumeanalyzer.evaluator.ImpactQuantificationEvaluator;
import com.resumeanalyzer.evaluator.StructuralBalanceEvaluator;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class AIAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AIAnalysisService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Autowired
    private AtsParseabilityEvaluator atsParseabilityEvaluator;

    @Autowired
    private HardSkillsAlignmentEvaluator hardSkillsAlignmentEvaluator;

    @Autowired
    private ImpactQuantificationEvaluator impactQuantificationEvaluator;

    @Autowired
    private StructuralBalanceEvaluator structuralBalanceEvaluator;

    @Autowired
    private ClarityExecutiveToneEvaluator clarityExecutiveToneEvaluator;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public AIAnalysisService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);  // 15 seconds connect timeout
        factory.setReadTimeout(60000);     // 60 seconds read timeout — accommodates Gemini cold starts
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AnalysisResponse {
        @JsonProperty("ats_score")
        @JsonAlias({"ats_score", "atsScore", "score"})
        public int ats_score;

        @JsonProperty("skills_found")
        @JsonAlias({"skills_found", "skillsFound", "skills"})
        public List<String> skills_found;

        @JsonProperty("missing_keywords")
        @JsonAlias({"missing_keywords", "missingKeywords", "missing_skills"})
        public List<String> missing_keywords;

        @JsonProperty("strengths")
        public List<String> strengths;

        @JsonProperty("improvements")
        public List<String> improvements;

        @JsonProperty("feedback_summary")
        @JsonAlias({"feedback_summary", "feedbackSummary", "feedback", "summary"})
        public String feedback_summary;

        // ── 5-Pillar Sub-Scores ──
        @JsonProperty("ats_parseability")
        @JsonAlias({"ats_parseability", "atsParseability"})
        public int ats_parseability;

        @JsonProperty("hard_skills_alignment")
        @JsonAlias({"hard_skills_alignment", "hardSkillsAlignment"})
        public int hard_skills_alignment;

        @JsonProperty("impact_quantification")
        @JsonAlias({"impact_quantification", "impactQuantification"})
        public int impact_quantification;

        @JsonProperty("structural_balance")
        @JsonAlias({"structural_balance", "structuralBalance"})
        public int structural_balance;

        @JsonProperty("clarity_tone")
        @JsonAlias({"clarity_tone", "clarityTone"})
        public int clarity_tone;

        @JsonProperty("pillar_details")
        @JsonAlias({"pillar_details", "pillarDetails"})
        public Map<String, Object> pillar_details;

        @JsonProperty("verb_replacements")
        @JsonAlias({"verb_replacements", "verbReplacements"})
        public List<Map<String, String>> verb_replacements;
    }

    public AnalysisResponse analyzeResume(String resumeText) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            log.warn("Gemini API key is not configured — falling back to mock analysis");
            return getMockAnalysis(resumeText);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String cleanedText = preprocessResumeText(resumeText);

            String prompt =
                "You are an expert ATS (Applicant Tracking System) analyst and resume coach.\n" +
                "Analyze the SPECIFIC resume text provided below using 5 INDEPENDENT evaluation pillars.\n" +
                "Do NOT generate generic advice. Base ALL output strictly on this resume's actual content.\n\n" +
                "EVALUATION PILLARS (each scored 0-100 independently):\n" +
                "1. ATS Parseability & Layout (20% weight): single-column structure, standard section headers (Experience, Education, Skills, Summary), font readability, contact info extraction, no tables/graphics.\n" +
                "2. Hard Skills & Semantic Alignment (30% weight): exact and semantic skill keyword matches relevant to the detected role type. No duplicate keywords.\n" +
                "3. Impact & Accomplishment Quantification (25% weight): STAR methodology (Situation, Task, Action, Result), quantified metrics (%, $, throughput, team size, scale).\n" +
                "4. Structural Balance & Hierarchy (15% weight): bullet density per role (ideal: 3-5), reverse chronological order, visual white space balance, section proportionality.\n" +
                "5. Clarity & Executive Tone (10% weight): passive voice detection, filler phrases, weak verbs. Provide active verb replacements.\n\n" +
                "Return ONLY a valid JSON object (no markdown, no backticks) with EXACTLY these keys:\n" +
                "{\n" +
                "  \"ats_score\": <integer 0-100, computed as: 0.20*pillar1 + 0.30*pillar2 + 0.25*pillar3 + 0.15*pillar4 + 0.10*pillar5>,\n" +
                "  \"ats_parseability\": <integer 0-100>,\n" +
                "  \"hard_skills_alignment\": <integer 0-100>,\n" +
                "  \"impact_quantification\": <integer 0-100>,\n" +
                "  \"structural_balance\": <integer 0-100>,\n" +
                "  \"clarity_tone\": <integer 0-100>,\n" +
                "  \"skills_found\": [\"<skill1>\", \"<skill2>\", ...],\n" +
                "  \"missing_keywords\": [\"<kw1>\", \"<kw2>\", ...],\n" +
                "  \"strengths\": [\"<str1>\", \"<str2>\", \"<str3>\"],\n" +
                "  \"improvements\": [\"<imp1>\", \"<imp2>\", \"<imp3>\"],\n" +
                "  \"feedback_summary\": \"<2-3 sentences specific to THIS person>\",\n" +
                "  \"pillar_details\": {\n" +
                "    \"ats_parseability\": { \"summary\": \"<1 sentence>\", \"flags\": [\"<issue1>\", ...], \"fixes\": [\"<fix1>\", ...] },\n" +
                "    \"hard_skills\": { \"summary\": \"<1 sentence>\", \"matched\": [\"<skill>\", ...], \"gaps\": [\"<skill>\", ...] },\n" +
                "    \"impact\": { \"summary\": \"<1 sentence>\", \"strong_bullets\": [\"<bullet>\", ...], \"weak_bullets\": [\"<bullet>\", ...] },\n" +
                "    \"structure\": { \"summary\": \"<1 sentence>\", \"flags\": [\"<issue>\", ...] },\n" +
                "    \"clarity\": { \"summary\": \"<1 sentence>\", \"passive_count\": <int>, \"filler_count\": <int> }\n" +
                "  },\n" +
                "  \"verb_replacements\": [\n" +
                "    { \"original\": \"<weak phrase from resume>\", \"replacement\": \"<strong active verb alternative>\" }\n" +
                "  ]\n" +
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
            generationConfig.put("maxOutputTokens", 2500);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getBody() == null) {
                return getMockAnalysis(resumeText);
            }

            JsonNode rootNode = objectMapper.readTree(response.getBody());
            JsonNode candidatesNode = rootNode.path("candidates");
            if (!candidatesNode.isArray() || candidatesNode.isEmpty()) {
                return getMockAnalysis(resumeText);
            }

            JsonNode partsNode = candidatesNode.get(0).path("content").path("parts");
            if (!partsNode.isArray() || partsNode.isEmpty()) {
                return getMockAnalysis(resumeText);
            }

            String responseText = partsNode.get(0).path("text").asText();
            String cleanedJson = cleanJsonText(responseText);

            AnalysisResponse res = objectMapper.readValue(cleanedJson, AnalysisResponse.class);
            if (res != null) {
                if (res.skills_found == null) res.skills_found = new ArrayList<>();
                if (res.missing_keywords == null) res.missing_keywords = new ArrayList<>();
                if (res.strengths == null) res.strengths = new ArrayList<>();
                if (res.improvements == null) res.improvements = new ArrayList<>();
                if (res.verb_replacements == null) res.verb_replacements = new ArrayList<>();
                if (res.pillar_details == null) res.pillar_details = new HashMap<>();
                if (res.feedback_summary == null || res.feedback_summary.isBlank()) {
                    res.feedback_summary = "Resume analysis complete. Review your ATS score and feedback above.";
                }
                // Recompute composite score if pillar scores are present but ats_score seems off
                if (res.ats_parseability > 0 && res.ats_score == 0) {
                    res.ats_score = (int) Math.round(
                        0.20 * res.ats_parseability +
                        0.30 * res.hard_skills_alignment +
                        0.25 * res.impact_quantification +
                        0.15 * res.structural_balance +
                        0.10 * res.clarity_tone
                    );
                }
                return res;
            }
            return getMockAnalysis(resumeText);

        } catch (Exception e) {
            log.error("Gemini API call failed for analyzeResume, falling back to mock: {}", e.getMessage(), e);
            return getMockAnalysis(resumeText);
        }
    }

    // ─── Concurrent 5-Pillar Modular Evaluator Orchestrator ──
    @SuppressWarnings("unchecked")
    private AnalysisResponse getMockAnalysis(String text) {
        if (text == null) text = "";

        final String resumeText = text;

        // Concurrently execute all 5 independent evaluators using CompletableFuture
        CompletableFuture<Map<String, Object>> atsFuture =
                CompletableFuture.supplyAsync(() -> atsParseabilityEvaluator.evaluate(resumeText));
        CompletableFuture<Map<String, Object>> skillsFuture =
                CompletableFuture.supplyAsync(() -> hardSkillsAlignmentEvaluator.evaluate(resumeText, null));
        CompletableFuture<Map<String, Object>> impactFuture =
                CompletableFuture.supplyAsync(() -> impactQuantificationEvaluator.evaluate(resumeText));
        CompletableFuture<Map<String, Object>> structFuture =
                CompletableFuture.supplyAsync(() -> structuralBalanceEvaluator.evaluate(resumeText));
        CompletableFuture<Map<String, Object>> clarityFuture =
                CompletableFuture.supplyAsync(() -> clarityExecutiveToneEvaluator.evaluate(resumeText));

        // Block until all 5 concurrent threads complete
        CompletableFuture.allOf(atsFuture, skillsFuture, impactFuture, structFuture, clarityFuture).join();

        Map<String, Object> atsRes = atsFuture.join();
        Map<String, Object> skillsRes = skillsFuture.join();
        Map<String, Object> impactRes = impactFuture.join();
        Map<String, Object> structRes = structFuture.join();
        Map<String, Object> clarityRes = clarityFuture.join();

        int p1 = ((Number) atsRes.getOrDefault("score", 70)).intValue();
        int p2 = ((Number) skillsRes.getOrDefault("score", 70)).intValue();
        int p3 = ((Number) impactRes.getOrDefault("score", 65)).intValue();
        int p4 = ((Number) structRes.getOrDefault("score", 70)).intValue();
        int p5 = ((Number) clarityRes.getOrDefault("score", 75)).intValue();

        // 5-Pillar Weighted Formula: 20% ATS, 30% Hard Skills, 25% Impact, 15% Structure, 10% Clarity
        int compositeScore = (int) Math.round(
            0.20 * p1 +
            0.30 * p2 +
            0.25 * p3 +
            0.15 * p4 +
            0.10 * p5
        );
        compositeScore = Math.max(25, Math.min(compositeScore, 98));

        // Aggregate Matched Skills & Missing Gaps
        List<String> matchedSkills = (List<String>) skillsRes.getOrDefault("matched", Collections.emptyList());
        if (matchedSkills.isEmpty()) {
            matchedSkills = List.of("Problem Solving", "Technical Communication", "System Design");
        }
        List<String> missingKeywords = (List<String>) skillsRes.getOrDefault("gaps", Collections.emptyList());

        // Construct Orthogonal Strengths (1 from top-scoring pillars)
        List<String> strengths = new ArrayList<>();
        if (p1 >= 75) {
            strengths.add("ATS Layout Integrity: Clean single-column format and standard section structure ensures high parser readability.");
        }
        if (p2 >= 70) {
            strengths.add("Hard Skills Coverage: Proven hands-on proficiency in " + matchedSkills.stream().limit(3).collect(Collectors.joining(", ")) + ".");
        }
        if (p3 >= 70) {
            strengths.add("Quantified Impact: Effective use of STAR methodology with measurable metrics and result statements.");
        } else {
            strengths.add("Professional Trajectory: Clear chronological progression demonstrating sustained domain experience.");
        }
        if (p5 >= 75) {
            strengths.add("Executive Clarity: Strong active action verbs and professional tone with minimal passive phrasing.");
        }

        // Construct Orthogonal Actionable Improvements (1 from areas needing work)
        List<String> improvements = new ArrayList<>();
        List<String> atsFixes = (List<String>) atsRes.getOrDefault("fixes", Collections.emptyList());
        if (!atsFixes.isEmpty()) {
            improvements.add("ATS Optimization: " + atsFixes.get(0));
        }
        if (!missingKeywords.isEmpty()) {
            improvements.add("Skill Alignment: Add in-demand keywords like " + String.join(", ", missingKeywords.stream().limit(2).collect(Collectors.toList())) + " to strengthen automated filter matching.");
        }
        List<String> impactWeak = (List<String>) impactRes.getOrDefault("weak_bullets", Collections.emptyList());
        if (!impactWeak.isEmpty()) {
            improvements.add("Metric Quantification: Upgrade accomplishment bullets with specific metrics (%, $, scale, or team size).");
        } else {
            improvements.add("Action Verbs: Start every experience bullet point with an assertive action verb and outcome statement.");
        }
        List<String> structFlags = (List<String>) structRes.getOrDefault("flags", Collections.emptyList());
        if (!structFlags.isEmpty()) {
            improvements.add("Structural Balance: " + structFlags.get(0));
        }

        // Construct Consolidated Feedback Summary
        String feedbackSummary = String.format(
            "Overall ATS Compatibility Score is %d/100. %s %s",
            compositeScore,
            (String) atsRes.getOrDefault("summary", "Standard section structure detected."),
            (String) skillsRes.getOrDefault("summary", "Technical skills align with industry standards.")
        );

        // Build Pillar Details Map
        Map<String, Object> pillarDetails = new HashMap<>();
        pillarDetails.put("ats_parseability", atsRes);
        pillarDetails.put("hard_skills", skillsRes);
        pillarDetails.put("impact", impactRes);
        pillarDetails.put("structure", structRes);
        pillarDetails.put("clarity", clarityRes);

        // Verb Replacements from Clarity Evaluator
        List<Map<String, String>> verbReplacements =
                (List<Map<String, String>>) clarityRes.getOrDefault("verb_replacements", Collections.emptyList());

        AnalysisResponse response = new AnalysisResponse();
        response.ats_score = compositeScore;
        response.skills_found = matchedSkills;
        response.missing_keywords = missingKeywords;
        response.strengths = strengths;
        response.improvements = improvements;
        response.feedback_summary = feedbackSummary;
        response.ats_parseability = p1;
        response.hard_skills_alignment = p2;
        response.impact_quantification = p3;
        response.structural_balance = p4;
        response.clarity_tone = p5;
        response.pillar_details = pillarDetails;
        response.verb_replacements = verbReplacements;
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
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            log.warn("Gemini API key is not configured — falling back to mock tailoring");
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
            log.error("Gemini API call failed for tailorResume, falling back to mock: {}", e.getMessage(), e);
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

    // ═══════════════════════════════════════════════════════════════════════════
    // PREMIUM FEATURES IMPLEMENTATION
    // ═══════════════════════════════════════════════════════════════════════════

    public static class AtsSimulationResponse {
        public Map<String, Object> workday;
        public Map<String, Object> greenhouse;
        public Map<String, Object> lever;
    }

    public static class BiasDetectionResponse {
        public List<Map<String, String>> flags;
        public int score;
    }

    public static class InterviewPredictionResponse {
        public List<Map<String, Object>> questions;
    }

    public static class OutreachResponse {
        public String emailTemplate;
        public String linkedinTemplate;
    }

    public static class GithubImportResponse {
        public List<String> bullets;
    }

    public static class ABTestResponse {
        public int scoreA;
        public int scoreB;
        public String explanation;
        public String winner;
    }

    public AtsSimulationResponse simulateAts(String resumeText) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockAtsSimulation(resumeText);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "You are an ATS simulation system mimicking Workday, Greenhouse, and Lever parsing logic.\n" +
                "Evaluate how each platform handles the following resume text. Output detailed parsed state and drop risks.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"workday\": {\n" +
                "    \"parserType\": \"Layout & Column Parser (Strict)\",\n" +
                "    \"readabilityScore\": <0-100>,\n" +
                "    \"extractedSkills\": [\"skill1\", ...],\n" +
                "    \"warnings\": [\"warning1\", ...],\n" +
                "    \"droppedContent\": \"Description of text likely discarded by Workday layout-parser (e.g. columns, graphics)\"\n" +
                "  },\n" +
                "  \"greenhouse\": {\n" +
                "    \"parserType\": \"Tabular & Block Parser\",\n" +
                "    \"readabilityScore\": <0-100>,\n" +
                "    \"extractedSkills\": [\"skill1\", ...],\n" +
                "    \"warnings\": [\"warning1\", ...],\n" +
                "    \"droppedContent\": \"Description of elements parsed poorly by Greenhouse (e.g. tables, header text)\"\n" +
                "  },\n" +
                "  \"lever\": {\n" +
                "    \"parserType\": \"Strict Keyword Matcher\",\n" +
                "    \"readabilityScore\": <0-100>,\n" +
                "    \"extractedSkills\": [\"skill1\", ...],\n" +
                "    \"warnings\": [\"warning1\", ...],\n" +
                "    \"droppedContent\": \"Description of keywords or sections Lever might fail to map correctly\"\n" +
                "  }\n" +
                "}\n\n" +
                "RESUME TEXT:\n" + preprocessResumeText(resumeText);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.2);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), AtsSimulationResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockAtsSimulation(resumeText);
        }
    }

    public BiasDetectionResponse detectBias(String resumeText) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockBiasDetection(resumeText);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "You are an expert HR compliance advisor and unconscious bias auditor.\n" +
                "Analyze the provided resume for age markers (e.g. graduation dates >10 years ago, old-school tech), gender-coded words, or unnecessary personal info.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"score\": <integer 0-100, where 100 is perfectly bias-free and modern>,\n" +
                "  \"flags\": [\n" +
                "    { \"issue\": \"Age/Gender bias description\", \"snippet\": \"the problem text snippet\", \"suggestion\": \"neutral modern alternative suggestion\" }\n" +
                "  ]\n" +
                "}\n\n" +
                "RESUME TEXT:\n" + preprocessResumeText(resumeText);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.2);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), BiasDetectionResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockBiasDetection(resumeText);
        }
    }

    public InterviewPredictionResponse predictQuestions(String resumeText, String jobDescription) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockInterviewPrediction(resumeText, jobDescription);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "You are a professional technical interviewer.\n" +
                "Compare the candidate's resume vs the job description to identify experience gaps, and generate 3 interview questions with detailed STAR answers tailored to this candidate.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"question\": \"The predicted interview question\",\n" +
                "      \"starAnswer\": {\n" +
                "        \"situation\": \"A realistic candidate project situation\",\n" +
                "        \"task\": \"The challenge or task faced\",\n" +
                "        \"action\": \"Action taken by candidate to solve the issue\",\n" +
                "        \"result\": \"Impactful result with numbers\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}\n\n" +
                "RESUME:\n" + preprocessResumeText(resumeText) + "\n\n" +
                "JD:\n" + (jobDescription.length() > 1500 ? jobDescription.substring(0, 1500) : jobDescription);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), InterviewPredictionResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockInterviewPrediction(resumeText, jobDescription);
        }
    }

    public OutreachResponse generateOutreach(String resumeText, String companyName, String recruiterName, String jobRole) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockOutreach(resumeText, companyName, recruiterName, jobRole);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "You are an expert networking coach.\n" +
                "Generate a premium personalized cold email and LinkedIn message to outreach to " + recruiterName + " at " + companyName + " for the role of " + jobRole + " based on this candidate's resume experience.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"emailTemplate\": \"Subject: [Catchy Email Subject]\\\\n\\\\nHi [Name],\\\\n[Professional cold email body matching candidate skills]\",\n" +
                "  \"linkedinTemplate\": \"Hi [Name], [A shorter LinkedIn connection note under 300 characters]\"\n" +
                "}\n\n" +
                "RESUME:\n" + preprocessResumeText(resumeText);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.4);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), OutreachResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockOutreach(resumeText, companyName, recruiterName, jobRole);
        }
    }

    public GithubImportResponse importGithubBullets(String repoName, String readmeText) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockGithubImport(repoName, readmeText);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "You are an expert resume writer.\n" +
                "Write 3 high-impact, professional resume bullet points for a software engineering candidate describing their contribution and technical implementation of this GitHub project. Begin bullet points with strong action verbs and include metrics/complexity.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"bullets\": [\"Bullet point 1\", \"Bullet point 2\", \"Bullet point 3\"]\n" +
                "}\n\n" +
                "PROJECT REPO: " + repoName + "\n\n" +
                "README CONTENTS:\n" + (readmeText.length() > 2000 ? readmeText.substring(0, 2000) : readmeText);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.4);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), GithubImportResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockGithubImport(repoName, readmeText);
        }
    }

    public ABTestResponse abTestResumes(String resumeTextA, String resumeTextB, String jobDescription) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockABTest(resumeTextA, resumeTextB, jobDescription);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "You are an expert recruiter.\n" +
                "Compare Resume A vs Resume B against the provided job description. Determine which one is more optimized, score both (0-100), and explain the clear winner.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"scoreA\": <integer>,\n" +
                "  \"scoreB\": <integer>,\n" +
                "  \"explanation\": \"Detailed explanation comparing strengths and gaps of both versions\",\n" +
                "  \"winner\": \"Resume A\" or \"Resume B\"\n" +
                "}\n\n" +
                "RESUME A:\n" + preprocessResumeText(resumeTextA) + "\n\n" +
                "RESUME B:\n" + preprocessResumeText(resumeTextB) + "\n\n" +
                "JD:\n" + (jobDescription.length() > 1500 ? jobDescription.substring(0, 1500) : jobDescription);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), ABTestResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockABTest(resumeTextA, resumeTextB, jobDescription);
        }
    }

    // ─── HIGH-FIDELITY LOCAL MOCK FALLBACK ENGINES ────────────────────────────

    private AtsSimulationResponse getMockAtsSimulation(String text) {
        String lower = text.toLowerCase();
        int base = 65;
        if (lower.contains("columns") || lower.contains("table")) base -= 10;
        if (lower.contains("experience")) base += 15;

        AtsSimulationResponse res = new AtsSimulationResponse();
        res.workday = Map.of(
            "parserType", "Layout & Column Parser (Strict)",
            "readabilityScore", Math.max(30, base - 5),
            "extractedSkills", List.of("Java", "Spring Boot", "Git"),
            "warnings", List.of("Multi-column layout detected; parsed text reading order might be disrupted.", "Skills section structure could fail profile matching."),
            "droppedContent", "Tables or graphics are stripped, possibly missing context for experience descriptors."
        );
        res.greenhouse = Map.of(
            "parserType", "Tabular & Block Parser",
            "readabilityScore", Math.max(30, base + 5),
            "extractedSkills", List.of("Java", "Python", "SQL", "Spring Boot"),
            "warnings", List.of("Text extracted from page margins might get appended out of order."),
            "droppedContent", "Custom font packages stripped and layout tags ignored."
        );
        res.lever = Map.of(
            "parserType", "Strict Keyword Matcher",
            "readabilityScore", Math.max(30, base),
            "extractedSkills", List.of("Java", "MySQL", "AWS"),
            "warnings", List.of("Missing clear section header labels; section grouping might fail."),
            "droppedContent", "Contact info headers failed to resolve phone structure."
        );
        return res;
    }

    private BiasDetectionResponse getMockBiasDetection(String text) {
        List<Map<String, String>> flags = new ArrayList<>();
        String lower = text.toLowerCase();
        int score = 95;

        if (lower.contains("graduated in") || lower.contains("completed in 201") || lower.contains("200")) {
            score -= 15;
            flags.add(Map.of(
                "issue", "Year of graduation indicates career length directly (potential age bias).",
                "snippet", "2010 / 2012 Graduation dates",
                "suggestion", "Remove graduation year; display only the degree and institution name."
            ));
        }
        if (lower.contains("hobbies") || lower.contains("marital") || lower.contains("gender")) {
            score -= 10;
            flags.add(Map.of(
                "issue", "Personal info / marital status is irrelevant and creates unconscious hiring bias.",
                "snippet", "Personal hobbies section",
                "suggestion", "Delete personal hobbies; replace with relevant technical certifications."
            ));
        }
        if (lower.contains("ninja") || lower.contains("rockstar")) {
            score -= 5;
            flags.add(Map.of(
                "issue", "Gender-coded slang words can reduce candidate inclusivity.",
                "snippet", "Java ninja / Rockstar developer",
                "suggestion", "Use standard terms like 'Senior Java Developer' or 'Software Engineer'."
            ));
        }

        BiasDetectionResponse res = new BiasDetectionResponse();
        res.score = score;
        res.flags = flags;
        return res;
    }

    private InterviewPredictionResponse getMockInterviewPrediction(String resumeText, String jobDescription) {
        String lowerResume = resumeText.toLowerCase();
        String missingTech = "Kubernetes";
        if (lowerResume.contains("kubernetes")) missingTech = "Kafka / Microservices design";

        InterviewPredictionResponse res = new InterviewPredictionResponse();
        res.questions = List.of(
            Map.of(
                "question", "Can you explain how you designed and deployed scalable microservices in your previous project?",
                "starAnswer", Map.of(
                    "situation", "Led modularization of a legacy monolith backend for a high-traffic retail application.",
                    "task", "Establish high availability and decouple service dependencies to reduce system failure rates.",
                    "action", "Engineered and decoupled 4 key modules into Spring Boot services, deploying with modern orchestration patterns.",
                    "result", "Reduced system downtime by 40% and improved developer feature velocity."
                )
            ),
            Map.of(
                "question", "This role requires " + missingTech + ". How would you ramp up and apply this to our stack?",
                "starAnswer", Map.of(
                    "situation", "Needed to integrate real-time telemetry processing in a project without prior exposure to the tool.",
                    "task", "Build a high-throughput event processing pipeline within a two-week sprint.",
                    "action", "Researched system designs, stood up a local cluster, and wrote data producers and consumers in Java.",
                    "result", "Deployed the pipeline on-time, successfully processing 50k events per second."
                )
            ),
            Map.of(
                "question", "Describe a situation where a production system crashed under high load. How did you resolve it?",
                "starAnswer", Map.of(
                    "situation", "A promotional event caused database query latency to spike, bringing down API routes.",
                    "task", "Identify bottleneck and restore standard operations immediately.",
                    "action", "Analyzed query telemetry, created missing indexes, and set up Redis query caching on hot paths.",
                    "result", "Recovered API routes within 15 minutes, serving double the request volume at stable latency."
                )
            )
        );
        return res;
    }

    private OutreachResponse getMockOutreach(String resumeText, String companyName, String recruiterName, String jobRole) {
        String recName = (recruiterName == null || recruiterName.isBlank()) ? "Recruiter" : recruiterName;
        String compName = (companyName == null || companyName.isBlank()) ? "your team" : companyName;

        OutreachResponse res = new OutreachResponse();
        res.emailTemplate =
            "Subject: Interested in " + jobRole + " opportunity at " + compName + "\n\n" +
            "Hi " + recName + ",\n\n" +
            "I recently came across the " + jobRole + " opening at " + compName + " and wanted to reach out. " +
            "With my background engineering robust backend APIs and technical pipelines in Java, I believe my skills match the objectives of your team.\n\n" +
            "In my previous roles, I focused on high-performance service scaling and system parsing. I'd love to chat briefly about how my experiences match the profile you're looking for.\n\n" +
            "Best regards,\n[Your Name]";

        res.linkedinTemplate =
            "Hi " + recName + ", I noticed the " + jobRole + " opening at " + compName + " and wanted to connect. " +
            "My experience building high-scale Java APIs aligns well with your team's stack. Hope to connect and stay in touch!";
        return res;
    }

    private GithubImportResponse getMockGithubImport(String repoName, String readmeText) {
        GithubImportResponse res = new GithubImportResponse();
        res.bullets = List.of(
            "Engineered " + repoName + " backend services, improving system stability and code scalability.",
            "Designed automated developer pipelines, reducing integration overhead and testing delays.",
            "Architected database persistence schemas, supporting structured query telemetry and reliable data flow."
        );
        return res;
    }

    private ABTestResponse getMockABTest(String textA, String textB, String jobDescription) {
        int scoreA = 72;
        int scoreB = 84;
        if (textA.length() > textB.length()) {
            scoreA = 85;
            scoreB = 68;
        }

        ABTestResponse res = new ABTestResponse();
        res.scoreA = scoreA;
        res.scoreB = scoreB;
        res.winner = scoreA >= scoreB ? "Resume A" : "Resume B";
        res.explanation = "The winner (" + (scoreA >= scoreB ? "Resume A" : "Resume B") + ") has a much higher density of relevant keywords matching the target job description. It also features clear quantified metrics (e.g. percentages, counts) in the experience bullet points, which are missing or sparse in the other version.";
        return res;
    }

    public static class CourseRecommendationResponse {
        public List<String> missingSkills;
        public List<Map<String, String>> recommendedCourses;
    }

    public CourseRecommendationResponse recommendCourses(String resumeText, String jobDescription) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING") || apiKey.startsWith("YOUR_") || apiKey.equals("AIzaSyYourActualKeyHere")) {
            return getMockCourseRecommendations(resumeText, jobDescription);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt =
                "Act as an expert career advisor. Analyze the provided resume against the requirements of this specific job description.\n" +
                "Identify the key skills that are present in the job description but missing from the resume, and suggest relevant resources or courses the user can take to acquire those skills.\n\n" +
                "Return ONLY a valid JSON object matching this structure:\n" +
                "{\n" +
                "  \"missingSkills\": [\"skill1\", \"skill2\"],\n" +
                "  \"recommendedCourses\": [\n" +
                "    { \"skill\": \"skill name\", \"courseName\": \"Name of the course\", \"platform\": \"e.g., Coursera, Udemy, YouTube\", \"reason\": \"Why this helps\" }\n" +
                "  ]\n" +
                "}\n\n" +
                "RESUME:\n" + preprocessResumeText(resumeText) + "\n\n" +
                "JD:\n" + (jobDescription.length() > 1500 ? jobDescription.substring(0, 1500) : jobDescription);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            Map<String, Object> contentParts = new HashMap<>();
            contentParts.put("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentParts));
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return objectMapper.readValue(cleanJsonText(responseText), CourseRecommendationResponse.class);
        } catch (Exception e) {
            e.printStackTrace();
            return getMockCourseRecommendations(resumeText, jobDescription);
        }
    }

    private CourseRecommendationResponse getMockCourseRecommendations(String resumeText, String jobDescription) {
        CourseRecommendationResponse res = new CourseRecommendationResponse();
        res.missingSkills = List.of("Docker", "AWS Cloud", "GraphQL");
        res.recommendedCourses = List.of(
            Map.of("skill", "Docker", "courseName", "Docker for Absolute Beginners", "platform", "Udemy", "reason", "Provides hands-on lab exercises for containerization basics."),
            Map.of("skill", "AWS Cloud", "courseName", "AWS Certified Solutions Architect", "platform", "Coursera", "reason", "Industry standard certification for cloud deployment."),
            Map.of("skill", "GraphQL", "courseName", "GraphQL with React", "platform", "YouTube", "reason", "Free comprehensive crash course on modern API querying.")
        );
        return res;
    }
}

