package org.andrewtam.ChirpBoards.controllers;

import java.text.DateFormat;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
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
import org.springframework.data.domain.Sort;
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

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @QueryMapping
    public Post post(@Argument String id, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

        if (id == null || !ObjectId.isValid(id)) {
            return null;
        }

        return postRepository.findById(new ObjectId(id));
    }

    @QueryMapping
    public List<Post> recentPosts(@Argument int first, @Argument int offset, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());


        PageRequest paging = PageRequest.of(first, offset, Sort.by("postDate").descending());
        
        Page<Post> page = postRepository.findAllBoards(paging);
        return page.getContent();

    }

    @QueryMapping
    public List<Post> popularPosts(@Argument int first, @Argument int offset, @Argument String relatedUsername, GraphQLContext context) {
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

        //sort by score, then post date if same score
        PageRequest paging = PageRequest.of(first, offset, Sort.by("score", "postDate").descending());
        
        Page<Post> page = postRepository.findAllBoards(paging);
        return page.getContent();
    }
    @QueryMapping
    public List<Post> followingPosts(@Argument int first, @Argument int offset, @Argument String username, GraphQLContext context) {
        if (username == null)
            return null;

        User user = userRepository.findByUsername(username.toLowerCase());
        if (user == null)
            return null;

        context.put("relatedUsername", username.toLowerCase());

        List<ObjectId> followingIds = user.getFollowing();

        PageRequest paging = PageRequest.of(first, offset, Sort.by("postDate").descending());
        Page<Post> page;

        if (followingIds.size() == 0)
            return null;
        else if (followingIds.size() == 1)
            page = postRepository.findBoardsByAuthor(followingIds.get(0), paging);        
        else
            page = postRepository.findBoardsByAuthors(followingIds, paging);

        return page.getContent();
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
    public Map<Post, Post> parentPost(List<Post> posts) {
        List<ObjectId> parentIds = posts.stream().map(post -> post.getParentPost()).collect(Collectors.toList());

        List<Post> parents = postRepository.findAllById(parentIds);
        HashMap<ObjectId, Post> idToParent = new HashMap<>();
        
        for (Post parent : parents) {
            idToParent.put(parent.getId(), parent);
        }

        Map<Post, Post> map = new HashMap<>();
        for (Post post : posts) {
            //some may be null, so can't use streams
            map.put(post, idToParent.get(post.getParentPost()));
        }

        return map;
    }   


    @BatchMapping
    public Map<Post, Post> rootPost(List<Post> posts) {
        List<ObjectId> rootIds = posts.stream().map(post -> post.getRootPost()).collect(Collectors.toList());

        List<Post> roots = postRepository.findAllById(rootIds);
        HashMap<ObjectId, Post> idToRoot = new HashMap<>();
        
        for (Post root : roots) {
            idToRoot.put(root.getId(), root);
        }

        Map<Post, Post> map = new HashMap<>();
        for (Post post : posts) {
            //some may be null, so can't use streams
            map.put(post, idToRoot.get(post.getRootPost()));
        }

        return map;
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

    @SchemaMapping
    public List<Post> comments(Post post, @Argument int first, @Argument int offset, @Argument String sortMethod) {
        if (sortMethod != "postDate" && sortMethod != "score")
            sortMethod = "postDate";

        PageRequest paging = PageRequest.of(first, offset, Sort.by(sortMethod).descending());

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

        Post created = postRepository.save(new Post(text, user.getId()));
            
        user.getPosts().addFirst(created.getId());
        user.setPostCount(user.getPostCount() + 1);
        userRepository.save(user);
        
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
            
        Post created = new Post(text, user.getId());

        created.declareComment(parentPost);
        created = postRepository.save(created);
        
        parentPost.getComments().addFirst(created.getId());
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

        
        userRepository.save(user);
        postRepository.save(post);

        return response;
    }
    
}
