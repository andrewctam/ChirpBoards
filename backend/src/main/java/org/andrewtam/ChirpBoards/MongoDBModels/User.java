package org.andrewtam.ChirpBoards.MongoDBModels;

import java.util.Date;

import org.andrewtam.ChirpBoards.repositories.NotificationRepository;
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

    private String userColor;

    private LinkedList<ObjectId> notifications;
    private int unreadNotifications;
    
    
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

        String[] defaultColors = { "#FFCCCC", "#FFE5CC", "#FFFFCC", "#E5FFCC", "#CCFFCC", "#CCFFE5", "#CCFFFF", "#CCE5FF", "#CCCCFF", "#E5CCFF", "#FFCCFF", "#FFCCE5", "#FF9999", "#FFCC99", "#FFFF99", "#CCFF99", "#99FF99", "#99FFCC", "#99FFFF", "#99CCFF" };
        this.userColor = defaultColors[(int) (Math.random() * defaultColors.length)];

        this.notifications = new LinkedList<ObjectId>();
        this.unreadNotifications = 0;
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
    
    public String getUserColor() { return userColor; }
    public void setUserColor(String userColor) { this.userColor = userColor; }

    public boolean checkUserSession(UserRepository userRepository, String sessionToken) {
        if(this.sessionToken == null || !this.sessionToken.equals(sessionToken) || this.sessionTokenExpiration == null)
            return false;

        long timeDiff = this.sessionTokenExpiration.getTime() - System.currentTimeMillis();
        
        if (timeDiff < 0) {
            this.setSessionToken(null);
            this.setSessionTokenExpiration(null);
            userRepository.save(this);
            return false;
        } else if (timeDiff < 900000 ) { // 15 minutes
            this.setSessionTokenExpiration(new Date( System.currentTimeMillis() + 3600000 )); // 1 hour
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


    public LinkedList<ObjectId> getNotifications() {  return notifications; }

    public int getUnreadNotifications() { return unreadNotifications; }
    
    public void readNotifications(int num) { 
        this.unreadNotifications -= num;
        if (this.unreadNotifications < 0)
            this.unreadNotifications = 0; 
    }
        
    public void notifyReply(ObjectId pinger, ObjectId post, NotificationRepository notificationRepository, UserRepository userRepository) {
        Notification notif = notificationRepository.save(new Notification("reply", this.getId(), pinger, post));
        this.unreadNotifications++;
        this.notifications.add(notif.getId());
        userRepository.save(this);
    }

    public void notifyPing(Notification notif) {
        this.unreadNotifications++;
        this.notifications.add(notif.getId());
    }

}