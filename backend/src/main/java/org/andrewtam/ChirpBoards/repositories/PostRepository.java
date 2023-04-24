package org.andrewtam.ChirpBoards.repositories;

import java.util.List;
import java.util.Set;

import org.andrewtam.ChirpBoards.SQLModels.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


public interface PostRepository extends JpaRepository<Post, Integer> {

    Post findById(String id);
    Boolean existsById(String id);

    @Query(value = "SELECT * FROM posts p WHERE p.text REGEXP ?1 AND p.isComment = false AND p.isRechirp = false",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.text REGEXP ?1 AND p.isComment = false AND p.isRechirp = false",
            nativeQuery = true)
    Page<Post> findWithRegex(String regex, PageRequest pageable);

    @Query(value = "SELECT * FROM posts p WHERE p.isComment = false AND p.isRechirp = false",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.isComment = false AND p.isRechirp = false",
            nativeQuery = true)
    Page<Post> findAllPosts(PageRequest pageable);

    @Query(value = "SELECT * FROM posts p WHERE p.parentPost = ?1 AND p.isComment = true", 
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.parentPost = ?1 AND p.isComment = true",
            nativeQuery = true)
    Page<Post> findComments(String parentPostId, PageRequest pageable);

    @Query(value = "SELECT * FROM posts p WHERE p.author = ?1 AND p.isRechirp = true", 
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.author = ?1 AND p.isRechirp = true",
            nativeQuery = true)
    Set<Post> findUsersRechirps(String userId);

    @Query(value = "SELECT * FROM posts p WHERE p.parentPost = ?1 AND p.author = ?2 AND p.isRechirp = true", nativeQuery = true)
    Post findRechirpByAuthor(String originalPostId, String authorId);

    @Query(value = "SELECT * FROM posts p WHERE p.parentPost = ?1 AND p.isRechirp = true", nativeQuery = true)
    List<Post> findRechirpsOfPost(String originalPostId);

    @Query(value = "SELECT * FROM posts p WHERE p.isComment = false AND p.postDate > ?1 AND p.isRechirp = false", 
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.isComment = false AND p.postDate > ?1 AND p.isRechirp = false",
            nativeQuery = true)
    Page<Post> findTrendingPosts(long timeframe, PageRequest pageable);

    @Query(value = "SELECT * FROM posts p WHERE p.author = ?1 AND p.isComment = false", 
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.author = ?1 AND p.isComment = false",
            nativeQuery = true)
    Page<Post> findByAuthor(String authorId, PageRequest pageable);

    @Query(value = "SELECT * FROM posts p WHERE p.author IN ?1 AND p.isComment = false", 
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.author IN ?1 AND p.isComment = false",
            nativeQuery = true)
    Page<Post> findByAuthors(List<String> authorsIds, PageRequest pageable);
    
    @Query(value = "SELECT * FROM posts p WHERE p.id IN ?1", nativeQuery = true)
    List<Post> findAllById(List<String> ids);
    
    @Query(value = "SELECT * FROM posts p WHERE p.id IN ?1",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.id IN ?1",
            nativeQuery = true)
    Page<Post> findAllById(List<String> ids, PageRequest pageable);

    @Query(value = "SELECT p.* FROM posts p INNER JOIN votes v ON p.id = v.post WHERE v.user = ?1 AND v.isUpvote = true", 
            countQuery = "SELECT COUNT(*) FROM posts p INNER JOIN votes v ON p.id = v.post WHERE v.user = ?1 AND v.isUpvote = true",
            nativeQuery = true)
    Set<Post> filterUpvoted(String userId, List<String> postIds);
    
    @Query(value = "SELECT p.* FROM posts p INNER JOIN votes v ON p.id = v.post WHERE v.user = ?1 AND v.isUpvote = false", 
            countQuery = "SELECT COUNT(*) FROM posts p INNER JOIN votes v ON p.id = v.post WHERE v.user = ?1 AND v.isUpvote = false",
            nativeQuery = true)
    Set<Post> filterDownvoted(String userId, List<String> postIds);

    @Query(value = "SELECT p.* FROM posts p INNER JOIN follows f ON p.author = f.target WHERE f.user = ?1 AND p.isComment = false", 
            countQuery = "SELECT COUNT(*) FROM posts p INNER JOIN follows f ON p.author = f.target WHERE f.user = ?1 AND p.isComment = false",
            nativeQuery = true)
    Page<Post> findFollowingPosts(String userId, PageRequest pageable);
}
