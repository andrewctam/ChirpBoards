package org.andrewtam.ChirpBoards.MongoDBModels;

import java.util.Date;

import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.LinkedList;

@Document("users")
public class User {
    
    @Id
    private ObjectId id;
    private Date createDate;

    private String username;
    private String displayName;

    private String hashedPassword;

    private int followerCount;
    private LinkedList<ObjectId> followers; //references to users

    private int followingCount;
    private LinkedList<ObjectId> following; //references to users

    private int postCount;
    private LinkedList<ObjectId> posts; //references to posts
    private ObjectId pinnedPost;

    private String sessionToken;
    private Date sessionTokenExpiration;

    private String headerColor;
    

    public User(String username, String displayName, String hashedPassword) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.displayName = displayName;
        this.createDate = new Date();

        this.followers = new LinkedList<ObjectId>();
        this.following = new LinkedList<ObjectId>();
        this.posts = new LinkedList<ObjectId>();
        this.pinnedPost = null;

        this.followerCount = 0;
        this.followingCount = 0;
        this.postCount = 0;

        this.sessionToken = null;
        this.sessionTokenExpiration = null;

        this.headerColor = "#2e2e2e";
    }

    public ObjectId getId() { return id; }

    public Date getCreateDate() { return createDate; }

    public String getUsername() { return username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public LinkedList<ObjectId> getFollowers() { return followers; }

    public LinkedList<ObjectId> getFollowing() { return following; }

    public int getFollowerCount() { return followerCount; }
    public void setFollowerCount(int followerCount) { this.followerCount = followerCount; }

    public int getFollowingCount() { return followingCount; }
    public void setFollowingCount(int followingCount) { this.followingCount = followingCount; }
    
    public int getPostCount() {return this.postCount; }
    public void setPostCount(int postCount) { this.postCount = postCount; }

    public LinkedList<ObjectId> getPosts() { return posts; }

    public ObjectId getPinnedPost() { return pinnedPost; }
    public void setPinnedPost(ObjectId pinnedPost) { this.pinnedPost = pinnedPost; }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }

    public Date getSessionTokenExpiration() { return sessionTokenExpiration; }
    public void setSessionTokenExpiration(Date sessionTokenExpiration) { this.sessionTokenExpiration = sessionTokenExpiration; }
    
    public String getHeaderColor() { return headerColor; }
    public void setHeaderColor(String headerColor) { this.headerColor = headerColor; }

    public boolean checkUserSession(UserRepository userRepository, String sessionToken) {
        if(this.sessionToken == null || !this.sessionToken.equals(sessionToken) || this.sessionTokenExpiration == null)
            return false;

        long timeDiff = this.sessionTokenExpiration.getTime() - System.currentTimeMillis();
        
        if (timeDiff < 0) {
            this.setSessionToken(null);
            this.setSessionTokenExpiration(null);
            userRepository.save(this);
            return false;
        } else if (timeDiff < 300000 ) { // 5 minutes
            this.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 900000 )); // 15 minutes
            userRepository.save(this);
        }        

        return true;
    }
    
    
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

    public int hashCode() {
        return this.username.hashCode();
    }

}
