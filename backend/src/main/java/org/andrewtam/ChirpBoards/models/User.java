package org.andrewtam.ChirpBoards.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class User {
    
    @Id
    private String id;
    private Date createDate;

    private String username;
    private String displayName;

    private String hashedPassword;

    private User[] followers;
    private User[] following;
    private Post[] posts;
    

    public User(String username, String hashedPassword) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.displayName = username;
        this.createDate = new Date();

        this.followers = new User[0];
        this.following = new User[0];
        this.posts = new Post[0];


    }

    public String getId() { return id; }

    public Date getCreateDate() { return createDate; }

    public String getUsername() { return username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }


    public User[] getFollowers() { return followers; }
    public void setFollowers(User[] followers) { this.followers = followers; }

    public User[] getFollowing() { return following; }
    public void setFollowing(User[] following) { this.following = following; }

    public Post[] getPosts() { return posts; }
    public void setPosts(Post[] posts) { this.posts = posts; }

}
