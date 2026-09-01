package com.resumeanalyzer.evaluator;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Evaluates Pillar 1: ATS Parseability & Layout Integrity (20% Weight).
 * Checks single-column structure, standard section headers, font parsing, and contact metadata.
 */
@Component
public class AtsParseabilityEvaluator {

    private static final List<String> STANDARD_HEADERS = Arrays.asList(
        "experience", "work experience", "employment history", "professional experience",
        "education", "academic background",
        "skills", "technical skills", "core competencies",
        "summary", "professional summary", "profile", "objective",
        "projects", "personal projects",
        "certifications", "licenses"
    );

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
    private static final Pattern LINKEDIN_PATTERN = Pattern.compile("linkedin\\.com/in/[a-zA-Z0-9_-]+");

    public Map<String, Object> evaluate(String text) {
        if (text == null || text.isBlank()) {
            return Map.of(
                "score", 30,
                "summary", "Empty or unparseable resume text.",
                "flags", List.of("No text extracted from resume"),
                "fixes", List.of("Upload a text-searchable PDF resume")
            );
        }

        String lower = text.toLowerCase();
        int score = 40;
        List<String> flags = new ArrayList<>();
        List<String> fixes = new ArrayList<>();

        // 1. Contact Info Detection
        boolean hasEmail = EMAIL_PATTERN.matcher(text).find();
        boolean hasPhone = PHONE_PATTERN.matcher(text).find();
        boolean hasLinkedIn = LINKEDIN_PATTERN.matcher(lower).find() || lower.contains("linkedin.com");

        if (hasEmail) score += 15;
        else {
            flags.add("Missing valid email address in text header");
            fixes.add("Ensure your email address is listed clearly in plain text, not inside image headers");
        }

        if (hasPhone) score += 10;
        else {
            flags.add("Missing contact phone number");
            fixes.add("Include a standard formatted phone number at the top of your resume");
        }

        if (hasLinkedIn) score += 5;

        // 2. Section Headers
        int headersFound = 0;
        for (String header : STANDARD_HEADERS) {
            if (lower.contains(header)) {
                headersFound++;
            }
        }
        int headerPoints = Math.min(headersFound * 6, 25);
        score += headerPoints;

        if (headersFound < 3) {
            flags.add("Non-standard or missing standard section headers (Experience, Education, Skills)");
            fixes.add("Use clear standard titles like 'Professional Experience', 'Education', and 'Skills'");
        }

        // 3. Single Column & Formatting Check
        long tableArtifacts = Arrays.stream(text.split("\n"))
                .filter(line -> line.contains("│") || line.contains("┆") || line.contains("\t\t\t"))
                .count();

        if (tableArtifacts > 2) {
            score -= 10;
            flags.add("Multi-column layout or table elements detected, which can confuse ATS parsers");
            fixes.add("Convert resume layout to a clean, single-column linear format");
        } else {
            score += 10;
        }

        // 4. Character Cleanliness Check
        long nonAsciiCount = text.chars().filter(ch -> ch > 127 && ch != '•' && ch != '–' && ch != '—').count();
        if (nonAsciiCount > 20) {
            flags.add("Unusual unicode or icon characters detected in text extraction");
            fixes.add("Replace custom icons or graphic symbols with bullet points to avoid parsing errors");
        }

        int finalScore = Math.max(20, Math.min(score, 98));
        String summary = finalScore >= 80
            ? "Excellent ATS parseability with clear headers and contact metadata."
            : finalScore >= 60
            ? "Moderate ATS parseability. Standard section headers are mostly intact."
            : "Requires ATS optimization. Key contact info or standard section titles are missing.";

        Map<String, Object> result = new HashMap<>();
        result.put("score", finalScore);
        result.put("summary", summary);
        result.put("flags", flags);
        result.put("fixes", fixes);
        result.put("emailFound", hasEmail);
        result.put("phoneFound", hasPhone);
        result.put("linkedinFound", hasLinkedIn);
        return result;
    }
}
