package org.andrewtam.ChirpBoards.repositories;

import java.util.List;

import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;


public interface PostRepository extends MongoRepository<Post, String> {
    Post findById(ObjectId id);

    @Query("{ 'id': { $in: ?0 } }")
    List<Post> findAllById(List<ObjectId> ids);
    
    @Query("{ 'id': { $in: ?0 } }")
    Page<Post> findAllById(List<ObjectId> ids, PageRequest pageable);

    @Query("{ _id: ?0, upvotes: ?1 }")
    User userUpvoted(ObjectId postId, ObjectId userId);

    @Query("{ _id: ?0, downvotes: ?1 }")
    User userDownvoted(ObjectId postId, ObjectId userId);
}
