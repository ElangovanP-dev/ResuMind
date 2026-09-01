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

    @OneToOne(fetch = FetchType.EAGER)
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

    // ── 5-Pillar Scores (nullable for backward compat with legacy rows) ──

    @Column(name = "ats_parseability")
    private Integer atsParseability;

    @Column(name = "hard_skills_score")
    private Integer hardSkillsScore;

    @Column(name = "impact_score")
    private Integer impactScore;

    @Column(name = "structural_score")
    private Integer structuralScore;

    @Column(name = "clarity_score")
    private Integer clarityScore;

    @Lob
    @Column(name = "pillar_details", columnDefinition = "LONGTEXT")
    private String pillarDetails;

    @Lob
    @Column(name = "verb_replacements", columnDefinition = "LONGTEXT")
    private String verbReplacements;

    @PrePersist
    protected void onCreate() {
        this.analyzedAt = LocalDateTime.now();
        if (this.shareToken == null) {
            this.shareToken = java.util.UUID.randomUUID().toString();
        }
    }

    public AnalysisResult() {}

    // ── Existing Getters/Setters ──

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

    // ── 5-Pillar Getters/Setters ──

    public Integer getAtsParseability() {
        return atsParseability;
    }

    public void setAtsParseability(Integer atsParseability) {
        this.atsParseability = atsParseability;
    }

    public Integer getHardSkillsScore() {
        return hardSkillsScore;
    }

    public void setHardSkillsScore(Integer hardSkillsScore) {
        this.hardSkillsScore = hardSkillsScore;
    }

    public Integer getImpactScore() {
        return impactScore;
    }

    public void setImpactScore(Integer impactScore) {
        this.impactScore = impactScore;
    }

    public Integer getStructuralScore() {
        return structuralScore;
    }

    public void setStructuralScore(Integer structuralScore) {
        this.structuralScore = structuralScore;
    }

    public Integer getClarityScore() {
        return clarityScore;
    }

    public void setClarityScore(Integer clarityScore) {
        this.clarityScore = clarityScore;
    }

    public String getPillarDetails() {
        return pillarDetails;
    }

    public void setPillarDetails(String pillarDetails) {
        this.pillarDetails = pillarDetails;
    }

    public String getVerbReplacements() {
        return verbReplacements;
    }

    public void setVerbReplacements(String verbReplacements) {
        this.verbReplacements = verbReplacements;
    }
}
