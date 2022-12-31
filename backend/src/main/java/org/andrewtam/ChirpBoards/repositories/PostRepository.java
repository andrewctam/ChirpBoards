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

    @Query("{ }")
    Page<Post> findAll(PageRequest pageable);

    @Query("{ author: ?0 }")
    Page<Post> findByAuthor(ObjectId authors, PageRequest pageable);

    @Query("{ author: { $in: ?0 } }")
    Page<Post> findByAuthors(List<ObjectId> authors, PageRequest pageable);
    
    @Query("{ 'id': { $in: ?0 } }")
    List<Post> findAllById(List<ObjectId> ids);
    
    @Query("{ 'id': { $in: ?0 } }")
    Page<Post> findAllById(List<ObjectId> ids, PageRequest pageable);

    @Query("{ 'id': { $in: ?1 } , 'upvotes': ?0 }")
    Set<Post> filterUpvoted(ObjectId userId, List<ObjectId> postIds);
    
    @Query("{ _id: { $in: ?1 } , downvotes: ?0 }")
    Set<Post> filterDownvoted(ObjectId userId, List<ObjectId> postIds);
}
