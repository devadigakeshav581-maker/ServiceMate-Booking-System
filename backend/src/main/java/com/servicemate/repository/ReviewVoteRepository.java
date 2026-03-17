package com.servicemate.repository;

import com.servicemate.repository.model.ReviewVote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewVoteRepository extends JpaRepository<ReviewVote, Long> {
    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);
    void deleteByReviewId(Long reviewId);
}