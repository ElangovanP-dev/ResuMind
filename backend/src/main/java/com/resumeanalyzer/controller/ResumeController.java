package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.AnalysisResult;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.security.CustomUserDetails;
import com.resumeanalyzer.service.ResumeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);

    @Autowired
    private ResumeService resumeService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) {
            log.warn("Upload attempted without authentication");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please log in again."));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Please select a valid PDF file to upload."));
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        boolean isPdf = (contentType != null && contentType.equalsIgnoreCase("application/pdf")) ||
                (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf"));

        if (!isPdf) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid file format. Only PDF files are allowed."));
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "File size exceeds the maximum limit of 5MB."));
        }

        try {
            log.info("Processing resume upload: {} ({}KB) for user: {}",
                    originalFilename, file.getSize() / 1024, userDetails.getUsername());
            AnalysisResult result = resumeService.uploadAndAnalyze(file, userDetails.getUser());
            log.info("Analysis complete. resumeId={}, atsScore={}", result.getResume().getId(), result.getAtsScore());

            // Build a clean response map to avoid any serialization issues
            Map<String, Object> response = new HashMap<>();
            response.put("id", result.getId());
            response.put("atsScore", result.getAtsScore());
            response.put("skillsFound", result.getSkillsFound());
            response.put("missingKeywords", result.getMissingKeywords());
            response.put("strengths", result.getStrengths());
            response.put("improvements", result.getImprovements());
            response.put("feedback", result.getFeedback());
            response.put("analyzedAt", result.getAnalyzedAt());
            response.put("shareToken", result.getShareToken());

            Map<String, Object> resumeMap = new HashMap<>();
            resumeMap.put("id", result.getResume().getId());
            resumeMap.put("fileName", result.getResume().getFileName());
            resumeMap.put("uploadedAt", result.getResume().getUploadedAt());
            response.put("resume", resumeMap);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Resume validation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Resume upload/analysis failed: {}", e.getMessage(), e);
            String msg = "Resume analysis failed. Please try again.";
            if (e.getMessage() != null && (e.getMessage().contains("Database") || e.getMessage().contains("attempts"))) {
                msg = "Database connection timed out during analysis. Please tap 'Retry'.";
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", msg));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please log in again."));
        }
        try {
            return ResponseEntity.ok(resumeService.getHistoryOptimized(userDetails.getUser().getId()));
        } catch (Exception e) {
            log.error("Failed to load history for user {}: {}", userDetails.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to load history. Please try again."));
        }
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<?> getAnalysis(
            @PathVariable("id") Long resumeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please log in again."));
        }

        return resumeService.getAnalysisResult(resumeId)
                .map(result -> {
                    // Check ownership — resume.user is @JsonIgnore but loaded via EAGER join
                    if (!result.getResume().getUser().getId().equals(userDetails.getUser().getId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Access Denied. You do not own this analysis."));
                    }
                    return ResponseEntity.ok((Object) result);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Analysis result not found.")));
    }

    @GetMapping("/public/{shareToken}/analysis")
    public ResponseEntity<?> getPublicAnalysis(@PathVariable("shareToken") String shareToken) {
        log.info("Fetching public resume analysis for shareToken: {}", shareToken);
        return resumeService.getAnalysisByShareToken(shareToken)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Analysis result not found.")));
    }
}
