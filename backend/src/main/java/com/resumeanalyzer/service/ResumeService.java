package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.AnalysisResult;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.repository.AnalysisResultRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ResumeService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private AnalysisResultRepository analysisResultRepository;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    @Transactional
    public AnalysisResult uploadAndAnalyze(MultipartFile file, User user) throws IOException {
        // 1. Extract text from PDF using Apache PDFBox 3.x
        String extractedText;
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            extractedText = stripper.getText(document);
        }

        if (extractedText == null || extractedText.isBlank()) {
            throw new IllegalArgumentException("Could not extract any text from the PDF file");
        }

        // 2. Save Resume entity
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFileName(file.getOriginalFilename());
        resume.setExtractedText(extractedText);
        resume = resumeRepository.save(resume);

        // 3. Request Claude analysis
        AIAnalysisService.AnalysisResponse aiResponse = aiAnalysisService.analyzeResume(extractedText);

        // 4. Save AnalysisResult entity
        AnalysisResult result = new AnalysisResult();
        result.setResume(resume);
        result.setAtsScore(aiResponse.ats_score);
        result.setSkillsFound(aiResponse.skills_found);
        result.setMissingKeywords(aiResponse.missing_keywords);
        result.setStrengths(aiResponse.strengths);
        result.setImprovements(aiResponse.improvements);
        result.setFeedback(aiResponse.feedback_summary);
        
        return analysisResultRepository.save(result);
    }

    public List<Resume> getHistory(Long userId) {
        return resumeRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    @Transactional
    public Optional<AnalysisResult> getAnalysisResult(Long resumeId) {
        Optional<AnalysisResult> resultOpt = analysisResultRepository.findByResumeId(resumeId);
        if (resultOpt.isPresent()) {
            AnalysisResult result = resultOpt.get();
            if (result.getShareToken() == null) {
                result.setShareToken(java.util.UUID.randomUUID().toString());
                analysisResultRepository.save(result);
            }
        }
        return resultOpt;
    }

    public Optional<AnalysisResult> getAnalysisByShareToken(String shareToken) {
        return analysisResultRepository.findByShareToken(shareToken);
    }
}
