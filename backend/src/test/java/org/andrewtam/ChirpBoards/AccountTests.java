package org.andrewtam.ChirpBoards;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.andrewtam.ChirpBoards.MongoDBModels.User;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.graphql.test.tester.GraphQlTester.Response;

@SpringBootTest
@AutoConfigureGraphQlTester
class AccountTests {

	@Autowired
	GraphQlTester graphQlTester;

    @Autowired
    UserRepository userRepository;


    static String randomString(int low, int high) {
        String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

        StringBuilder str = new StringBuilder();
        int length = (int)(Math.random() * (high - low)) + low;
        while (str.length() < length) { // length of the random string.
            int index = (int) (Math.random() * chars.length());
            str.append(chars.charAt(index));
        }

        return str.toString();
    }

	String signin(String username, String password) {
		Response reponse = graphQlTester.documentName("account")
			.variable("username", username)
			.variable("password", password)
            .operationName("signin")
			.execute();

        if (!reponse.path("signin.msg").entity(String.class).get().equals("Success"))
            return null;
        else
            return reponse.path("signin.sessionToken").entity(String.class).get();
			
	}

    String register() {
        String username = randomString(3, 16);
        while (true) {
            String msg = graphQlTester.documentName("account")
            .variable("username", username)
            .variable("displayName", username)
            .variable("password", "123456789")
            .operationName("register")
            .execute()
            .path("register.msg")
            .entity(String.class).get();
            
            if (msg.equals("Username already taken"))
                username = randomString(3, 16);
            else {
                return username;
            }
        }
    }

    
    @Test
    void testAccount() {
        //test register and login
        String username = register().toLowerCase();
        String sessionToken = signin(username, "123456789");

        assertNotNull(sessionToken);

        //test verify session
        Integer notifs = graphQlTester.documentName("account")
        .variable("username", username)
        .variable("sessionToken", sessionToken)
        .operationName("verifySession")
        .execute()
        .path("verifySession")
        .entity(Integer.class).get();

        assertNotNull(notifs);

        //test change password
        graphQlTester.documentName("account")
        .variable("oldPassword", "123456789")
        .variable("newPassword", "abcdefghij")
        .variable("username", username)
        .operationName("changePassword")
        .execute();

        sessionToken = signin(username, "123456789");
        assertNull(sessionToken);
        
        sessionToken = signin(username, "abcdefghij");
        assertNotNull(sessionToken);


        String username2 = register().toLowerCase();;

        //test follow
        graphQlTester.documentName("account")
        .variable("userToFollow", username2)
        .variable("username", username)
        .variable("sessionToken", sessionToken)
        .operationName("toggleFollow")
        .execute();

        String query = """
            query {
                user(username: "%s") {
                    followerCount
                    followingCount
                    following {
                        users {
                            username
                            followingCount
                            followerCount
                            followers {
                                users {
                                    username
                                }
                            }
                        }
                        hasNext
                    }
                }
            }
        """.formatted(username);
        
        Response res = graphQlTester.document(query).execute();
        assertEquals(false, res.path("user.following.hasNext").entity(Boolean.class).get());

        //check if user is following user2
        assertEquals(username2, res.path("user.following.users[0].username").entity(String.class).get());
        assertEquals(1, res.path("user.followingCount").entity(Integer.class).get());
        assertEquals(0, res.path("user.followerCount").entity(Integer.class).get());        

        //check if user is on user2's followers list
        assertEquals(username, res.path("user.following.users[0].followers.users[0].username").entity(String.class).get());
        assertEquals(0, res.path("user.following.users[0].followingCount").entity(Integer.class).get());
        assertEquals(1, res.path("user.following.users[0].followerCount").entity(Integer.class).get());

        
        //test unfollow
        graphQlTester.documentName("account")
        .variable("userToFollow", username2)
        .variable("username", username)
        .variable("sessionToken", sessionToken)
        .operationName("toggleFollow")
        .execute();

        query = """
            query {
                user(username: "%s") {
                    followingCount
                    following {
                        users {
                            username
                        }
                    }
                }
            }
        """.formatted(username);

        res = graphQlTester.document(query).execute();
        assertEquals(0, res.path("user.followingCount").entity(Integer.class).get());
        assertEquals(0, res.path("user.following.users").entity(List.class).get().size());

        User user2 = userRepository.findByUsername(username2);
        assertEquals(0, user2.getFollowers().size());
        assertEquals(0, user2.getFollowingCount());

        userRepository.delete(user2);
    
        //test change display name and color
        graphQlTester.documentName("account")
        .variable("username", username)
        .variable("newDisplayName", "1")
        .variable("sessionToken", sessionToken)
        .operationName("changeDisplayName")
        .execute();

        graphQlTester.documentName("account")
        .variable("username", username)
        .variable("newUserColor", "#FFFFFF")
        .variable("sessionToken", sessionToken)
        .operationName("changeUserColor")
        .execute();

        query = """
                query {
                    user(username: "%s") {
                        displayName
                        userColor
                    }
                }
        """.formatted(username);
                

        res = graphQlTester.document(query).execute();
        assertEquals("1", res.path("user.displayName").entity(String.class).get());
        assertEquals("#FFFFFF", res.path("user.userColor").entity(String.class).get());


        //test signout
        graphQlTester.documentName("account")
        .variable("username", username)
        .variable("sessionToken", sessionToken)
        .operationName("signout")
        .execute();

        User user = userRepository.findByUsername(username);

        assertNull(user.getSessionToken());
        assertNull(user.getSessionTokenExpiration());

        userRepository.delete(user);
    }
}
