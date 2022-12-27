package org.andrewtam.ChirpBoards.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;

@Document("users")
public class User {
    
    @Id
    private String id;
    private Date createDate;

    private String username;
    private String displayName;

    private String hashedPassword;

    private int followers;
    private ArrayList<User> following;
    private ArrayList<Post> posts;

    private String sessionToken;
    private Date sessionTokenExpiration;
    

    public User(String username, String hashedPassword) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.displayName = username;
        this.createDate = new Date();

        this.followers = 0;
        this.following = new ArrayList<User>();
        this.posts = new ArrayList<Post>();

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

    public ArrayList<User> getFollowing() { return following; }

    public ArrayList<Post> getPosts() { return posts; }
    public void setPosts(ArrayList<Post> posts) { this.posts = posts; }

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

}
