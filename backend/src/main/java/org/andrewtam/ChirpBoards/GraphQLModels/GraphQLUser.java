package org.andrewtam.ChirpBoards.GraphQLModels;

import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;

import java.util.HashMap;
import java.util.LinkedList;

public class GraphQLUser {
    
    private String username;
    private String displayName;
    private LinkedList<GraphQLUser> followers;
    private LinkedList<GraphQLUser> following;
    private LinkedList<GraphQLPost> posts;

    public String toString() {
        return username;
    }

    public GraphQLUser(User user, UserRepository userRepository, PostRepository postRepository, HashMap<ObjectId, GraphQLUser> userAlreadyMade, HashMap<ObjectId, GraphQLPost> postAlreadyMade) {
        if (userAlreadyMade == null)
            userAlreadyMade = new HashMap<ObjectId, GraphQLUser>();

        if (postAlreadyMade == null)
            postAlreadyMade = new HashMap<ObjectId, GraphQLPost>();

        this.username = user.getUsername();
        this.displayName = user.getDisplayName();        
        this.followers = new LinkedList<GraphQLUser>();
        this.following = new LinkedList<GraphQLUser>();
        this.posts = new LinkedList<GraphQLPost>();

        userAlreadyMade.put(user.getId(), this);
    

        for (ObjectId userId : user.getFollowers()) {
            GraphQLUser u = userAlreadyMade.get(userId);
            if (u == null)
                u = new GraphQLUser(userRepository.findById(userId), userRepository, postRepository, userAlreadyMade, postAlreadyMade);

            this.followers.add(u);
        }

        for (ObjectId userId : user.getFollowing()) {
            GraphQLUser u = userAlreadyMade.get(userId);
            if (u == null)
                u = new GraphQLUser(userRepository.findById(userId), userRepository, postRepository, userAlreadyMade, postAlreadyMade);

            this.following.add(u);
        }

        for (ObjectId postId : user.getPosts()) {
            GraphQLPost p = postAlreadyMade.get(postId);
            if (p == null)
                p = new GraphQLPost(postRepository.findById(postId), userRepository, postRepository, userAlreadyMade, postAlreadyMade);
                
            this.posts.add(p);
        }
    }
    
}
