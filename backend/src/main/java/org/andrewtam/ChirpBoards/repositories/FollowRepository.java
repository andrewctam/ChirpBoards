package org.andrewtam.ChirpBoards.repositories;

import org.andrewtam.ChirpBoards.SQLModels.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


public interface FollowRepository extends JpaRepository<Follow, Integer> {

    @Query(value = "SELECT * FROM follows f WHERE f.user = ?1 AND f.target = ?2", nativeQuery = true)
    Follow userFollowing(String userId, String targetId);

    @Query(value = "SELECT * FROM follows f WHERE f.target = ?1 AND f.user = ?2", nativeQuery = true)
    Follow userFollower(String userId, String targetId);
    
}
