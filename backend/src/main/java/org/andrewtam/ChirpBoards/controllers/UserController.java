package org.andrewtam.ChirpBoards.controllers;

import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.andrewtam.ChirpBoards.GraphQLModels.BooleanResponse;
import org.andrewtam.ChirpBoards.GraphQLModels.SigninRegisterResponse;
import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;

import graphql.GraphQLContext;

@Controller
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @QueryMapping
    public User user(@Argument String username, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername);

        username = username.toLowerCase();
        
        context.put("username", username);
        return userRepository.findByUsername(username);   
    }


    @QueryMapping
    public List<User> searchUsers(@Argument String query, @Argument int first, @Argument int offset, @Argument String relatedUsername, GraphQLContext context) {
        if (query == null || query == "")
            return new LinkedList<User>();

        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername);

        PageRequest paging = PageRequest.of(first, offset, Sort.by("username").ascending());

        Page<User> page = userRepository.findWithRegex(".*" + query + ".*", paging);

        return page.getContent();
    }

    @SchemaMapping
    public List<User> following(User user, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<User> page = userRepository.findAllById(user.getFollowing(), paging);
        return page.getContent();
    }

    @SchemaMapping
    public List<User> followers(User user, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<User> page = userRepository.findAllById(user.getFollowers(), paging);
        return page.getContent();
    }
        

    @SchemaMapping
    public List<Post> posts(User user, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<Post> page = postRepository.findAllById(user.getPosts(), paging);
        return page.getContent();
    }

    @SchemaMapping
    public Boolean isFollowing(User user, @Argument String followeeUsername) {
        User followee = userRepository.findByUsername(followeeUsername);
        if (followee == null) {
            return false;
        }

        return userRepository.userFollowing(user.getId(), followee.getId()) != null;
    }

        
    @MutationMapping
    public SigninRegisterResponse register(@Argument String username, @Argument String displayName, @Argument String password) {
        username = username.toLowerCase();

        if (username == "" || displayName == "" || password == "")
            return new SigninRegisterResponse("All fields are required", "");

        if (username.length() > 16 || username.length() < 3) 
            return new SigninRegisterResponse("Username must be between 3 and 20 characters", "");

        if (displayName.length() > 32) 
            return new SigninRegisterResponse("Display name must be less than 32 characters", "");


        if (password.length() < 8)
            return new SigninRegisterResponse("Password must be at least 8 characters", "");

        Pattern pattern = Pattern.compile("^[a-zA-Z0-9]+$");
        Matcher matcher = pattern.matcher(username);

        if (!matcher.find())
            return new SigninRegisterResponse("Username must only contain letters and numbers", "");

        if (userRepository.findByUsername(username) != null)
            return new SigninRegisterResponse("Username already taken", "");

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashedPassword = encoder.encode(password);

        User user = new User(username, displayName, hashedPassword);

        String sessionToken = UUID.randomUUID().toString();
        user.setSessionToken(sessionToken);
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 900000 ));
        
        userRepository.save(user);

        return new SigninRegisterResponse(null, sessionToken);
    }

    @MutationMapping
    public SigninRegisterResponse signin(@Argument String username, @Argument String password) {
        username = username.toLowerCase();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new SigninRegisterResponse("Username not found", null);
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        if (!encoder.matches(password, user.getHashedPassword())) {
            return new SigninRegisterResponse("Incorrect password", null);
        }

        String sessionToken = UUID.randomUUID().toString();
        user.setSessionToken(sessionToken);
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 900000 ));

        userRepository.save(user);

        return new SigninRegisterResponse(null, sessionToken);
    }


    @MutationMapping
    public Boolean verifySession(@Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return false;
        }

        return user.checkUserSession(userRepository, sessionToken);
    }

    @MutationMapping
    public BooleanResponse signout(@Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);


        user.setSessionToken(null);
        user.setSessionTokenExpiration(null);

        userRepository.save(user);

        return new BooleanResponse("", true);
    }



    @MutationMapping
    public BooleanResponse toggleFollow(@Argument String userToFollow, @Argument String username, @Argument String sessionToken) {
        userToFollow = userToFollow.toLowerCase();
        username = username.toLowerCase();

        if (userToFollow.equals(username))
            return new BooleanResponse("Can not follow yourself!", null);
            
        User user = userRepository.findByUsername(username);
        User followUser = userRepository.findByUsername(userToFollow);

        if (user == null || followUser == null) {
            return new BooleanResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        boolean nowFollowing;

        if (user.getFollowing().remove(followUser.getId())) {
            followUser.getFollowers().remove(user.getId());

            user.setFollowingCount(user.getFollowingCount() - 1);
            followUser.setFollowerCount(followUser.getFollowerCount() - 1);

            nowFollowing = false;

        } else {
            user.getFollowing().add(followUser.getId());
            followUser.getFollowers().add(user.getId());

            user.setFollowingCount(user.getFollowingCount() + 1);
            followUser.setFollowerCount(followUser.getFollowerCount() + 1);
            
            nowFollowing = true;
        }
        

        userRepository.save(user);
        userRepository.save(followUser);
        return new BooleanResponse(followUser.getFollowerCount() + "", nowFollowing);
    }

    @MutationMapping
    public BooleanResponse changeDisplayName(@Argument String newDisplayName, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();
        if (newDisplayName == "")
            return new BooleanResponse("Enter a new display name", null); 


        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        if (newDisplayName.length() > 32) 
            return new BooleanResponse("Display name must be less than 32 characters", null);
        
        if (newDisplayName.equals(user.getDisplayName()))
            return new BooleanResponse("Display name is already " + newDisplayName, null);

        user.setDisplayName(newDisplayName);
        userRepository.save(user);

        return new BooleanResponse("Successfully changed display name to " + newDisplayName, true);
    }

    @MutationMapping
    public BooleanResponse changePassword(@Argument String oldPassword, @Argument String newPassword, @Argument String username) {
        username = username.toLowerCase();

        if (newPassword.length() < 8)
            return new BooleanResponse("Password must be at least 8 characters", null);

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        if (!encoder.matches(oldPassword, user.getHashedPassword())) {
            return new BooleanResponse("Incorrect old password", null);
        }

        if (encoder.matches(newPassword, user.getHashedPassword())) {
            return new BooleanResponse("New password must be different from the old password", null);
        }

        String hashedPassword = encoder.encode(newPassword);

        user.setHashedPassword(hashedPassword);
        userRepository.save(user);

        return new BooleanResponse("Successfully changed password", true);
    }

    @MutationMapping
    public BooleanResponse changeHeaderColor(@Argument String newHeaderColor, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        Pattern pattern = Pattern.compile("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
        Matcher matcher = pattern.matcher(newHeaderColor);
        if (!matcher.matches())
            return new BooleanResponse("Invalid color", null);

        user.setHeaderColor(newHeaderColor);
        userRepository.save(user);

        return new BooleanResponse("Successfully changed header color to " + newHeaderColor, true);
    }
    

}
