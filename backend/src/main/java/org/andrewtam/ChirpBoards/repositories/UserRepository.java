package org.andrewtam.ChirpBoards.repositories;


import java.util.List;
import java.util.Set;

import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface UserRepository extends MongoRepository<User, String> {
    User findByUsername(String username);
    User findById(ObjectId id);

    @Query("{ $or: [ { username: { $regex: '?0', $options: 'i' } }, { displayName : { $regex: '?0', $options: 'i' } } ] }")
    Page<User> findWithRegex(String regex, PageRequest pageable);

    @Query("{ 'id': { $in: ?0 } }")
    Page<User> findAllById(List<ObjectId> ids, PageRequest pageable);

    @Query("{ 'id': { $in: ?0 } }")
    List<User> findAllById(List<ObjectId> ids);

    @Query("{ _id: ?0, followers: ?1 }")
    User userFollowing(ObjectId followed, ObjectId followee);

    @Query("{ 'posts': { $in: ?0 } }")
    List<User> findAuthors(Set<ObjectId> postIds);
}
