package org.andrewtam.ChirpBoards.repositories;

import java.util.List;

import org.andrewtam.ChirpBoards.SQLModels.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.transaction.annotation.Transactional;



public interface NotificationRepository extends JpaRepository<Notification, String> {

    @Query(value = "SELECT * FROM notifications n WHERE n.id = ?1",
            countQuery = ("SELECT COUNT(*) FROM notifications n WHERE n.id = ?1"),
            nativeQuery = true)
    Page<Notification> findAllById(List<String> ids, PageRequest pageable);

    @Query(value = "SELECT * FROM notifications n WHERE n.pinged = ?1",
            countQuery = "SELECT COUNT(*) FROM notifications n WHERE n.pinged = ?1",
            nativeQuery = true)
    Page<Notification> findByUser(String userId, PageRequest pageable);

    @Transactional
    @Modifying
    @Query(value = "DELETE FROM notifications WHERE pinged = ?1", nativeQuery = true)
    void deleteAllByUser(String userId);
    
}
