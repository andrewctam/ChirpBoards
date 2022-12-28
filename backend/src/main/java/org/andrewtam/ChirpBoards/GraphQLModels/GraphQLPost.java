package org.andrewtam.ChirpBoards.GraphQLModels;

import java.util.HashMap;
import java.util.LinkedList;

import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;

public class GraphQLPost {
    private String id;
    private GraphQLUser author;
    private String text;
    private Boolean isComment;
    private String postDate;
    private LinkedList<GraphQLUser> upvotes;
    private LinkedList<GraphQLUser> downvotes;
    private LinkedList<GraphQLPost> comments;

    public String toString() {
        return id;
    }


    public GraphQLPost(Post post, UserRepository userRepository, PostRepository postRepository, HashMap<ObjectId, GraphQLUser> userAlreadyMade, HashMap<ObjectId, GraphQLPost> postAlreadyMade) {
        if (postAlreadyMade == null)
            postAlreadyMade = new HashMap<ObjectId, GraphQLPost>();
        
        if (userAlreadyMade == null)
            userAlreadyMade = new HashMap<ObjectId, GraphQLUser>();

        this.author = userAlreadyMade.get(post.getAuthor());
        if (this.author == null) {
            this.author = new GraphQLUser(userRepository.findById(post.getAuthor()), userRepository, postRepository, userAlreadyMade, postAlreadyMade);
        }

        this.id = post.getId().toString();
        this.text = post.getText();
        this.isComment = post.isComment();
        this.postDate = post.getPostDate();

        this.upvotes = new LinkedList<GraphQLUser>();
        this.downvotes = new LinkedList<GraphQLUser>();
        this.comments = new LinkedList<GraphQLPost>();

        postAlreadyMade.put(post.getId(), this);

        for (ObjectId userId: post.getUpvotes()) {
            GraphQLUser u = userAlreadyMade.get(userId);
            if (u == null) {
                u = new GraphQLUser(userRepository.findById(userId), userRepository, postRepository, userAlreadyMade, postAlreadyMade);
            }
            this.upvotes.add(u);
        }

        for (ObjectId userId: post.getDownvotes()) {
            GraphQLUser u = userAlreadyMade.get(userId);
            if (u == null) {
                u = new GraphQLUser(userRepository.findById(userId), userRepository, postRepository, userAlreadyMade, postAlreadyMade);
            }
            this.downvotes.add(u);
        }

        for (ObjectId postId : post.getComments()) {
            GraphQLPost p = postAlreadyMade.get(postId);
            
            if (p == null) {
                p = new GraphQLPost(postRepository.findById(postId), userRepository, postRepository, userAlreadyMade, postAlreadyMade);
            }
            this.comments.add(p);
        }
    }

}