package org.andrewtam.ChirpBoards.controllers;

import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.andrewtam.ChirpBoards.GraphQLModels.BooleanResponse;
import org.andrewtam.ChirpBoards.GraphQLModels.PaginatedPosts;
import org.andrewtam.ChirpBoards.GraphQLModels.PaginatedUsers;
import org.andrewtam.ChirpBoards.GraphQLModels.SigninRegisterResponse;
import org.andrewtam.ChirpBoards.SQLModels.Follow;
import org.andrewtam.ChirpBoards.SQLModels.Post;
import org.andrewtam.ChirpBoards.SQLModels.User;
import org.andrewtam.ChirpBoards.repositories.FollowRepository;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;

import com.microsoft.azure.storage.CloudStorageAccount;
import com.microsoft.azure.storage.blob.CloudBlobClient;
import com.microsoft.azure.storage.blob.CloudBlobContainer;
import com.microsoft.azure.storage.blob.CloudBlockBlob;

import graphql.GraphQLContext;

@Controller
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private FollowRepository followRepository;


    @Value("${azure.storage.connectionString}")
    private String azureConnectionString;

    @QueryMapping
    public User user(@Argument String username, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername);

        username = username.toLowerCase();
        
        context.put("username", username);
        return userRepository.findByUsername(username);   
    }


    @QueryMapping
    public PaginatedUsers searchUsers(@Argument String query, @Argument int pageNum, @Argument int size, @Argument String relatedUsername, GraphQLContext context) {
        if (query == null || query == "")
            return new PaginatedUsers(null);

        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername);

        PageRequest paging = PageRequest.of(pageNum, size, Sort.by("followerCount", "id").descending());

        Page<User> page = userRepository.findWithRegex(".*" + query + ".*", paging);

        return new PaginatedUsers(page);
    }


    @QueryMapping
    public List<User> popularUsers(@Argument int num) {
        PageRequest paging = PageRequest.of(0, num, Sort.by("followerCount", "id").descending());
        Page<User> page = userRepository.findAll(paging);

        List<User> users = new ArrayList<>(num);
        for (User user : page) {
            //convert to list and filter 0 follower users
            if (user.getFollowerCount() > 0)
                users.add(user);
        }

        return users;
    }


    @SchemaMapping
    public Post pinnedPost(User user) {
        if (user.getPinnedPost() == null)
            return null;

        return postRepository.findById(user.getPinnedPost());
    }
    @SchemaMapping
    public PaginatedUsers following(User user, @Argument int pageNum, @Argument int size) {
        PageRequest paging = PageRequest.of(pageNum, size);

        Page<User> page = userRepository.findFollowing(user.getId(), paging);
        return new PaginatedUsers(page);
    }

    @SchemaMapping
    public PaginatedUsers followers(User user, @Argument int pageNum, @Argument int size) {
        PageRequest paging = PageRequest.of(pageNum, size);

        Page<User> page = userRepository.findFollowers(user.getId(), paging);
        return new PaginatedUsers(page);
    }
        

    @SchemaMapping
    public PaginatedPosts posts(User user, @Argument int pageNum, @Argument int size, @Argument String sortMethod, @Argument String sortDirection) {
        Sort sort;
        switch(sortMethod) {
            case "score":
                sort = Sort.by("score", "postDate", "id");
                break;
            case "postDate":
            default:
                sort = Sort.by("postDate", "id");
                break;
        }

        switch(sortDirection) {
            case "ascending":
                sort = sort.ascending();
                break;
            case "descending":
            default:
                sort = sort.descending();
                break;
        }

        PageRequest paging = PageRequest.of(pageNum, size, sort);

        Page<Post> page = postRepository.findByAuthor(user.getId(), paging);
        return new PaginatedPosts(page);
    }

    @SchemaMapping
    public Boolean isFollowing(User targetUser, @Argument String followerUsername) {
        User follower = userRepository.findByUsername(followerUsername);
        if (follower == null) {
            return false;
        }
        return followRepository.userFollowing(follower.getId(), targetUser.getId()) != null;
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
        int ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + ONE_WEEK ));
        
        userRepository.save(user);

        return new SigninRegisterResponse("Success", sessionToken);
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
        int ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + ONE_WEEK ));

        userRepository.save(user);

        return new SigninRegisterResponse("Success", sessionToken);
    }


    @MutationMapping
    public Integer verifySession(@Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return null;

        return user.getUnreadNotifications();
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
        User targetUser = userRepository.findByUsername(userToFollow);

        if (user == null || targetUser == null) {
            return new BooleanResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        Follow follow = followRepository.userFollowing(user.getId(), targetUser.getId());
        boolean nowFollowing;

        if (follow != null) { //already following, remove it
            nowFollowing = false;
            followRepository.delete(follow);
            targetUser.setFollowerCount(targetUser.getFollowerCount() - 1);
            user.setFollowingCount(user.getFollowingCount() - 1);
        } else {
            nowFollowing = true;
            follow = new Follow(user.getId(), targetUser.getId());
            followRepository.save(follow);
            targetUser.setFollowerCount(targetUser.getFollowerCount() + 1);
            user.setFollowingCount(user.getFollowingCount() + 1);
        }

    
        userRepository.save(user);
        userRepository.save(targetUser);
        return new BooleanResponse(targetUser.getFollowerCount() + "", nowFollowing);
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
    public BooleanResponse changeUserColor(@Argument String newUserColor, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        Pattern pattern = Pattern.compile("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
        Matcher matcher = pattern.matcher(newUserColor);
        if (!matcher.matches())
            return new BooleanResponse("Invalid color", null);

        user.setUserColor(newUserColor);
        userRepository.save(user);

        return new BooleanResponse("Successfully changed color to " + newUserColor, true);
    }

    @MutationMapping
    public BooleanResponse pinPost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

        if (username.length() == 0 || sessionToken.length() == 0 || postId.length() == 0 || postId == null)
            return new BooleanResponse("Invalid inputs", null);

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);


        Post post = postRepository.findById(postId);
        if (post == null) {
            return new BooleanResponse("Post not found", null);
        }

        if (post.isComment())
            return new BooleanResponse("Can only pin posts", null);

        if (!post.getAuthor().equals(user.getId()))
            return new BooleanResponse("You can only pin your own posts", null);

        boolean result;
        if (user.getPinnedPost() != null && user.getPinnedPost().equals(postId)) { //remove pin
            user.setPinnedPost(null); 
            result = false;
        } else {
            user.setPinnedPost(postId); //set pin
            result = true;
        }

        userRepository.save(user);
        return new BooleanResponse("Success", result);
    }

    @MutationMapping
    public BooleanResponse changeProfilePicture(@Argument String username, @Argument String base64Image, @Argument String sessionToken) {
        username = username.toLowerCase();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("Username not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        try {
            CloudStorageAccount storageAccount = CloudStorageAccount.parse(azureConnectionString);
            CloudBlobClient blobClient = storageAccount.createCloudBlobClient();
            CloudBlobContainer container = blobClient.getContainerReference("images");

        
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            if (imageBytes.length > 1000000) {
                return new BooleanResponse("Image must be less than 1MB", null);
            }

            if (user.getPictureURL().length() > 0) {
                String oldImageName = user.getPictureURL().substring(user.getPictureURL().lastIndexOf("/") + 1);
                CloudBlockBlob oldImage = container.getBlockBlobReference(oldImageName);
                oldImage.deleteIfExists();
            }

            //if no new image is provided, indicates to remove
            if (base64Image.length() == 0) { 
                user.setPictureURL("");
                userRepository.save(user);
                return new BooleanResponse("Successfully removed profile picture", true);
            }
            
            String filename = username + "_" + UUID.randomUUID().toString() + ".jpg";
            CloudBlockBlob blob = container.getBlockBlobReference(filename);
            blob.uploadFromByteArray(imageBytes, 0, imageBytes.length);

            String imageURL = blob.getUri().toString();

            user.setPictureURL(imageURL);
        } catch (Exception e) {
            System.out.println(e);           
            return new BooleanResponse("Failed to upload image", null);
        }
        
        userRepository.save(user);
        return new BooleanResponse("Successfully changed profile picture", true);
    }

}
