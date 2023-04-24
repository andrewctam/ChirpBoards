package org.andrewtam.ChirpBoards.repositories;

import org.andrewtam.ChirpBoards.SQLModels.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


public interface VoteRepository extends JpaRepository<Vote, Integer> {

    @Query(value = "SELECT * FROM votes v WHERE v.user = ?1 AND v.post = ?2", nativeQuery = true)
    Vote findVote(String userId, String postId);
    
}
