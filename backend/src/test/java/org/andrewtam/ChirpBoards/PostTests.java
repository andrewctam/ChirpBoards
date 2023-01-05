package org.andrewtam.ChirpBoards;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Arrays;
import java.util.List;

import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.NotificationRepository;
import org.andrewtam.ChirpBoards.repositories.PostRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.graphql.test.tester.GraphQlTester.Response;

@SpringBootTest
@AutoConfigureGraphQlTester
public class PostTests {

    @Autowired
    GraphQlTester graphQlTester;

    @Autowired
    PostRepository postRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    NotificationRepository notificationRepository;

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

    @Test
    void testPost() {
        long postCount = postRepository.count();
        long notificationCount = notificationRepository.count();

        String[] payload = register();
        String user1 = payload[0].toLowerCase();
        String sessionToken1 = payload[1];
        
        payload = register();
        String user2 = payload[0].toLowerCase();
        String sessionToken2 = payload[1];

        payload = register();
        String user3 = payload[0].toLowerCase();
        String sessionToken3 = payload[1];


        //test create post
        String randomBody = randomString(50, 100);
        String mainPost1 = graphQlTester.documentName("post")
        .variable("text", randomBody)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("createPost")
        .execute()
        .path("createPost.post.id")
        .entity(String.class).get();

         //test pin this post
         graphQlTester.documentName("post")
         .variable("postId", mainPost1)
         .variable("username", user1)
         .variable("sessionToken", sessionToken1)
         .operationName("pinPost")
         .execute();

        String query = """
            query {
                post(id: "%s") {
                    author {
                        pinnedPost {
                            id
                        }
                        username
                    }
                    text
                }
            }
        """.formatted(mainPost1);

        Response res = graphQlTester.document(query).execute();
        assertEquals(randomBody, res.path("post.text").entity(String.class).get());
        assertEquals(user1, res.path("post.author.username").entity(String.class).get());
        assertEquals(mainPost1, res.path("post.author.pinnedPost.id").entity(String.class).get());

       

        //comments
        String commentId1 = graphQlTester.documentName("post")
        .variable("text", "1")
        .variable("parentPostId", mainPost1)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("comment")
        .execute()
        .path("comment.post.id")
        .entity(String.class).get();


        String commentId2 = graphQlTester.documentName("post")
        .variable("text", "2")
        .variable("parentPostId", mainPost1)
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("comment")
        .execute()
        .path("comment.post.id")
        .entity(String.class).get();


        String commentId3 = graphQlTester.documentName("post")
        .variable("text", "1 -> 3")
        .variable("parentPostId", commentId1) //nested
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("comment")
        .execute()
        .path("comment.post.id")
        .entity(String.class).get();
        

        //edit
        String newText = randomString(50, 100);
        graphQlTester.documentName("post")
        .variable("newText", newText)
        .variable("postId", mainPost1)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("editPost")
        .execute();

        query = """
            query {
                post(id: "%s") {
                    author {
                        username
                    }
                    text
                    comments {
                        posts {
                            author {
                                username
                            }
                            text
                            comments {
                                posts {
                                    author {
                                        username
                                    }
                                    text
                                }
                            }
                        }
                    }
                }
            }
        """.formatted(mainPost1);
        res = graphQlTester.document(query).execute();

        assertEquals(newText, res.path("post.text").entity(String.class).get());

        assertEquals("2", res.path("post.comments.posts[0].text").entity(String.class).get());
        assertEquals(user2, res.path("post.comments.posts[0].author.username").entity(String.class).get());

        assertEquals("1", res.path("post.comments.posts[1].text").entity(String.class).get());
        assertEquals(user1, res.path("post.comments.posts[1].author.username").entity(String.class).get());

        assertEquals("1 -> 3", res.path("post.comments.posts[1].comments.posts[0].text").entity(String.class).get());
        assertEquals(user3, res.path("post.comments.posts[1].comments.posts[0].author.username").entity(String.class).get());



        //check notifications
        res = graphQlTester.documentName("post")
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("notifications")
        .execute();

        assertEquals(user3, res.path("notifications.notifications[0].pinger.username").entity(String.class).get());
        assertEquals(commentId3, res.path("notifications.notifications[0].post.id").entity(String.class).get());

        assertEquals(user2, res.path("notifications.notifications[1].pinger.username").entity(String.class).get());
        assertEquals(commentId2, res.path("notifications.notifications[1].post.id").entity(String.class).get());


        assertEquals(false, res.path("notifications.hasNext").entity(Boolean.class).get());
        assertEquals(2, res.path("notifications.unread").entity(Integer.class).get());

        //clear
        res = graphQlTester.documentName("post")
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("clearNotifications")
        .execute();
        //test voting and rechirp

        //user1 upvotes
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("upvotePost")
        .execute();

        query = """
            query {
                post(id: "%s") {
                    score
                }
            }
        """.formatted(mainPost1);
        
        Integer score = graphQlTester.document(query).execute().path("post.score").entity(Integer.class).get();
        assertEquals(1, score);
    
        //user2 downvotes
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("downvotePost")
        .execute();

        query = """
            query {
                post(id: "%s") {
                    score
                }
            }
        """.formatted(mainPost1);
        
        score = graphQlTester.document(query).execute().path("post.score").entity(Integer.class).get();
        assertEquals(0, score);
    

        //user3 toggles, 0 in end
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("upvotePost")
        .execute();
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("upvotePost")
        .execute();

        query = """
            query {
                post(id: "%s") {
                    score
                }
            }
        """.formatted(mainPost1);
        
        score = graphQlTester.document(query).execute().path("post.score").entity(Integer.class).get();
        assertEquals(0, score);

        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("downvotePost")
        .execute();
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("downvotePost")
        .execute();

        query = """
            query {
                post(id: "%s") {
                    score
                }
            }
        """.formatted(mainPost1);
        
        score = graphQlTester.document(query).execute().path("post.score").entity(Integer.class).get();
        assertEquals(0, score);



        //test rechirp

        //user1 rechirps, failed since own post
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("rechirp")
        .execute();

        query = """
            query {
                post(id: "%s", relatedUsername: "%s") {
                    voteStatus
                    rechirpStatus
                }
            }
        """.formatted(mainPost1, user1);

        res = graphQlTester.document(query).execute();

        assertEquals(1, res.path("post.voteStatus").entity(Integer.class).get());
        assertEquals(false, res.path("post.rechirpStatus").entity(Boolean.class).get());


        //user2 rechirps post and a comment, shows on profile with 1 post, then 2 posts
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("rechirp")
        .execute();

        graphQlTester.documentName("post")
        .variable("postId", commentId1)
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("rechirp")
        .execute();

        query = """
            query {
                post(id: "%s", relatedUsername: "%s") {
                    voteStatus
                    rechirpStatus
                }
            }
        """.formatted(mainPost1, user2);

        res = graphQlTester.document(query).execute();

        assertEquals(-1, res.path("post.voteStatus").entity(Integer.class).get());
        assertEquals(true, res.path("post.rechirpStatus").entity(Boolean.class).get());

        query = """
            query {
                post(id: "%s", relatedUsername: "%s") {
                    voteStatus
                    rechirpStatus
                }
            }
        """.formatted(commentId1, user2);

        res = graphQlTester.document(query).execute();

        assertEquals(0, res.path("post.voteStatus").entity(Integer.class).get());
        assertEquals(true, res.path("post.rechirpStatus").entity(Boolean.class).get());

        query = """
            query {
                user(username: "%s") {
                    postCount
                    posts {
                        posts {
                            rootPost {
                                id
                            }
                            isRechirp
                        }
                    }
                   
                }
            }
        """.formatted(user2);

        res = graphQlTester.document(query).execute();
        assertEquals(2, res.path("user.postCount").entity(Integer.class).get());

        assertEquals(true, res.path("user.posts.posts[0].isRechirp").entity(Boolean.class).get());
        assertEquals(commentId1, res.path("user.posts.posts[0].rootPost.id").entity(String.class).get());

        assertEquals(true, res.path("user.posts.posts[1].isRechirp").entity(Boolean.class).get());
        assertEquals(mainPost1, res.path("user.posts.posts[1].rootPost.id").entity(String.class).get());





        //test rechrip undo
        //user3 posts a dummy post and rechrips the main post. Pins the dummy post then and undoes the rechirp. only the dummy post should show.
        String user3DummyPost = graphQlTester.documentName("post")
        .variable("text", "random")
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("createPost")
        .execute()
        .path("createPost.post.id")
        .entity(String.class).get();

        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("rechirp")
        .execute();

        query = """
            query {
                user(username: "%s") {
                    postCount
                    posts {
                        posts {
                            rootPost {
                                id
                            }
                            isRechirp
                        }
                    }
                   
                }
            }
        """.formatted(user3);

        res = graphQlTester.document(query).execute();
        assertEquals(2, res.path("user.postCount").entity(Integer.class).get());
        assertEquals(true, res.path("user.posts.posts[0].isRechirp").entity(Boolean.class).get());
        assertEquals(mainPost1, res.path("user.posts.posts[0].rootPost.id").entity(String.class).get());

        assertEquals(false, res.path("user.posts.posts[1].isRechirp").entity(Boolean.class).get());
        
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("undoRechirp")
        .execute();

        query = """
            query {
                post(id: "%s", relatedUsername: "%s") {
                    voteStatus
                    rechirpStatus
                }
            }
        """.formatted(mainPost1, user3);

        res = graphQlTester.document(query).execute();

        assertEquals(0, res.path("post.voteStatus").entity(Integer.class).get());
        assertEquals(false, res.path("post.rechirpStatus").entity(Boolean.class).get());

        query = """
            query {
                user(username: "%s") {
                    postCount
                    posts {
                        posts {
                            isRechirp
                        }
                    }
                   
                }
            }
        """.formatted(user3);

        res = graphQlTester.document(query).execute();
        assertEquals(1, res.path("user.postCount").entity(Integer.class).get());
        assertEquals(false, res.path("user.posts.posts[0].isRechirp").entity(Boolean.class).get());


        //test deleting posts
        graphQlTester.documentName("post")
        .variable("postId", mainPost1)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("deletePost")
        .execute();

        graphQlTester.documentName("post")
        .variable("postId", commentId1)
        .variable("username", user1)
        .variable("sessionToken", sessionToken1)
        .operationName("deletePost")
        .execute();

        graphQlTester.documentName("post")
        .variable("postId", commentId2)
        .variable("username", user2)
        .variable("sessionToken", sessionToken2)
        .operationName("deletePost")
        .execute();

        graphQlTester.documentName("post")
        .variable("postId", commentId3)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("deletePost")
        .execute();
        
        graphQlTester.documentName("post")
        .variable("postId", user3DummyPost)
        .variable("username", user3)
        .variable("sessionToken", sessionToken3)
        .operationName("deletePost")
        .execute();

        assertEquals(postCount, postRepository.count());
    
        //delete users
        User userObj1 = userRepository.findByUsername(user1);
        assertEquals(userObj1.getPostCount(), 0);
        assertEquals(userObj1.getPosts().size(), 0);
        assertNull(userObj1.getPinnedPost());
        assertEquals(0, userObj1.getNotifications().size());
        assertEquals(0, userObj1.getUnreadNotifications());

        assertEquals(notificationCount, notificationRepository.count());


        User userObj2 = userRepository.findByUsername(user2);
        assertEquals(userObj2.getPostCount(), 0);
        assertEquals(userObj2.getPosts().size(), 0);

        User userObj3 = userRepository.findByUsername(user3);
        assertEquals(userObj3.getPostCount(), 0);
        assertEquals(userObj3.getPosts().size(), 0);

        List<User> users = Arrays.asList(userObj1, userObj2, userObj3);

        userRepository.deleteAll(users);

    }    
}
