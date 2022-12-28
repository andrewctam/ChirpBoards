package org.andrewtam.ChirpBoards.repositories;

import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    User findByUsername(String username);
    User findById(ObjectId id);
}
