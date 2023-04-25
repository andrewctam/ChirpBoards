package org.andrewtam.ChirpBoards.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


import org.andrewtam.ChirpBoards.GraphQLModels.PaginatedNotifications;
import org.andrewtam.ChirpBoards.SQLModels.Notification;
import org.andrewtam.ChirpBoards.SQLModels.Post;
import org.andrewtam.ChirpBoards.SQLModels.User;
import org.andrewtam.ChirpBoards.repositories.NotificationRepository;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;

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

        PageRequest pageRequest = PageRequest.of(pageNum, size, Sort.by("date", "id").descending());
        Page<Notification> page = notificationRepository.findByUser(user.getId(), pageRequest);
        
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
        List<String> pingerIds = notifications.stream() //map notifcations to their pinger ids
                                                .map(notif -> notif.getPinger())
                                                .collect(Collectors.toList());
        List<User> users = userRepository.findAllById(pingerIds);

        //map user ids to their user objects
        Map<String, User> idToUser = new HashMap<>();
        for (User user : users) 
            idToUser.put(user.getId(), user);
        
        //map notifications to users
        return notifications.stream()
                .collect(Collectors.toMap(
                    notif -> notif,
                    notif -> idToUser.get(notif.getPinger())
                ));
    }

    @BatchMapping
    public Map<Notification, Post> post(List<Notification> notifications) {
        List<String> postIds = notifications.stream() //map notifcations to their post ids
                                            .map(notif -> notif.getPost())
                                            .collect(Collectors.toList());
        List<Post> posts = postRepository.findAllById(postIds);

        //map post ids to their post objects
        Map<String, Post> idToPost = new HashMap<>();
        for (Post post : posts) 
            idToPost.put(post.getId(), post);

        //map each notification to its post
        Map<Notification, Post> notifToPost = new HashMap<>();
        for (Notification notif : notifications) {
            Post post = idToPost.get(notif.getPost());
            notifToPost.put(notif, post);
        }

        return notifToPost;
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

        notificationRepository.deleteAllByUser(user.getId());
        user.readNotifications(user.getUnreadNotifications());

        userRepository.save(user);

        return true;
    }
}