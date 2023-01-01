package org.andrewtam.ChirpBoards.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


import org.andrewtam.ChirpBoards.GraphQLModels.PaginatedNotifications;
import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.MongoDBModels.Notification;
import org.andrewtam.ChirpBoards.repositories.NotificationRepository;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import graphql.GraphQLContext;


@Controller
public class NotificationController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;


    @QueryMapping
    public PaginatedNotifications notifications(@Argument String username, @Argument int pageNum, @Argument int size, @Argument String sessionToken, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

        username = username.toLowerCase();

        if (sessionToken == null || sessionToken == "")
            return null;

        User user = userRepository.findByUsername(username);
        if (user == null)
            return null;

        if (!user.checkUserSession(userRepository, sessionToken))
            return null;

        PageRequest pageRequest = PageRequest.of(pageNum, size, Sort.by("date").descending());

        Page<Notification> page = notificationRepository.findAllById(user.getNotifications(), pageRequest);
        
        int unread = user.getUnreadNotifications();
        user.readNotifications(size);
        userRepository.save(user);

        return new PaginatedNotifications(page, unread);
    }

    @SchemaMapping
    public String date(Notification notification, @Argument Integer timezone) {
        return notification.getFormattedDate(timezone);
    }

    @BatchMapping
    public Map<Notification, User> pinger(List<Notification> notifications) {
        List<ObjectId> pingerIds = notifications.stream().map(notif -> notif.getPinger()).collect(Collectors.toList());

        
        List<User> users = userRepository.findAllById(pingerIds);
        Map<ObjectId, User> idToUser = new HashMap<>();

        for (User user : users) 
            idToUser.put(user.getId(), user);
        
        
        return notifications.stream()
                .collect(Collectors.toMap(
                    notif -> notif,
                    notif -> idToUser.get(notif.getPinger())
                ));
    }

    @BatchMapping
    public Map<Notification, Post> post(List<Notification> notifications) {
        List<ObjectId> postIds = notifications.stream().map(notif -> notif.getPost()).collect(Collectors.toList());
        
        List<Post> posts = postRepository.findAllById(postIds);

        Map<ObjectId, Post> idToPost = new HashMap<>();

        for (Post post : posts) 
            idToPost.put(post.getId(), post);

        return notifications.stream()   
                .collect(Collectors.toMap(
                    notif -> notif,
                    notif -> idToPost.get(notif.getPost())
                ));
    }

    @MutationMapping
    public Boolean clearNotifications(@Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

        if (sessionToken == null || sessionToken == "")
            return false;

        User user = userRepository.findByUsername(username);
        if (user == null)
            return false;

        if (!user.checkUserSession(userRepository, sessionToken))
            return false;

        notificationRepository.deleteAllById(user.getNotifications());
        user.getNotifications().clear();
        user.readNotifications(user.getUnreadNotifications());

        userRepository.save(user);

        return true;
    }
}