package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.TailoredResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TailoredResultRepository extends JpaRepository<TailoredResult, Long> {
    List<TailoredResult> findByResumeIdOrderByCreatedAtDesc(Long resumeId);

    @Query("SELECT tr FROM TailoredResult tr WHERE tr.resume.user.id = :userId ORDER BY tr.createdAt DESC")
    List<TailoredResult> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
