package org.andrewtam.ChirpBoards.repositories;

import java.util.List;

import org.andrewtam.ChirpBoards.MongoDBModels.Notification;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;


public interface NotificationRepository extends MongoRepository<Notification, String> {

    @Query("{ _id: { $in: ?0 } }")
    Page<Notification> findAllById(List<ObjectId> ids, PageRequest pageable);

    @Query(value="{ _id: { $in: ?0 } }", delete = true)
    void deleteAllById(List<ObjectId> ids);
    
}
