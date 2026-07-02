package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.security.CustomUserDetails;
import com.resumeanalyzer.service.AIAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/premium")
public class AIPremiumController {

    @Autowired
    private AIAnalysisService aiAnalysisService;

    @Autowired
    private ResumeRepository resumeRepository;

    @PostMapping("/ats-simulator")
    public ResponseEntity<?> simulateAts(
            @RequestBody Map<String, Long> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized."));
        }
        Long resumeId = request.get("resumeId");
        if (resumeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing resumeId."));
        }
        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume == null || !resume.getUser().getId().equals(userDetails.getUser().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }
        AIAnalysisService.AtsSimulationResponse result = aiAnalysisService.simulateAts(resume.getExtractedText());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bias-detect")
    public ResponseEntity<?> detectBias(
            @RequestBody Map<String, Long> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized."));
        }
        Long resumeId = request.get("resumeId");
        if (resumeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing resumeId."));
        }
        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume == null || !resume.getUser().getId().equals(userDetails.getUser().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }
        AIAnalysisService.BiasDetectionResponse result = aiAnalysisService.detectBias(resume.getExtractedText());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/interview-predict")
    public ResponseEntity<?> predictQuestions(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized."));
        }
        Number resumeIdNum = (Number) request.get("resumeId");
        String jobDescription = (String) request.get("jobDescription");
        if (resumeIdNum == null || jobDescription == null || jobDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing resumeId or jobDescription."));
        }
        Resume resume = resumeRepository.findById(resumeIdNum.longValue()).orElse(null);
        if (resume == null || !resume.getUser().getId().equals(userDetails.getUser().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }
        AIAnalysisService.InterviewPredictionResponse result = aiAnalysisService.predictQuestions(resume.getExtractedText(), jobDescription);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/outreach")
    public ResponseEntity<?> generateOutreach(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized."));
        }
        Number resumeIdNum = (Number) request.get("resumeId");
        String companyName = (String) request.get("companyName");
        String recruiterName = (String) request.get("recruiterName");
        String jobRole = (String) request.get("jobRole");
        if (resumeIdNum == null || companyName == null || recruiterName == null || jobRole == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields."));
        }
        Resume resume = resumeRepository.findById(resumeIdNum.longValue()).orElse(null);
        if (resume == null || !resume.getUser().getId().equals(userDetails.getUser().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }
        AIAnalysisService.OutreachResponse result = aiAnalysisService.generateOutreach(resume.getExtractedText(), companyName, recruiterName, jobRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/github-import")
    public ResponseEntity<?> importGithubBullets(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized."));
        }
        String repoName = request.get("repoName");
        String readmeText = request.get("readmeText");
        if (repoName == null || readmeText == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing repoName or readmeText."));
        }
        AIAnalysisService.GithubImportResponse result = aiAnalysisService.importGithubBullets(repoName, readmeText);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/ab-test")
    public ResponseEntity<?> abTest(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized."));
        }
        Number resumeIdANum = (Number) request.get("resumeIdA");
        Number resumeIdBNum = (Number) request.get("resumeIdB");
        String jobDescription = (String) request.get("jobDescription");
        if (resumeIdANum == null || resumeIdBNum == null || jobDescription == null || jobDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing resumeIdA, resumeIdB or jobDescription."));
        }
        Resume resumeA = resumeRepository.findById(resumeIdANum.longValue()).orElse(null);
        Resume resumeB = resumeRepository.findById(resumeIdBNum.longValue()).orElse(null);
        if (resumeA == null || resumeB == null ||
                !resumeA.getUser().getId().equals(userDetails.getUser().getId()) ||
                !resumeB.getUser().getId().equals(userDetails.getUser().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }
        AIAnalysisService.ABTestResponse result = aiAnalysisService.abTestResumes(resumeA.getExtractedText(), resumeB.getExtractedText(), jobDescription);
        return ResponseEntity.ok(result);
    }
}
