package org.andrewtam.ChirpBoards;

import java.util.LinkedList;

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

        if (!user.checkUserSession(userRepository, sessionToken))
            return null;
        
        return postRepository.save(new Post(text, user, isComment));

    }

    @MutationMapping
    public Boolean upvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
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

        LinkedList<User> upvotes = post.getUpvotes();
        LinkedList<User> downvotes = post.getDownvotes();

        if (upvotes.remove(user)) {
            postRepository.save(post);
            return false;
        } else {
            downvotes.remove(user); // remove from downvotes if it's there
            upvotes.add(user);

            postRepository.save(post);
            return true;
        }
    }


    @MutationMapping
    public Boolean downvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
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
        LinkedList<User> upvotes = post.getUpvotes();
        LinkedList<User> downvotes = post.getDownvotes();


        if (downvotes.remove(user)) {
            postRepository.save(post);
            return false; //no longer downvoted
        } else {
            upvotes.remove(user); // remove from upvotes if it's there
            downvotes.add(user);

            postRepository.save(post);
            return true; //downvoted
        }
    }
    
    
}
