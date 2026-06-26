package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.TailoredResult;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.security.CustomUserDetails;
import com.resumeanalyzer.service.TailorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tailor")
public class TailorController {

    private static final Logger log = LoggerFactory.getLogger(TailorController.class);

    @Autowired
    private TailorService tailorService;

    @Autowired
    private ResumeRepository resumeRepository;

    public static class TailorRequest {
        private Long resumeId;
        private String jobDescription;

        public Long getResumeId() {
            return resumeId;
        }

        public void setResumeId(Long resumeId) {
            this.resumeId = resumeId;
        }

        public String getJobDescription() {
            return jobDescription;
        }

        public void setJobDescription(String jobDescription) {
            this.jobDescription = jobDescription;
        }
    }

    @PostMapping("/run")
    public ResponseEntity<?> runTailoring(
            @RequestBody TailorRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please log in again."));
        }

        if (request.getResumeId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Please select a valid resume."));
        }

        if (request.getJobDescription() == null || request.getJobDescription().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Job description cannot be empty."));
        }

        try {
            Resume resume = resumeRepository.findById(request.getResumeId())
                    .orElse(null);

            if (resume == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Selected resume not found."));
            }

            if (!resume.getUser().getId().equals(userDetails.getUser().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access Denied. You do not own this resume."));
            }

            log.info("Starting JD tailoring for resume ID: {} and user: {}", request.getResumeId(), userDetails.getUsername());
            TailoredResult result = tailorService.tailorResume(request.getResumeId(), request.getJobDescription());
            log.info("JD tailoring complete. Match score: {}%", result.getMatchScore());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("JD tailoring failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to tailor resume: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please log in again."));
        }
        
        List<TailoredResult> history = tailorService.getHistory(userDetails.getUser().getId());
        return ResponseEntity.ok(history);
    }
}
