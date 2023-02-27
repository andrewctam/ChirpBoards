package org.andrewtam.ChirpBoards.controllers;

import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


import org.andrewtam.ChirpBoards.GraphQLModels.BooleanResponse;
import org.andrewtam.ChirpBoards.GraphQLModels.IntResponse;
import org.andrewtam.ChirpBoards.GraphQLModels.PaginatedPosts;
import org.andrewtam.ChirpBoards.GraphQLModels.PostResponse;
import org.andrewtam.ChirpBoards.MongoDBModels.Notification;
import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.NotificationRepository;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

import com.microsoft.azure.storage.CloudStorageAccount;
import com.microsoft.azure.storage.blob.CloudBlobClient;
import com.microsoft.azure.storage.blob.CloudBlobContainer;
import com.microsoft.azure.storage.blob.CloudBlockBlob;

import graphql.GraphQLContext;


@Controller
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Value("${azure.storage.connectionString}")
    private String azureConnectionString;

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
    public PaginatedPosts allPosts(@Argument int pageNum, @Argument int size, @Argument String sortMethod, @Argument String sortDirection, @Argument String relatedUsername, GraphQLContext context) {        
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

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
        
        Page<Post> page = postRepository.findAllBoards(paging);
        return new PaginatedPosts(page);

    }
    @QueryMapping
    public PaginatedPosts trendingPosts(@Argument int pageNum, @Argument int size, @Argument String relatedUsername, GraphQLContext context) {        
        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

        
        PageRequest paging = PageRequest.of(pageNum, size, Sort.by("score", "postDate", "id").descending());
        
        long last24Hours = System.currentTimeMillis() - 86400000;
        Page<Post> page = postRepository.findTrendingPosts(last24Hours, paging);
        return new PaginatedPosts(page);

    }

    @QueryMapping
    public PaginatedPosts followingPosts(@Argument int pageNum, @Argument int size, @Argument String username, @Argument String sortMethod, @Argument String sortDirection, GraphQLContext context) {
        if (username == null)
            return null;

        User user = userRepository.findByUsername(username.toLowerCase());
        if (user == null)
            return null;

        context.put("relatedUsername", username.toLowerCase());

        List<ObjectId> followingIds = user.getFollowing();

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
        Page<Post> page;

        if (followingIds.size() == 0)
            return null;
        else if (followingIds.size() == 1)
            page = postRepository.findBoardsByAuthor(followingIds.get(0), paging);        
        else
            page = postRepository.findBoardsByAuthors(followingIds, paging);

        return new PaginatedPosts(page);
    }

    @QueryMapping
    public PaginatedPosts searchPosts(@Argument String query, @Argument int pageNum, @Argument int size, @Argument String sortMethod, @Argument String sortDirection, @Argument String relatedUsername, GraphQLContext context) {
        if (query == null || query == "")
            return new PaginatedPosts(null);

        if (relatedUsername != null)
            context.put("relatedUsername", relatedUsername.toLowerCase());

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

        Page<Post> page = postRepository.findWithRegex(".*" + query + ".*", paging);

        return new PaginatedPosts(page);
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

    @BatchMapping
    public Map<Post, Boolean> rechirpStatus(List<Post> posts, @ContextValue String relatedUsername) {
        if (relatedUsername == null)
            return null;

    
        User user = userRepository.findByUsername(relatedUsername);
        if (user == null) {
            return null;
        }


        Set<Post> rechirps = postRepository.findUsersRechirps(user.getId());
        Set<ObjectId> originalChirps = rechirps.stream().map(post -> post.getParentPost()).collect(Collectors.toSet());

        return posts.stream().collect(Collectors.toMap(
            post -> post,
            post -> originalChirps.contains(post.getId())
        ));
                
    }

    @SchemaMapping
    public PaginatedPosts comments(Post post, @Argument int pageNum, @Argument int size, @Argument String sortMethod, @Argument String sortDirection) {
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

        Page<Post> page = postRepository.findAllById(post.getComments(), paging);
        return new PaginatedPosts(page);
    }
    

    @MutationMapping
    public PostResponse createPost(@Argument String text, @Argument String base64Image, @Argument String username, @Argument String sessionToken) {
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

        String imageURL = "";
        if (base64Image.length() > 0) {
            try {
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                if (imageBytes.length > 5000000) {
                    return new PostResponse("Image must be less than 5MB", null);
                }

                CloudStorageAccount storageAccount = CloudStorageAccount.parse(azureConnectionString);
                CloudBlobClient blobClient = storageAccount.createCloudBlobClient();
                CloudBlobContainer container = blobClient.getContainerReference("images");

                String filename = username + "_" + UUID.randomUUID().toString() + ".jpg";
                CloudBlockBlob blob = container.getBlockBlobReference(filename);
                blob.uploadFromByteArray(imageBytes, 0, imageBytes.length);

                imageURL = blob.getUri().toString();
            } catch (Exception e) {
                imageURL = "";
                System.out.println(e);           
            }
        }

        Post created = postRepository.save(new Post(text, imageURL, user.getId()));

        pingUsers(text, created);
            
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
            
        Post created = new Post(text, "", user.getId());
        created.declareComment(parentPost);
        created = postRepository.save(created);
        
        pingUsers(text, created);
        
        parentPost.getComments().addFirst(created.getId());
        parentPost.adjustCommentCount(1);
        postRepository.save(parentPost);

        if (!parentPost.getAuthor().equals(user.getId())) {
            User author = userRepository.findById(parentPost.getAuthor());
            author.notifyReply(user.getId(), created.getId(), notificationRepository, userRepository);
        }

        return new PostResponse("", created);
    }

    @MutationMapping
    public BooleanResponse rechirp(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();

        if (postId == null || !ObjectId.isValid(postId) || username == "") {
            return new BooleanResponse("Invalid inputs", null);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("User not found", null);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", null);

        ObjectId id = new ObjectId(postId);

        Post post = postRepository.findById(id);

        if (post == null)
            return new BooleanResponse("Post not found", null);

        if (post.isRechirp())
            return new BooleanResponse("Can not rechirp a rechirp", null);

        if (post.getAuthor().equals(user.getId()))
            return new BooleanResponse("Can not rechirp own posts", null);

        Post rechirp = new Post("This is a rechirp of " + postId, "", user.getId());
        rechirp.declareRechirp(post);
        rechirp = postRepository.save(rechirp);

        user.getPosts().add(rechirp.getId());
        user.setPostCount(user.getPostCount() + 1);
        userRepository.save(user);
        
        return new BooleanResponse("", true);
    }

    @MutationMapping
    public BooleanResponse undoRechirp(@Argument String postId, @Argument String username, @Argument String sessionToken) {
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
        if (!post.isRechirp()) {
            post = postRepository.findRechirpByAuthor(post.getId(), user.getId());
            
            if (post == null)
                return new BooleanResponse("Rechirp not found or already deleted", null);
        }


        user.setPostCount(user.getPostCount() - 1);
        user.getPosts().remove(post.getId());
        userRepository.save(user);
    
        postRepository.delete(post);

        return new BooleanResponse("Deleted", true);
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
            response = new IntResponse("-1", post.getScore()); //downvoted
        }

        
        userRepository.save(user);
        postRepository.save(post);

        return response;
    }


    @MutationMapping
    public BooleanResponse editPost(@Argument String newText, @Argument String postId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();
        if (newText == "" || username == "" || postId == null || !ObjectId.isValid(postId)) {
            return new BooleanResponse("Invalid inputs", false);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("User not found", false);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", false);

        Post post = postRepository.findById(new ObjectId(postId));
        if (post == null) {
            return new BooleanResponse("Post not found", false);
        }

        if (!post.getAuthor().equals(user.getId())) {
            return new BooleanResponse("User not the author", false);
        }

        if (!post.isComment() && newText.length() > 500)
            return new BooleanResponse("Post too long", false);


        post.setText(newText);
        post.setEdited(true);
        postRepository.save(post);

        return new BooleanResponse("", true);
    }

    @MutationMapping
    public BooleanResponse deletePost(@Argument String postId, @Argument String username, @Argument String sessionToken) {
        username = username.toLowerCase();
        if (username == "" || postId == null || !ObjectId.isValid(postId)) {
            return new BooleanResponse("Invalid inputs", false);
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            return new BooleanResponse("User not found", false);
        }

        if (!user.checkUserSession(userRepository, sessionToken))
            return new BooleanResponse("User not authenticated", false);

        Post post = postRepository.findById(new ObjectId(postId));
        if (post == null) {
            return new BooleanResponse("Post not found", false);
        }

        if (!post.getAuthor().equals(user.getId())) {
            return new BooleanResponse("User is not the author", false);
        }


        if (post.isComment()) {
            Post parentPost = postRepository.findById(post.getParentPost());
            if (parentPost != null) {
                parentPost.adjustCommentCount(-1);
                parentPost.getComments().remove(post.getId());
                postRepository.save(parentPost);
            } //else main post was deleted
        } else {
            User author = userRepository.findById(post.getAuthor());
            author.setPostCount(author.getPostCount() - 1);
            author.getPosts().remove(post.getId());

            ObjectId pinned = author.getPinnedPost();
            if (pinned != null && pinned.equals(post.getId()))
                author.setPinnedPost(null);
                
            userRepository.save(author);
        }

        if (post.getImageURL().length() > 0) {
            try {
                CloudStorageAccount storageAccount = CloudStorageAccount.parse(azureConnectionString);
                CloudBlobClient blobClient = storageAccount.createCloudBlobClient();
                CloudBlobContainer container = blobClient.getContainerReference("images");

                String name = post.getImageURL();
                name = name.substring(name.lastIndexOf('/') + 1);

                CloudBlockBlob blob = container.getBlockBlobReference(name);
                blob.deleteIfExists();
            } catch (Exception e) {
                System.out.println(e);           
            }
        }
        
        //delete rechirps and remove it from author's post
        List<Post> rechirps = postRepository.findRechirpsOfPost(post.getId());
        if (rechirps.size() > 0) {

            Set<ObjectId> rechirpIds = rechirps.stream().map(p -> p.getId()).collect(Collectors.toSet());
            List<User> authors = userRepository.findAuthors(rechirpIds);

            for (User author : authors) {
                //remove rechirps from author's posts
                for (ObjectId p : author.getPosts())
                    if (rechirpIds.contains(p)) {
                        author.getPosts().remove(p);
                        break;
                    }

                author.setPostCount(author.getPostCount() - 1);
            }

            userRepository.saveAll(authors);
            postRepository.deleteAll(rechirps);

            //remove rechirp and post count from authors
        }

        postRepository.delete(post);
        return new BooleanResponse("", true);
    }




    private void pingUsers(String text, Post post) {
        if (text == "")
            return;

        ObjectId postId = post.getId();
        ObjectId pinger = post.getAuthor();
        
        List<String> usernames = new ArrayList<String>();
        Pattern pattern = Pattern.compile("@([a-zA-Z0-9_]+)");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            usernames.add(matcher.group(1).toLowerCase());
        }

        if (usernames.size() == 0)
            return;

        List<User> users = userRepository.findAllByUsername(usernames);
        List<Notification> pings = new ArrayList<Notification>();
        
        for (User user: users) {
            if (user.getId().equals(pinger)) {
                users.remove(user);

                if (users.size() == 0)
                    return;
                else
                    continue;
            }
            
            pings.add(new Notification("ping", user.getId(), pinger, postId));
        }
        pings = notificationRepository.saveAll(pings);
        
        
        HashMap<ObjectId, Notification> usersToNotif = new HashMap<>();
        for (Notification ping : pings) {
            usersToNotif.put(ping.getPinged(), ping);
        }

        for (User user : users) {
            user.notifyPing(usersToNotif.get(user.getId()));
        }
        userRepository.saveAll(users);
    }
}
