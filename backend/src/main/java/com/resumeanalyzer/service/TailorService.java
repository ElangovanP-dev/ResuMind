package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.TailoredResult;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.TailoredResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TailorService {

    private static final Logger log = LoggerFactory.getLogger(TailorService.class);

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private TailoredResultRepository tailoredResultRepository;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    /**
     * Tailor a resume to a job description. Split into phases to avoid holding
     * DB connections during the slow Gemini API call.
     */
    public TailoredResult tailorResume(Long resumeId, String jobDescription) {
        // Phase 1: Fetch resume text (quick DB read)
        Resume resume = fetchResume(resumeId);
        String resumeText = resume.getExtractedText();

        // Phase 2: Call AI (NO DB connection held)
        log.info("Tailoring resume id={} against JD ({}chars)", resumeId, jobDescription.length());
        AIAnalysisService.TailorResponse aiResponse = aiAnalysisService.tailorResume(resumeText, jobDescription);

        // Phase 3: Save result (quick DB write)
        return saveTailoredResult(resumeId, jobDescription, aiResponse);
    }

    @Transactional(readOnly = true)
    protected Resume fetchResume(Long resumeId) {
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found with ID: " + resumeId));
    }

    @Transactional
    protected TailoredResult saveTailoredResult(Long resumeId, String jobDescription,
                                                 AIAnalysisService.TailorResponse aiResponse) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalStateException("Resume not found after fetch"));

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
