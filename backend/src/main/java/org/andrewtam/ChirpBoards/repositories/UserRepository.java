package org.andrewtam.ChirpBoards.repositories;


import java.util.List;

import org.andrewtam.ChirpBoards.SQLModels.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


public interface UserRepository extends JpaRepository<User, Integer> {
    User findByUsername(String username);
    User findById(String id);

    @Query(value = "SELECT * FROM users u WHERE u.username REGEXP ?1 OR u.displayName REGEXP ?1", 
            countQuery = "SELECT COUNT(*) FROM users u WHERE u.username REGEXP ?1 OR u.displayName REGEXP ?1",
            nativeQuery = true)
    Page<User> findWithRegex(String regex, PageRequest pageable);

    @Query(value = "SELECT * FROM users u WHERE u.id IN ?1", 
            countQuery = "SELECT COUNT(*) FROM users u WHERE u.id IN ?1",
            nativeQuery = true)
    Page<User> findAllById(List<String> ids, PageRequest pageable);

    @Query(value = "SELECT * FROM users u WHERE u.id IN ?1", nativeQuery = true)
    List<User> findAllById(List<String> ids);

    @Query(value = "SELECT * FROM users u WHERE u.username IN ?1", nativeQuery = true)
    List<User> findAllByUsername(List<String> usernames);

    @Query(value = "SELECT u.* FROM users u INNER JOIN posts p ON u.id = p.author WHERE p.author IN ?1", nativeQuery = true)
    List<User> findAuthors(List<String> postIds);

    @Query(value = "SELECT u.* FROM users u INNER JOIN posts p ON u.id = p.author WHERE p.parentPost = ?1 AND p.isRechirp = true", nativeQuery = true)
    List<User> findRechirpers(String originalPostId);

    @Query(value = "SELECT u.* FROM users u INNER JOIN follows f ON u.id = f.user WHERE f.target = ?1", 
            countQuery = "SELECT COUNT(*) FROM users u INNER JOIN follows f ON u.id = f.user WHERE f.target = ?1",
            nativeQuery = true)
    Page<User> findFollowers(String userId, PageRequest pageable);

    @Query(value = "SELECT u.* FROM users u INNER JOIN follows f ON u.id = f.target WHERE f.user = ?1", 
            countQuery = "SELECT COUNT(*) FROM users u INNER JOIN follows f ON u.id = f.target WHERE f.user = ?1",
            nativeQuery = true)
    Page<User> findFollowing(String userId, PageRequest pageable);

}
