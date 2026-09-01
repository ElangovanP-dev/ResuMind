package com.resumeanalyzer.evaluator;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Evaluates Pillar 3: Impact & Accomplishment Quantification (25% Weight).
 * Detects STAR methodology (Situation, Task, Action, Result) and quantifies metrics (%, $, throughput, scale).
 */
@Component
public class ImpactQuantificationEvaluator {

    private static final Pattern PERCENT_PATTERN = Pattern.compile("\\b\\d+(\\.\\d+)?%\\b");
    private static final Pattern CURRENCY_PATTERN = Pattern.compile("\\$\\d+([,\\.]\\d+)?[KMBkmb]?");
    private static final Pattern SCALE_PATTERN = Pattern.compile("\\b\\d+([,\\.]\\d+)?\\s*(users|clients|teams|microservices|servers|requests|nodes|engineers|projects|releases)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern NUMERIC_PATTERN = Pattern.compile("\\b\\d+(\\.\\d+)?\\b");

    public Map<String, Object> evaluate(String text) {
        if (text == null || text.isBlank()) {
            return Map.of(
                "score", 20,
                "summary", "No bullet points or accomplishment statements detected.",
                "strong_bullets", List.of(),
                "weak_bullets", List.of("Add measurable metrics like %, $, or team size")
            );
        }

        String[] lines = text.split("\n");
        List<String> bulletLines = Arrays.stream(lines)
                .map(String::trim)
                .filter(l -> l.startsWith("-") || l.startsWith("•") || l.startsWith("*") || l.length() > 30)
                .collect(Collectors.toList());

        int score = 30;
        List<String> strongBullets = new ArrayList<>();
        List<String> weakBullets = new ArrayList<>();

        int metricCount = 0;
        int starPatternCount = 0;

        for (String bullet : bulletLines) {
            String lower = bullet.toLowerCase();
            boolean hasPercent = PERCENT_PATTERN.matcher(bullet).find();
            boolean hasCurrency = CURRENCY_PATTERN.matcher(bullet).find();
            boolean hasScale = SCALE_PATTERN.matcher(bullet).find();
            boolean hasNumbers = NUMERIC_PATTERN.matcher(bullet).find();

            // Check STAR indicators (Action verb + Result metric/outcome)
            boolean startsWithVerb = bullet.matches("(?i)^[-•*]?\\s*(led|built|developed|engineered|optimized|increased|reduced|launched|architected|spearheaded|delivered|designed|created|automated).*");
            boolean hasOutcome = hasPercent || hasCurrency || hasScale || lower.contains("resulting in") || lower.contains("improved") || lower.contains("reduced");

            if (hasPercent || hasCurrency || hasScale) {
                metricCount++;
            }

            if (startsWithVerb && hasOutcome) {
                starPatternCount++;
                if (strongBullets.size() < 3) {
                    strongBullets.add(bullet.replaceAll("^[-•*]\\s*", ""));
                }
            } else if (!hasNumbers && bullet.length() > 25) {
                if (weakBullets.size() < 3) {
                    weakBullets.add(bullet.replaceAll("^[-•*]\\s*", ""));
                }
            }
        }

        // Score Calculation
        score += Math.min(metricCount * 12, 36);
        score += Math.min(starPatternCount * 10, 30);
        if (bulletLines.size() > 0 && metricCount > 0) {
            score += 10;
        }

        int finalScore = Math.max(20, Math.min(score, 98));
        String summary = finalScore >= 80
            ? "Outstanding metric quantification! Bullet points use STAR methodology with concrete metrics."
            : finalScore >= 60
            ? "Decent accomplishment descriptions, but several bullets lack quantifiable results (%, $, scale)."
            : "Lacks measurable impact. Upgrade achievement statements with numbers, percentages, or dollar values.";

        Map<String, Object> result = new HashMap<>();
        result.put("score", finalScore);
        result.put("summary", summary);
        result.put("strong_bullets", strongBullets);
        result.put("weak_bullets", weakBullets);
        result.put("metricCount", metricCount);
        result.put("starCount", starPatternCount);
        return result;
    }
}
