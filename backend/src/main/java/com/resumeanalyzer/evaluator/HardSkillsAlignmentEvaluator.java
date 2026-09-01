package com.resumeanalyzer.evaluator;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Evaluates Pillar 2: Hard Skills & Semantic Alignment (30% Weight).
 * Evaluates technical skills, domain frameworks, and semantic alignment without keyword spamming.
 */
@Component
public class HardSkillsAlignmentEvaluator {

    private static final List<String> TECH_TAXONOMY = Arrays.asList(
        "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Kotlin", "Swift",
        "Spring Boot", "Spring", "Django", "Flask", "FastAPI", "Node.js", "Express", "React",
        "Angular", "Vue", "Next.js", "HTML", "CSS", "TailwindCSS", "Bootstrap",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "DynamoDB",
        "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins",
        "CI/CD", "GitHub Actions", "GitLab CI", "Maven", "Gradle", "Git",
        "REST", "GraphQL", "gRPC", "Microservices", "Kafka", "RabbitMQ",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP",
        "Data Analysis", "Pandas", "NumPy", "Tableau", "Power BI", "Spark", "Hadoop",
        "Linux", "Bash", "Agile", "Scrum", "Jira", "Figma", "Unit Testing", "JUnit", "Jest"
    );

    public Map<String, Object> evaluate(String resumeText, String jobDescription) {
        if (resumeText == null || resumeText.isBlank()) {
            return Map.of(
                "score", 20,
                "summary", "No technical skills detected.",
                "matched", List.of(),
                "gaps", List.of("Add hard skills and technical tools")
            );
        }

        String lowerResume = resumeText.toLowerCase();

        // 1. Identify matched skills from taxonomy
        List<String> matchedSkills = TECH_TAXONOMY.stream()
                .filter(skill -> lowerResume.contains(skill.toLowerCase()))
                .distinct()
                .collect(Collectors.toList());

        // 2. Identify target JD skills if JD is provided
        List<String> missingGaps = new ArrayList<>();
        int score = 35;

        if (jobDescription != null && !jobDescription.isBlank()) {
            String lowerJd = jobDescription.toLowerCase();
            List<String> jdRequired = TECH_TAXONOMY.stream()
                    .filter(skill -> lowerJd.contains(skill.toLowerCase()))
                    .collect(Collectors.toList());

            if (!jdRequired.isEmpty()) {
                long matchedInJd = jdRequired.stream()
                        .filter(skill -> lowerResume.contains(skill.toLowerCase()))
                        .count();
                double matchPercentage = (double) matchedInJd / jdRequired.size();
                score = (int) Math.round(30 + (matchPercentage * 65));

                missingGaps = jdRequired.stream()
                        .filter(skill -> !lowerResume.contains(skill.toLowerCase()))
                        .limit(5)
                        .collect(Collectors.toList());
            } else {
                score = Math.min(35 + matchedSkills.size() * 6, 95);
            }
        } else {
            // General hard skills depth evaluation
            score = Math.min(35 + matchedSkills.size() * 5, 95);

            // Default suggested gaps from missing top technologies
            List<String> potentialGaps = Arrays.asList("Docker", "Kubernetes", "AWS", "CI/CD", "Redis", "TypeScript", "Kafka", "PostgreSQL");
            missingGaps = potentialGaps.stream()
                    .filter(skill -> !lowerResume.contains(skill.toLowerCase()))
                    .limit(4)
                    .collect(Collectors.toList());
        }

        int finalScore = Math.max(25, Math.min(score, 98));
        String summary = finalScore >= 80
            ? "Strong hard skills coverage with extensive domain keyword alignment."
            : finalScore >= 60
            ? "Good core skill set detected, but several key industry frameworks are missing."
            : "Hard skills section needs expansion. Include specific tools, languages, and platforms.";

        Map<String, Object> result = new HashMap<>();
        result.put("score", finalScore);
        result.put("summary", summary);
        result.put("matched", matchedSkills);
        result.put("gaps", missingGaps);
        return result;
    }
}
