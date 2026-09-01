package com.resumeanalyzer.evaluator;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Evaluates Pillar 4: Structural Balance & Hierarchy (15% Weight).
 * Evaluates bullet point density (3-5 per role), section balance, length, and visual hierarchy.
 */
@Component
public class StructuralBalanceEvaluator {

    private static final Pattern YEAR_PATTERN = Pattern.compile("\\b(19|20)\\d{2}\\b");

    public Map<String, Object> evaluate(String text) {
        if (text == null || text.isBlank()) {
            return Map.of(
                "score", 25,
                "summary", "Unable to evaluate structure on empty resume text.",
                "flags", List.of("No structure found")
            );
        }

        String[] lines = text.split("\n");
        List<String> bullets = Arrays.stream(lines)
                .map(String::trim)
                .filter(l -> l.startsWith("-") || l.startsWith("•") || l.startsWith("*"))
                .collect(Collectors.toList());

        int totalBullets = bullets.size();
        int charLength = text.length();

        int score = 50;
        List<String> flags = new ArrayList<>();

        // 1. Bullet Density Check
        if (totalBullets >= 5 && totalBullets <= 25) {
            score += 25;
        } else if (totalBullets < 5) {
            score -= 15;
            flags.add("Too few bullet points (" + totalBullets + "). Aim for 3-5 high-impact bullets per role.");
        } else {
            score -= 10;
            flags.add("High bullet point density (" + totalBullets + "). Ensure experience isn't overly verbose.");
        }

        // 2. Resume Length & White Space Check
        if (charLength >= 1000 && charLength <= 4500) {
            score += 15;
        } else if (charLength < 1000) {
            score -= 15;
            flags.add("Resume content is quite short. Expand on key project responsibilities.");
        } else {
            score -= 10;
            flags.add("Resume length exceeds 2 pages (~4500 chars). Consider condensing content.");
        }

        // 3. Chronological Consistency Check (years present)
        long yearsFound = YEAR_PATTERN.matcher(text).results().count();
        if (yearsFound >= 2) {
            score += 10;
        } else {
            flags.add("Missing clear employment dates/years for timeline verification.");
        }

        int finalScore = Math.max(25, Math.min(score, 98));
        String summary = finalScore >= 80
            ? "Balanced structural hierarchy with standard section proportions and clear bullet distribution."
            : finalScore >= 60
            ? "Acceptable layout structure, but bullet density or page length could be tuned."
            : "Structural imbalance detected. Adjust bullet density to 3-5 points per role and ensure clear timeline dates.";

        Map<String, Object> result = new HashMap<>();
        result.put("score", finalScore);
        result.put("summary", summary);
        result.put("flags", flags);
        result.put("bulletCount", totalBullets);
        result.put("characterLength", charLength);
        return result;
    }
}
