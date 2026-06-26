package com.resumeanalyzer.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.resumeanalyzer.converter.JsonListConverter;
import com.resumeanalyzer.converter.JsonMapListConverter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "tailored_results")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TailoredResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Lob
    @Column(name = "job_description_text", nullable = false, columnDefinition = "LONGTEXT")
    private String jobDescriptionText;

    @Column(name = "match_score", nullable = false)
    private Integer matchScore;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "missing_keywords", nullable = false, columnDefinition = "json")
    private List<String> missingKeywords;

    @Convert(converter = JsonMapListConverter.class)
    @Column(name = "rewritten_bullets", nullable = false, columnDefinition = "json")
    private List<Map<String, String>> rewrittenBullets;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "suggested_skills", nullable = false, columnDefinition = "json")
    private List<String> suggestedSkills;

    @Lob
    @Column(name = "tailored_summary", nullable = false, columnDefinition = "TEXT")
    private String tailoredSummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public TailoredResult() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Resume getResume() {
        return resume;
    }

    public void setResume(Resume resume) {
        this.resume = resume;
    }

    public String getJobDescriptionText() {
        return jobDescriptionText;
    }

    public void setJobDescriptionText(String jobDescriptionText) {
        this.jobDescriptionText = jobDescriptionText;
    }

    public Integer getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Integer matchScore) {
        this.matchScore = matchScore;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public List<Map<String, String>> getRewrittenBullets() {
        return rewrittenBullets;
    }

    public void setRewrittenBullets(List<Map<String, String>> rewrittenBullets) {
        this.rewrittenBullets = rewrittenBullets;
    }

    public List<String> getSuggestedSkills() {
        return suggestedSkills;
    }

    public void setSuggestedSkills(List<String> suggestedSkills) {
        this.suggestedSkills = suggestedSkills;
    }

    public String getTailoredSummary() {
        return tailoredSummary;
    }

    public void setTailoredSummary(String tailoredSummary) {
        this.tailoredSummary = tailoredSummary;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
