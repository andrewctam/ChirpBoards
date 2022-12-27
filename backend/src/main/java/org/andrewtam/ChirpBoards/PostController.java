package org.andrewtam.ChirpBoards;

import org.andrewtam.ChirpBoards.models.Post;
import org.andrewtam.ChirpBoards.models.User;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class PostController {
    
    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @QueryMapping
    public Post post(@Argument String id) {
        if (id == null || !ObjectId.isValid(id)) {
            return null;
        }

        return postRepository.findById(new ObjectId(id));
    }


    @MutationMapping
    public Post createPost(@Argument String text, @Argument boolean isComment, @Argument String username, @Argument String sessionToken) {
        if (text == "" || username == "") {
            return null;
        }

        User user = userRepository.findByUsername(username);

        if (user == null) {
            return null;
        }

        if (!user.getSessionToken().equals(sessionToken) || 
            user.getSessionTokenExpiration().getTime() < System.currentTimeMillis()) {
            return null;
        }
        
        return postRepository.save(new Post(text, user, isComment));

    }

    @MutationMapping
    public User[] upvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return null;
        }

        User user = userRepository.findByUsername(username);

        if (user == null) {
            return null;
        }

        if (!user.getSessionToken().equals(sessionToken) || 
            user.getSessionTokenExpiration().getTime() < System.currentTimeMillis()) {
            return null;
        }
        

        Post post = postRepository.findById(new ObjectId(postId));

        if (post == null) {
            return null;
        }

        User[] upvotes = post.getUpvotes();

        for (int i = 0; i < upvotes.length; i++) {
            if (upvotes[i].getId().equals(user.getId())) {
                // User has already upvoted this post, so remove their upvote
                User[] newUpvotes = new User[upvotes.length - 1];
                for (int j = 0; j < i; j++) {
                    newUpvotes[j] = upvotes[j];
                }
                for (int j = i; j < newUpvotes.length; j++) {
                    newUpvotes[j] = upvotes[j + 1];
                }
                post.setUpvotes(newUpvotes);
                postRepository.save(post);

                return newUpvotes;
            }
        }

        // User has not upvoted this post, so add their upvote

        User[] newUpvotes = new User[upvotes.length + 1];
        for (int i = 0; i < upvotes.length; i++) {
            newUpvotes[i] = upvotes[i];
        }
        newUpvotes[newUpvotes.length - 1] = user;
        post.setUpvotes(newUpvotes);
        postRepository.save(post);
        return newUpvotes;
    }


    @MutationMapping
    public User[] downvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return null;
        }

        User user = userRepository.findByUsername(username);

        if (user == null) {
            return null;
        }

        if (!user.getSessionToken().equals(sessionToken) || 
            user.getSessionTokenExpiration().getTime() < System.currentTimeMillis()) {
            return null;
        }
        

        Post post = postRepository.findById(new ObjectId(postId));

        if (post == null) {
            return null;
        }

        User[] downvotes = post.getDownvotes();

        for (int i = 0; i < downvotes.length; i++) {
            if (downvotes[i].getId().equals(user.getId())) {
                // User has already upvoted this post, so remove their upvote
                User[] newDownvotes = new User[downvotes.length - 1];
                for (int j = 0; j < i; j++) {
                    newDownvotes[j] = downvotes[j];
                }
                for (int j = i; j < newDownvotes.length; j++) {
                    newDownvotes[j] = downvotes[j + 1];
                }
                post.setUpvotes(newDownvotes);
                postRepository.save(post);

                return newDownvotes;
            }
        }

        // User has not upvoted this post, so add their upvote

        User[] newDownvotes = new User[downvotes.length + 1];
        for (int i = 0; i < downvotes.length; i++) {
            newDownvotes[i] = downvotes[i];
        }
        newDownvotes[newDownvotes.length - 1] = user;
        post.setUpvotes(newDownvotes);
        postRepository.save(post);
        return newDownvotes;
    }
    
}
