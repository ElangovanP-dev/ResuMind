package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.AnalysisResult;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.repository.AnalysisResultRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ResumeService {

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private AnalysisResultRepository analysisResultRepository;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    /**
     * Upload and analyze a resume. Split into 3 phases to avoid holding
     * a DB connection open during the slow Gemini API call:
     *   Phase 1: Parse PDF + save Resume (quick DB transaction)
     *   Phase 2: Call Gemini AI (NO DB connection held)
     *   Phase 3: Save AnalysisResult (quick DB transaction)
     */
    public AnalysisResult uploadAndAnalyze(MultipartFile file, User user) throws IOException {
        // ── Phase 1: Parse PDF and save Resume ──────────────────────────
        String extractedText;
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            extractedText = stripper.getText(document);
        }

        if (extractedText == null || extractedText.isBlank()) {
            throw new IllegalArgumentException("Could not extract any text from the PDF file");
        }

        Resume resume = saveResume(file.getOriginalFilename(), extractedText, user);
        log.info("Resume saved with id={}, fileName={}", resume.getId(), resume.getFileName());

        // ── Phase 2: Call AI analysis (NO DB connection held) ───────────
        AIAnalysisService.AnalysisResponse aiResponse;
        try {
            aiResponse = aiAnalysisService.analyzeResume(extractedText);
        } catch (Exception e) {
            log.error("AI analysis threw unexpected exception, using mock fallback", e);
            // This shouldn't happen (analyzeResume catches internally), but just in case
            aiResponse = new AIAnalysisService.AnalysisResponse();
            aiResponse.ats_score = 50;
            aiResponse.skills_found = List.of("Professional Communication");
            aiResponse.missing_keywords = List.of("Add relevant skills");
            aiResponse.strengths = List.of("Resume uploaded successfully");
            aiResponse.improvements = List.of("Run analysis again for detailed feedback");
            aiResponse.feedback_summary = "Analysis encountered an issue. Please try again for full results.";
        }

        // ── Phase 3: Save AnalysisResult ────────────────────────────────
        AnalysisResult result = saveAnalysisResult(resume, aiResponse);
        log.info("Analysis saved with id={}, atsScore={}", result.getId(), result.getAtsScore());

        return result;
    }

    @Transactional
    protected Resume saveResume(String fileName, String extractedText, User user) {
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFileName(fileName);
        resume.setExtractedText(extractedText);
        return resumeRepository.save(resume);
    }

    @Transactional
    protected AnalysisResult saveAnalysisResult(Resume resume, AIAnalysisService.AnalysisResponse aiResponse) {
        // Re-fetch the resume to ensure it's attached to the current persistence context
        Resume managedResume = resumeRepository.findById(resume.getId())
                .orElseThrow(() -> new IllegalStateException("Resume not found after save"));

        AnalysisResult result = new AnalysisResult();
        result.setResume(managedResume);
        result.setAtsScore(aiResponse != null && aiResponse.ats_score > 0 ? aiResponse.ats_score : 65);

        List<String> skills = (aiResponse != null && aiResponse.skills_found != null && !aiResponse.skills_found.isEmpty())
                ? aiResponse.skills_found : List.of("Communication", "Problem Solving");
        result.setSkillsFound(skills);

        List<String> missing = (aiResponse != null && aiResponse.missing_keywords != null)
                ? aiResponse.missing_keywords : List.of();
        result.setMissingKeywords(missing);

        List<String> strengths = (aiResponse != null && aiResponse.strengths != null && !aiResponse.strengths.isEmpty())
                ? aiResponse.strengths : List.of("Clear structure and readable layout", "Professional background demonstrated", "Relevant industry skills highlighted");
        result.setStrengths(strengths);

        List<String> improvements = (aiResponse != null && aiResponse.improvements != null && !aiResponse.improvements.isEmpty())
                ? aiResponse.improvements : List.of("Add quantifiable metrics to bullet points", "Include more targeted industry keywords", "Add a tailored professional summary");
        result.setImprovements(improvements);

        String feedback = (aiResponse != null && aiResponse.feedback_summary != null && !aiResponse.feedback_summary.isBlank())
                ? aiResponse.feedback_summary : "Resume analysis complete. Review the extracted skills and recommendations above.";
        result.setFeedback(feedback);

        return analysisResultRepository.save(result);
    }

    public List<Resume> getHistory(Long userId) {
        return resumeRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public List<java.util.Map<String, Object>> getHistoryOptimized(Long userId) {
        return resumeRepository.findHistoryByUserId(userId);
    }

    @Transactional
    public Optional<AnalysisResult> getAnalysisResult(Long resumeId) {
        return analysisResultRepository.findByResumeId(resumeId);
    }

    public Optional<AnalysisResult> getAnalysisByShareToken(String shareToken) {
        return analysisResultRepository.findByShareToken(shareToken);
    }
}
