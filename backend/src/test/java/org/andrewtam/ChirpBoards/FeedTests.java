package org.andrewtam.ChirpBoards;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;


import org.andrewtam.ChirpBoards.MongoDBModels.Post;
import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.graphql.test.tester.GraphQlTester.Response;


@SpringBootTest
@AutoConfigureGraphQlTester
public class FeedTests {

    @Autowired
    private GraphQlTester graphQlTester;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    String randomString(int low, int high) {
        String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

        StringBuilder str = new StringBuilder();
        int length = (int)(Math.random() * (high - low)) + low;
        while (str.length() < length) { // length of the random string.
            int index = (int) (Math.random() * chars.length());
            str.append(chars.charAt(index));
        }

        return str.toString();
    }

    String[] register() {
        String username = randomString(3, 16);
        while (true) {
            Response res = graphQlTester.documentName("account")
            .variable("username", username)
            .variable("displayName", username)
            .variable("password", "123456789")
            .operationName("register")
            .execute();
            
            String message = res.path("register.msg").entity(String.class).get();

            if (message.equals("Username already taken"))
                username = randomString(3, 16);
            else {
                String sesionToken = res.path("register.sessionToken").entity(String.class).get();
                return new String[] {username, sesionToken};
            }
        }
    }

    public String createPost(String text, String username, String sessionToken) {
        return  graphQlTester.documentName("post")
                .variable("text", text)
                .variable("username", username)
                .variable("sessionToken", sessionToken)
                .operationName("createPost")
                .execute()
                .path("createPost.post.id")
                .entity(String.class).get();
    }
    @Test
    public void testRecent() {
        String[] payload = register();
        String user1 = payload[0].toLowerCase();
        String sessionToken1 = payload[1];

        List<ObjectId> postIds = new ArrayList<>();

        for (int i = 0; i < 20; i++) {
            postIds.add(new ObjectId(createPost(i + "", user1, sessionToken1)));
        }


        String query = """
            query {
                allPosts(pageNum: 0, size: 10, sortMethod: \"postDate\", sortDirection: \"descending\") {
                    posts {
                        text
                    }

                    hasNext
                }
            }
        """;

        Response res = graphQlTester.document(query).execute();

        for (int i = 0; i < 10; i++) {
            String text = res.path("allPosts.posts[" + i + "].text").entity(String.class).get();
            assertEquals(text, 19 - i + "");
        }

        assertEquals(true, res.path("allPosts.hasNext").entity(Boolean.class).get());


        List<Post> posts = postRepository.findAllById(postIds);
        postRepository.deleteAll(posts);

        User user = userRepository.findByUsername(user1);
        userRepository.delete(user);
    }

    @Test
    public void testPopular() {
        String[] payload = register();
        String user1 = payload[0].toLowerCase();
        String sessionToken1 = payload[1];

        List<ObjectId> postIds = new ArrayList<>();

        for (int i = 0; i < 20; i++) {
            postIds.add(new ObjectId(createPost(i + "", user1, sessionToken1)));
        }

        List<ObjectId> upvotes = new ArrayList<>();
        upvotes.add(postIds.get(4));
        upvotes.add(postIds.get(1));
        upvotes.add(postIds.get(6));

        List<Post> posts = postRepository.findAllById(upvotes);
        Collections.sort(posts, (a, b) -> a.getText().compareTo(b.getText())); //1, 4, 6

        posts.get(0).setScore(2147483646); //1
        posts.get(1).setScore(2147483647); //4
        posts.get(2).setScore(2147483646); //6
        postRepository.saveAll(posts);

        String query = """
            query {
                allPosts(pageNum: 0, size: 10, sortMethod: \"score\", sortDirection: \"descending\") {
                    posts {
                        text
                    }
                    hasNext
                }
            }
        """;

        Response res = graphQlTester.document(query).execute();

        assertEquals("4", res.path("allPosts.posts[0].text").entity(String.class).get());
        assertEquals("6", res.path("allPosts.posts[1].text").entity(String.class).get());
        assertEquals("1", res.path("allPosts.posts[2].text").entity(String.class).get());
        
        assertEquals(true, res.path("allPosts.hasNext").entity(Boolean.class).get());

        posts = postRepository.findAllById(postIds);
        postRepository.deleteAll(posts);

        User user = userRepository.findByUsername(user1);
        userRepository.delete(user);
    }


    @Test
    public void testFollowing() {
        String[] payload = register();
        String user1 = payload[0].toLowerCase();
        String sessionToken1 = payload[1];

        payload = register();
        String user2 = payload[0].toLowerCase();
        String sessionToken2 = payload[1];

        payload = register();
        String user3 = payload[0].toLowerCase();
        String sessionToken3 = payload[1];
        
        graphQlTester.documentName("account")
        .variable("userToFollow", user2)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("toggleFollow")
        .execute();

        graphQlTester.documentName("account")
        .variable("userToFollow", user3)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("toggleFollow")
        .execute();



        String user2Post1 = graphQlTester.documentName("post")
        .variable("text", "user2Post1")
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("createPost")
        .execute()
        .path("createPost.post.id")
        .entity(String.class).get();

        String user3Post1 = graphQlTester.documentName("post")
        .variable("text", "user3Post1")
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("createPost")
        .execute()
        .path("createPost.post.id")
        .entity(String.class).get();

        String user2Post2 = graphQlTester.documentName("post")
        .variable("text", "user2Post2")
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("createPost")
        .execute()
        .path("createPost.post.id")
        .entity(String.class).get();
        
        graphQlTester.documentName("post")
        .variable("postId", user2Post1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("rechirp")
        .execute();


        String query = """
            query {
                followingPosts(pageNum: 0, size: 10, sortMethod: \"score\", sortDirection: \"descending\", username: "%s") {
                    posts {
                        isRechirp
                        text
                    }
                    hasNext
                }
            }
        """.formatted(user1);

        Response res = graphQlTester.document(query).execute();
        assertEquals(false, res.path("followingPosts.hasNext").entity(Boolean.class).get());


        assertEquals(true, res.path("followingPosts.posts[0].isRechirp").entity(Boolean.class).get());
        assertEquals("user2Post2", res.path("followingPosts.posts[1].text").entity(String.class).get());
        assertEquals("user3Post1", res.path("followingPosts.posts[2].text").entity(String.class).get());
        assertEquals("user2Post1", res.path("followingPosts.posts[3].text").entity(String.class).get());




        graphQlTester.documentName("post")
        .variable("postId", user2Post1)
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("deletePost")
        .execute(); //also deletes rechirp
    

        List<ObjectId> postIds = new ArrayList<>();
        postIds.add(new ObjectId(user2Post2));
        postIds.add(new ObjectId(user3Post1));

        List<Post> posts = postRepository.findAllById(postIds);
        postRepository.deleteAll(posts);

        User userObj1 = userRepository.findByUsername(user1);
        User userObj2 = userRepository.findByUsername(user2);
        User userObj3 = userRepository.findByUsername(user3);

        List<User> users = Arrays.asList(userObj1, userObj2, userObj3);
        userRepository.deleteAll(users);
    }    
}
