package org.andrewtam.ChirpBoards.controllers;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.andrewtam.ChirpBoards.GraphQLModels.LoginRegisterResponse;
import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;

@Controller
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @QueryMapping
    public User user(@Argument String username) {
        return userRepository.findByUsername(username);   
    }

    @SchemaMapping
    public List<User> following(User user) {
        return userRepository.findAllById(user.getFollowing());
    }

    @SchemaMapping
    public List<User> followers(User user) {
        return userRepository.findAllById(user.getFollowers());
    }

    @SchemaMapping
    public List<Post> posts(User user) {
        return postRepository.findAllById(user.getPosts());
    }

    
    
    @MutationMapping
    public LoginRegisterResponse register(@Argument String username, @Argument String displayName, @Argument String password) {
        if (userRepository.findByUsername(username) != null) {
            return new LoginRegisterResponse("Username already taken", "");
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashedPassword = encoder.encode(password);

        
        User user = new User(username, displayName, hashedPassword);

        String sessionToken = UUID.randomUUID().toString();
        user.setSessionToken(sessionToken);
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 900000 ));
        
        userRepository.save(user);

        return new LoginRegisterResponse(null, sessionToken);
    }

    @MutationMapping
    public LoginRegisterResponse signin(@Argument String username, @Argument String password) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new LoginRegisterResponse("Username not found", null);
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        if (!encoder.matches(password, user.getHashedPassword())) {
            return new LoginRegisterResponse("Incorrect password", null);
        }

        String sessionToken = UUID.randomUUID().toString();
        user.setSessionToken(sessionToken);
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 900000 ));

        userRepository.save(user);

        return new LoginRegisterResponse(null, sessionToken);
    }

    @MutationMapping
    public Boolean signout(@Argument String username, @Argument String sessionToken) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return null;


        user.setSessionToken(null);
        user.setSessionTokenExpiration(null);

        userRepository.save(user);

        return true;
    }

    @MutationMapping
    public Boolean toggleFollow(@Argument String userToFollow, @Argument String username, @Argument String sessionToken) {
        if (userToFollow.equals(username))
            return null;
            
        User user = userRepository.findByUsername(username);
        User followUser = userRepository.findByUsername(userToFollow);

        if (user == null || followUser == null) {
            return null;
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return null;

        boolean nowFollowing;

        if (user.getFollowing().remove(followUser.getId())) {
            followUser.getFollowers().remove(user.getId());
            nowFollowing = false;

        } else {
            user.getFollowing().add(followUser.getId());
            followUser.getFollowers().add(user.getId());
            nowFollowing = true;
        }
        

        userRepository.save(user);
        userRepository.save(followUser);
        return nowFollowing;
    }

}