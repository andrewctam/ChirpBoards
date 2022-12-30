package org.andrewtam.ChirpBoards.controllers;

import java.text.DateFormat;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.stream.Collectors;

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
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.ContextValue;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import graphql.GraphQLContext;


@Controller
public class PostController {

    LinkedList<Post> recentPosts = new LinkedList<Post>();
    PriorityQueue<Post> popularPosts = new PriorityQueue<Post>();

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    private void insertIntoFeeds(Post post) {
        boolean adjustedRecent = false;
        for (Post p : recentPosts) {
            if (p.equals(post)) {
                p.setScore(post.getScore());
                adjustedRecent = true;
                break;
            }
        }

        if (!adjustedRecent) {
            if (recentPosts.size() > 20) {
                recentPosts.poll();
            }
            recentPosts.add(post);
        }


        if (popularPosts.contains(post)) {
            popularPosts.remove(post);
        }

        popularPosts.offer(post);
        if (popularPosts.size() > 20) {
            popularPosts.poll();
        }

    }
    
    @QueryMapping
    public Post post(@Argument String id, @Argument String username, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

        if (id == null || !ObjectId.isValid(id)) {
            return null;
        }

        if (username != null) {
            context.put("username", username);
        }

        return postRepository.findById(new ObjectId(id));
    }

    @QueryMapping
    public Post[] recentPosts(@Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

        Post[] reversed = new Post[recentPosts.size()];
        int i = reversed.length - 1;
        for (Post post : recentPosts) {
            reversed[i] = post;
            i--;
        }
        return reversed;
    }

    @QueryMapping
    public Post[] popularPosts(@Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());
            
        Post[] posts = new Post[popularPosts.size()];

        PriorityQueue<Post> temp = new PriorityQueue<Post>();

        int i = posts.length - 1;
        while (!popularPosts.isEmpty()) {
            posts[i] = popularPosts.poll();
            temp.offer(posts[i]);
            i--;
        }

        popularPosts = temp;
        return posts;
    }
    
    @QueryMapping
    public Post[] followingPosts(@Argument String username) {
        username = username.toLowerCase();
        
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        //List<ObjectId> following = user.getFollowing();
        //List<User> usersFollowed = userRepository.findAllById(following);


        //LinkedList<List<Post>> headsOfLinkedLists = new LinkedList<List<Post>>();
        return null;

        //with k followers 20k log k = k log k

    }

    @SchemaMapping
    public String postDate(Post post, @Argument int timezone) {
        long adjustedTime = post.getPostDate() + timezone * 3600000;
        DateFormat df = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT);
        df.setTimeZone(java.util.TimeZone.getTimeZone("GMT"));

        return df.format(adjustedTime);
    }


    @BatchMapping
    public Map<Post, User> author(List<Post> posts) {
        List<ObjectId> authorIds = posts.stream().map(post -> post.getAuthor()).collect(Collectors.toList());

        List<User> authors = userRepository.findAllById(authorIds);
        HashMap<ObjectId, User> idToAuthor = new HashMap<>();
        for (User author : authors) {
            idToAuthor.put(author.getId(), author);
        }

        return posts
                .stream()
                .collect(Collectors.toMap( 
                    post -> post,
                    post -> idToAuthor.get(post.getAuthor())
                ));
    }
    
    @BatchMapping
    public Map<Post, Integer> voteStatus(List<Post> posts, @ContextValue String relatedUsername) {
        if (relatedUsername == null)
            return null;

        User user = userRepository.findByUsername(relatedUsername);
        if (user == null) {
            return null;
        }

        List<ObjectId> postIds = posts.stream().map(post -> post.getId()).collect(Collectors.toList());

        Set<Post> upvoted = postRepository.filterUpvoted(user.getId(), postIds);
        Set<Post> downvoted = postRepository.filterDownvoted(user.getId(), postIds);       

        Map<Post, Integer> statuses = new HashMap<>();

        for (Post post : posts) {

            if (upvoted.contains(post))
                statuses.put(post, 1);
            else if (downvoted.contains(post))
                statuses.put(post, -1);
            else
                statuses.put(post, 0);
        }

        return statuses;
    }

    /*
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
    */


    @SchemaMapping
    public List<Post> comments(Post post, @Argument int first, @Argument int offset) {
        PageRequest paging = PageRequest.of(first, offset);

        Page<Post> page = postRepository.findAllById(post.getComments(), paging);
        return page.getContent();
    }
    


    @MutationMapping
    public PostResponse createPost(@Argument String text, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();
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
        user.setPostCount(user.getPostCount() + 1);
        userRepository.save(user);
        
        insertIntoFeeds(created);
        return new PostResponse("", created);
    }

    @MutationMapping
    public PostResponse comment(@Argument String text, @Argument String parentPostId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

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
    public IntResponse upvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

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


        IntResponse response;
        if (upvotes.remove(user.getId())) { // check if user already upvoted, remove it
            post.adjustScore(-1);

            response = new IntResponse("0", post.getScore());
        } else {
            if (downvotes.remove(user.getId())) { // remove from downvotes if it's there)
                post.adjustScore(1);
            }

            upvotes.add(user.getId());

            post.adjustScore(1);

           response = new IntResponse("1", post.getScore());
        }
        
        insertIntoFeeds(post);
        userRepository.save(user);
        postRepository.save(post);

        return response;

    }


    @MutationMapping
    public IntResponse downvotePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

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


        IntResponse response;
        if (downvotes.remove(user.getId())) { // check if user already downvoted, remove it
            post.adjustScore(1);
            response = new IntResponse("0", post.getScore()); //no longer downvoted
        } else {
            if (upvotes.remove(user.getId())) {
                post.adjustScore(-1);// remove from upvotes if it's there
            }

            downvotes.add(user.getId());
            post.adjustScore(-1);
            response =  new IntResponse("-1", post.getScore()); //downvoted
        }

        insertIntoFeeds(post);
        
        userRepository.save(user);
        postRepository.save(post);

        return response;
    }
    
}
