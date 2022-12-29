package org.andrewtam.ChirpBoards.controllers;

import java.util.LinkedList;
import java.util.List;

import org.andrewtam.ChirpBoards.GraphQLModels.BooleanResponse;
import org.andrewtam.ChirpBoards.GraphQLModels.PostResponse;
import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
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

    @SchemaMapping
    public User author(Post post) {
        return userRepository.findById(post.getAuthor());
    }

    @SchemaMapping
    public List<User> upvotes(Post post, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<User> page = userRepository.findAllById(post.getUpvotes(), paging);
        return page.getContent();
    }

    @SchemaMapping
    public List<User> downvotes(Post post, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<User> page = userRepository.findAllById(post.getDownvotes(), paging);
        return page.getContent();
    }

    @SchemaMapping
    public List<Post> comments(Post post, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<Post> page = postRepository.findAllById(post.getComments(), paging);
        return page.getContent();
    }
    




    @MutationMapping
    public PostResponse createPost(@Argument String text, @Argument String username, @Argument String sessionToken) {
        if (text == "" || username == "" || text.length() > 500) {
            return new PostResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new PostResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new PostResponse("User not authenticated", null);

        Post created = postRepository.save(new Post(text, user.getId(), false));
            
        user.getPosts().add(created.getId());
        userRepository.save(user);
        

        return new PostResponse("", created);
    }

    @MutationMapping
    public PostResponse comment(@Argument String text, @Argument String parentPostId, @Argument String username, @Argument String sessionToken) {
        if (text == "" || parentPostId == null || !ObjectId.isValid(parentPostId) || username == "") {
            return new PostResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new PostResponse("User not found", null);
        }
        if (!user.checkUserSession(userRepository, sessionToken))
            return new PostResponse("User not authenticated", null);

        Post parentPost = postRepository.findById(new ObjectId(parentPostId));
        if (parentPost == null)
            return new PostResponse("Post not found", null);
            
        Post created = postRepository.save(new Post(text, user.getId(), true));
        parentPost.getComments().add(created.getId());
        parentPost.adjustCommentCount(1);
        
        postRepository.save(parentPost);

        return new PostResponse("", created);
    }

    @MutationMapping
    public BooleanResponse upvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return new BooleanResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        Post post = postRepository.findById(new ObjectId(postId));

        if (post == null) {
            return new BooleanResponse("Post not found", null);
        }

        LinkedList<ObjectId> upvotes = post.getUpvotes();
        LinkedList<ObjectId> downvotes = post.getDownvotes();

        if (upvotes.remove(user.getId())) {
            post.adjustScore(-1);
            postRepository.save(post);

            return new BooleanResponse("", false);
        } else {
            if (downvotes.remove(user.getId())) // remove from downvotes if it's there)
                post.adjustScore(1);

            upvotes.add(user.getId());
            post.adjustScore(1);

            postRepository.save(post);

            return new BooleanResponse("", true);
        }
    }


    @MutationMapping
    public BooleanResponse downvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return new BooleanResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);

        if (user == null) {
            return new BooleanResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);
        

        Post post = postRepository.findById(new ObjectId(postId));

        if (post == null) {
            return new BooleanResponse("Post not found", null);
        }
        LinkedList<ObjectId> upvotes = post.getUpvotes();
        LinkedList<ObjectId> downvotes = post.getDownvotes();


        if (downvotes.remove(user.getId())) {
            post.adjustScore(1);
            postRepository.save(post);
            return new BooleanResponse("", false); //no longer downvoted
        } else {
            if (upvotes.remove(user.getId()))
                post.adjustScore(-1);// remove from upvotes if it's there

            downvotes.add(user.getId());
            post.adjustScore(-1);

            postRepository.save(post);
            return new BooleanResponse("", true); //downvoted
        }
    }
    
    
}
