package org.andrewtam.ChirpBoards.repositories;

import java.util.List;

import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    User findByUsername(String username);
    User findById(ObjectId id);
    List<User> findAllById(List<ObjectId> ids);

}
