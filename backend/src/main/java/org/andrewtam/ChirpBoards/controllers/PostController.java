package org.andrewtam.ChirpBoards.controllers;

import java.text.DateFormat;
import java.util.LinkedList;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Queue;

import org.andrewtam.ChirpBoards.GraphQLModels.IntResponse;
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

    Queue<Post> recentPosts = new LinkedList<Post>();
    PriorityQueue<Post> popularPosts = new PriorityQueue<Post>();

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;
    

    private void insertIntoFeeds(Post post) {
        if (recentPosts.contains(post)) {
            recentPosts.remove(post);
        }
        if (recentPosts.size() > 20) {
            recentPosts.poll();
        }
        recentPosts.add(post);


        if (popularPosts.contains(post)) {
            popularPosts.remove(post);
        }

        popularPosts.offer(post);
        if (popularPosts.size() > 20) {
            popularPosts.poll();
        }

    }
    
    @QueryMapping
    public Post post(@Argument String id) {
        if (id == null || !ObjectId.isValid(id)) {
            return null;
        }
        return postRepository.findById(new ObjectId(id));
    }

    @QueryMapping
    public Post[] recentPosts() {
        Post[] reversed = new Post[recentPosts.size()];
        int i = reversed.length - 1;
        for (Post post : recentPosts) {
            reversed[i] = post;
            i--;
        }
        return reversed;
    }

    @QueryMapping
    public Post[] popularPosts() {
        Post[] reversed = popularPosts.toArray(new Post[popularPosts.size()]);
        for (int i = 0; i < reversed.length / 2; i++) {
            Post temp = reversed[i];
            reversed[i] = reversed[reversed.length - i - 1];
            reversed[reversed.length - i - 1] = temp;
        }

        for (Post a : reversed) {
            System.out.print(a.getScore() + " ");
        }
        System.out.println();

        return reversed;
    }
    
    @QueryMapping
    public Post[] followingPosts(@Argument String username) {
        //TO DO
        return null;
    }

    @SchemaMapping
    public User author(Post post) {
        return userRepository.findById(post.getAuthor());
    }
    @SchemaMapping
    public String postDate(Post post, @Argument int timezone) {
        long adjustedTime = post.getPostDate() + timezone * 3600000;
        DateFormat df = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT);
        df.setTimeZone(java.util.TimeZone.getTimeZone("GMT"));

        return df.format(adjustedTime);
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
    public Integer voteStatus(Post post, @Argument String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        if (postRepository.userUpvoted(post.getId(), user.getId()) != null) {
            return 1;
        } else if (postRepository.userDownvoted(post.getId(), user.getId()) != null) {
            return -1;
        } else {
            return 0;
        }
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
            
        user.getPosts().addFirst(created.getId());
        userRepository.save(user);
        
        insertIntoFeeds(created);
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
        
        insertIntoFeeds(created);
        postRepository.save(parentPost);

        return new PostResponse("", created);
    }

    @MutationMapping
    public IntResponse upvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return new IntResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new IntResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new IntResponse("User not authenticated", null);

        Post post = postRepository.findById(new ObjectId(postId));

        if (post == null) {
            return new IntResponse("Post not found", null);
        }

        LinkedList<ObjectId> upvotes = post.getUpvotes();
        LinkedList<ObjectId> downvotes = post.getDownvotes();

        if (upvotes.remove(user.getId())) {
            post.adjustScore(-1);

            insertIntoFeeds(post);
            postRepository.save(post);

            return new IntResponse("0", post.getScore());
        } else {
            if (downvotes.remove(user.getId())) // remove from downvotes if it's there)
                post.adjustScore(1);

            upvotes.add(user.getId());
            post.adjustScore(1);


            insertIntoFeeds(post);
            postRepository.save(post);

            return new IntResponse("1", post.getScore());
        }
    }


    @MutationMapping
    public IntResponse downvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return new IntResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);

        if (user == null) {
            return new IntResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new IntResponse("User not authenticated", null);
        

        Post post = postRepository.findById(new ObjectId(postId));

        if (post == null) {
            return new IntResponse("Post not found", null);
        }
        LinkedList<ObjectId> upvotes = post.getUpvotes();
        LinkedList<ObjectId> downvotes = post.getDownvotes();


        if (downvotes.remove(user.getId())) {
            post.adjustScore(1);
            postRepository.save(post);

            insertIntoFeeds(post);
            return new IntResponse("0", post.getScore()); //no longer downvoted
        } else {
            if (upvotes.remove(user.getId()))
                post.adjustScore(-1);// remove from upvotes if it's there

            downvotes.add(user.getId());
            post.adjustScore(-1);

            insertIntoFeeds(post);
            postRepository.save(post);
            return new IntResponse("-1", post.getScore()); //downvoted
        }
    }
    
    
}
