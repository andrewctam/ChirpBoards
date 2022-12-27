package org.andrewtam.ChirpBoards.models;

import java.util.Date;

import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.LinkedList;

@Document("users")
public class User {
    
    @Id
    private String id;
    private Date createDate;

    private String username;
    private String displayName;

    private String hashedPassword;

    private int followers;
    private LinkedList<User> following;
    private LinkedList<Post> posts;

    private String sessionToken;
    private Date sessionTokenExpiration;
    

    public User(String username, String displayName, String hashedPassword) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.displayName = displayName;
        this.createDate = new Date();

        this.followers = 0;
        this.following = new LinkedList<User>();
        this.posts = new LinkedList<Post>();

        this.sessionToken = null;
        this.sessionTokenExpiration = null;
    }

    public String getId() { return id; }

    public Date getCreateDate() { return createDate; }

    public String getUsername() { return username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }


    public int getFollowers() { return followers; }
    public void setFollowers(int followers) { this.followers = followers; }

    public LinkedList<User> getFollowing() { return following; }

    public LinkedList<Post> getPosts() { return posts; }
    public void setPosts(LinkedList<Post> posts) { this.posts = posts; }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }

    public Date getSessionTokenExpiration() { return sessionTokenExpiration; }
    public void setSessionTokenExpiration(Date sessionTokenExpiration) { this.sessionTokenExpiration = sessionTokenExpiration; }


    public String toString() {
        return username;
    }

    public boolean equals(Object other) {
        if (other instanceof User) {
            return ((User) other).username.equals(username);
        }
        else
            return false;
    }
    

    public boolean checkUserSession(UserRepository userRepository, String sessionToken) {
        User user = userRepository.findByUsername(username);
        if (user == null || user.getSessionToken() == null || !user.getSessionToken().equals(sessionToken) || user.getSessionTokenExpiration() == null)
            return false;

        long timeDiff = user.getSessionTokenExpiration().getTime() - System.currentTimeMillis();
        
        if (timeDiff < 0) {
            return false;
        } else if (timeDiff < 300000 ) { // 5 minutes
            user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 900000 )); // 15 minutes
            userRepository.save(user);
        }        

        return true;
    }
    
    

}
