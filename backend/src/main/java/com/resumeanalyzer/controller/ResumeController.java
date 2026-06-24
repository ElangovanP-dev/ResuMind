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

        // Validate content type (allow application/pdf or check filename extension as safety fallback)
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
            log.info("Processing resume upload: {} for user: {}", originalFilename, userDetails.getUsername());
            AnalysisResult result = resumeService.uploadAndAnalyze(file, userDetails.getUser());
            log.info("Analysis complete. ATS score: {}", result.getAtsScore());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Resume upload/analysis failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Resume parsing and analysis failed: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Resume> historyList = resumeService.getHistory(userDetails.getUser().getId());
        List<Map<String, Object>> response = historyList.stream().map(resume -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", resume.getId());
            map.put("fileName", resume.getFileName());
            map.put("uploadedAt", resume.getUploadedAt());

            Integer score = resumeService.getAnalysisResult(resume.getId())
                    .map(AnalysisResult::getAtsScore)
                    .orElse(0);
            map.put("atsScore", score);
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<?> getAnalysis(
            @PathVariable("id") Long resumeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return resumeService.getAnalysisResult(resumeId)
                .map(result -> {
                    // Enforce ownership check
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
