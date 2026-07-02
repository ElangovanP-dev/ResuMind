package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUserIdOrderByUploadedAtDesc(Long userId);

    @Query("SELECT r.id as id, r.fileName as fileName, r.uploadedAt as uploadedAt, COALESCE(ar.atsScore, 0) as atsScore " +
           "FROM Resume r LEFT JOIN AnalysisResult ar ON ar.resume = r " +
           "WHERE r.user.id = :userId " +
           "ORDER BY r.uploadedAt DESC")
    List<Map<String, Object>> findHistoryByUserId(@Param("userId") Long userId);
}
