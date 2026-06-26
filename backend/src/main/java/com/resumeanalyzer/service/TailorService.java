package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.TailoredResult;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.TailoredResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TailorService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private TailoredResultRepository tailoredResultRepository;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    @Transactional
    public TailoredResult tailorResume(Long resumeId, String jobDescription) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found with ID: " + resumeId));

        String resumeText = resume.getExtractedText();
        AIAnalysisService.TailorResponse aiResponse = aiAnalysisService.tailorResume(resumeText, jobDescription);

        TailoredResult result = new TailoredResult();
        result.setResume(resume);
        result.setJobDescriptionText(jobDescription);
        result.setMatchScore(aiResponse.matchScore);
        result.setMissingKeywords(aiResponse.missingKeywords);
        result.setRewrittenBullets(aiResponse.rewrittenBullets);
        result.setSuggestedSkills(aiResponse.suggestedSkills);
        result.setTailoredSummary(aiResponse.tailoredSummary);

        return tailoredResultRepository.save(result);
    }

    public List<TailoredResult> getHistory(Long userId) {
        return tailoredResultRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }
}
