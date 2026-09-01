package com.resumeanalyzer.evaluator;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Evaluates Pillar 5: Clarity & Executive Tone (10% Weight).
 * Flags passive voice, filler phrases, and weak verbs, providing precise one-click active verb replacements.
 */
@Component
public class ClarityExecutiveToneEvaluator {

    // Common filler & weak phrasing patterns
    private static final Map<String, String> WEAK_VERB_REPLACEMENTS = new LinkedHashMap<>();
    static {
        WEAK_VERB_REPLACEMENTS.put("responsible for managing", "Orchestrated");
        WEAK_VERB_REPLACEMENTS.put("responsible for leading", "Spearheaded");
        WEAK_VERB_REPLACEMENTS.put("responsible for", "Spearheaded");
        WEAK_VERB_REPLACEMENTS.put("duties included", "Executed");
        WEAK_VERB_REPLACEMENTS.put("worked on developing", "Engineered");
        WEAK_VERB_REPLACEMENTS.put("worked on", "Engineered");
        WEAK_VERB_REPLACEMENTS.put("helped with", "Accelerated");
        WEAK_VERB_REPLACEMENTS.put("helped", "Facilitated");
        WEAK_VERB_REPLACEMENTS.put("assisted in", "Collaborated on");
        WEAK_VERB_REPLACEMENTS.put("assisted with", "Coordinated");
        WEAK_VERB_REPLACEMENTS.put("participated in", "Spearheaded");
        WEAK_VERB_REPLACEMENTS.put("handled", "Executed");
        WEAK_VERB_REPLACEMENTS.put("tasked with", "Commissioned to deliver");
        WEAK_VERB_REPLACEMENTS.put("made changes to", "Refactored");
        WEAK_VERB_REPLACEMENTS.put("wrote code for", "Engineered");
        WEAK_VERB_REPLACEMENTS.put("supported the team with", "Streamlined");
    }

    private static final Pattern PASSIVE_PATTERN = Pattern.compile(
        "\\b(was|were|been|being|is|are)\\s+([a-zA-Z]+ed|[a-zA-Z]+en)\\b",
        Pattern.CASE_INSENSITIVE
    );

    public Map<String, Object> evaluate(String text) {
        if (text == null || text.isBlank()) {
            return Map.of(
                "score", 30,
                "summary", "Unable to evaluate tone on empty resume text.",
                "passive_count", 0,
                "filler_count", 0,
                "flags", List.of("No text to evaluate"),
                "fixes", List.of("Add experience descriptions with active verbs"),
                "verb_replacements", List.of()
            );
        }

        String lowerText = text.toLowerCase();
        int score = 75;
        List<String> flags = new ArrayList<>();
        List<String> fixes = new ArrayList<>();
        List<Map<String, String>> verbReplacements = new ArrayList<>();

        // 1. Detect passive voice constructions
        Matcher passiveMatcher = PASSIVE_PATTERN.matcher(text);
        int passiveCount = 0;
        Set<String> passiveSnippets = new LinkedHashSet<>();
        while (passiveMatcher.find()) {
            passiveCount++;
            if (passiveSnippets.size() < 3) {
                passiveSnippets.add(passiveMatcher.group());
            }
        }

        if (passiveCount > 4) {
            score -= 20;
            flags.add("High passive voice usage (" + passiveCount + " instances detected, e.g., '" + String.join("', '", passiveSnippets) + "')");
            fixes.add("Reframe statements from passive to active voice (e.g., 'Engineered by team' -> 'Engineered scalable system')");
        } else if (passiveCount > 1) {
            score -= 10;
            flags.add("A few passive voice phrases detected (" + passiveCount + " instances)");
            fixes.add("Convert remaining passive constructions into decisive action statements");
        } else {
            score += 15;
        }

        // 2. Detect weak phrasing and collect 1-click active verb upgrades
        int fillerCount = 0;
        for (Map.Entry<String, String> entry : WEAK_VERB_REPLACEMENTS.entrySet()) {
            String phrase = entry.getKey();
            if (lowerText.contains(phrase)) {
                fillerCount++;
                if (verbReplacements.size() < 5) {
                    // Capitalize original matching phrase for nice display
                    String displayOriginal = Character.toUpperCase(phrase.charAt(0)) + phrase.substring(1);
                    verbReplacements.add(Map.of(
                        "original", displayOriginal,
                        "replacement", entry.getValue()
                    ));
                }
            }
        }

        if (fillerCount > 0) {
            score -= Math.min(fillerCount * 8, 25);
            flags.add(fillerCount + " weak/filler phrases found (such as 'Responsible for', 'Worked on', 'Helped')");
            fixes.add("Use high-impact executive action verbs like 'Spearheaded', 'Engineered', 'Orchestrated', 'Optimized'");
        } else {
            score += 10;
            // Provide default strong verb suggestions if none detected
            if (verbReplacements.isEmpty()) {
                verbReplacements.add(Map.of("original", "Responsible for", "replacement", "Spearheaded"));
                verbReplacements.add(Map.of("original", "Worked on", "replacement", "Engineered"));
                verbReplacements.add(Map.of("original", "Helped", "replacement", "Facilitated"));
            }
        }

        int finalScore = Math.max(25, Math.min(score, 98));
        String summary = finalScore >= 80
            ? "Decisive executive tone with strong action verbs and minimal passive phrasing."
            : finalScore >= 60
            ? "Generally clear tone, but contains some passive constructions or weak introductory verbs."
            : "Requires active tone refinement. Replace passive phrasing ('was built') and filler verbs with strong action verbs.";

        Map<String, Object> result = new HashMap<>();
        result.put("score", finalScore);
        result.put("summary", summary);
        result.put("passive_count", passiveCount);
        result.put("filler_count", fillerCount);
        result.put("flags", flags);
        result.put("fixes", fixes);
        result.put("verb_replacements", verbReplacements);
        return result;
    }
}
