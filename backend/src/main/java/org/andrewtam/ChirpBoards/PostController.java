package org.andrewtam.ChirpBoards;

import java.util.LinkedList;

import org.andrewtam.ChirpBoards.GraphQLModels.GraphQLPost;
import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
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
    public GraphQLPost post(@Argument String id) {
        if (id == null || !ObjectId.isValid(id)) {
            return null;
        }
        Post post = postRepository.findById(new ObjectId(id));
        if (post == null)
            return null;

        return new GraphQLPost(post, userRepository, postRepository, null, null);
    }


    @MutationMapping
    public GraphQLPost createPost(@Argument String text, @Argument boolean isComment, @Argument String username, @Argument String sessionToken) {
        if (text == "" || username == "" || (!isComment && text.length() > 500)) {
            return null;
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return null;

        Post created = postRepository.save(new Post(text, user.getId(), isComment));

        if (!isComment) {
            user.getPosts().add(created.getId());
            userRepository.save(user);
        }

        return new GraphQLPost(created, userRepository, postRepository, null, null);

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

        LinkedList<ObjectId> upvotes = post.getUpvotes();
        LinkedList<ObjectId> downvotes = post.getDownvotes();

        if (upvotes.remove(user.getId())) {
            postRepository.save(post);
            return false;
        } else {
            downvotes.remove(user.getId()); // remove from downvotes if it's there
            upvotes.add(user.getId());

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
        LinkedList<ObjectId> upvotes = post.getUpvotes();
        LinkedList<ObjectId> downvotes = post.getDownvotes();


        if (downvotes.remove(user.getId())) {
            postRepository.save(post);
            return false; //no longer downvoted
        } else {
            upvotes.remove(user.getId()); // remove from upvotes if it's there
            downvotes.add(user.getId());

            postRepository.save(post);
            return true; //downvoted
        }
    }
    
    
}
