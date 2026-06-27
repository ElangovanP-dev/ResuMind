package com.resumeanalyzer.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.resumeanalyzer.converter.JsonListConverter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "analysis_results")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"extractedText", "user", "hibernateLazyInitializer", "handler"})
    private Resume resume;

    @Column(name = "ats_score", nullable = false)
    private Integer atsScore;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "skills_found", nullable = false, columnDefinition = "json")
    private List<String> skillsFound;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "missing_keywords", nullable = false, columnDefinition = "json")
    private List<String> missingKeywords;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "strengths", nullable = false, columnDefinition = "json")
    private List<String> strengths;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "improvements", nullable = false, columnDefinition = "json")
    private List<String> improvements;

    @Lob
    @Column(name = "feedback", nullable = false, columnDefinition = "LONGTEXT")
    private String feedback;

    @Column(name = "analyzed_at", nullable = false, updatable = false)
    private LocalDateTime analyzedAt;

    @Column(name = "share_token", unique = true, length = 36)
    private String shareToken;

    @PrePersist
    protected void onCreate() {
        this.analyzedAt = LocalDateTime.now();
        if (this.shareToken == null) {
            this.shareToken = java.util.UUID.randomUUID().toString();
        }
    }

    public AnalysisResult() {}

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

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

    public Integer getAtsScore() {
        return atsScore;
    }

    public void setAtsScore(Integer atsScore) {
        this.atsScore = atsScore;
    }

    public List<String> getSkillsFound() {
        return skillsFound;
    }

    public void setSkillsFound(List<String> skillsFound) {
        this.skillsFound = skillsFound;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getImprovements() {
        return improvements;
    }

    public void setImprovements(List<String> improvements) {
        this.improvements = improvements;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public void setAnalyzedAt(LocalDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }
}
