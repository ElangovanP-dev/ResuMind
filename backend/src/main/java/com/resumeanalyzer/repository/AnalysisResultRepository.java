package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    Optional<AnalysisResult> findByResumeId(Long resumeId);
    Optional<AnalysisResult> findByShareToken(String shareToken);
}
