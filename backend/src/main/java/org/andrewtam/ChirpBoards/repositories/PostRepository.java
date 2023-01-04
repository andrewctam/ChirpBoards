package org.andrewtam.ChirpBoards.repositories;

import java.util.List;
import java.util.Set;

import org.andrewtam.ChirpBoards.MongoDBModels.Post;import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;


public interface PostRepository extends MongoRepository<Post, String> {
    Post findById(ObjectId id);
    Boolean existsById(ObjectId id);

    @Query("{ text: { $regex: ?0, $options: 'i' }, isComment: false, isRechirp: false }")
    Page<Post> findWithRegex(String regex, PageRequest pageable);

    @Query("{ isComment: false, isRechirp: false }")
    Page<Post> findAllBoards(PageRequest pageable);

    @Query("{ author: ?0, isRechirp: true }")
    Set<Post> findUsersRechirps(ObjectId user);

    @Query(" { parentPost: ?0, author: ?1, isRechirp: true }")
    Post findRechirp(ObjectId originalPost, ObjectId author);


    @Query("{ isComment: false, postDate: {$gt: ?0 }, isRechirp: false }")
    Page<Post> findTrendingPosts(long timeframe, PageRequest pageable);

    @Query("{ author: ?0, isComment: false }")
    Page<Post> findBoardsByAuthor(ObjectId author, PageRequest pageable);

    @Query("{ author: { $in: ?0 } , isComment: false }")
    Page<Post> findBoardsByAuthors(List<ObjectId> authors, PageRequest pageable);
    
    @Query("{ 'id': { $in: ?0 } }")
    List<Post> findAllById(List<ObjectId> ids);
    
    @Query("{ 'id': { $in: ?0 } }")
    Page<Post> findAllById(List<ObjectId> ids, PageRequest pageable);

    @Query("{ 'id': { $in: ?1 } , 'upvotes': ?0 }")
    Set<Post> filterUpvoted(ObjectId userId, List<ObjectId> postIds);
    
    @Query("{ _id: { $in: ?1 } , downvotes: ?0 }")
    Set<Post> filterDownvoted(ObjectId userId, List<ObjectId> postIds);
}
