package org.andrewtam.ChirpBoards.SQLModels;

import java.util.Date;

import org.andrewtam.ChirpBoards.repositories.NotificationRepository;
import org.andrewtam.ChirpBoards.repositories.UserRepository;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;
@Entity
@Table(name = "users")
public class User {
    
    @Id
    private String id;

    @Column(nullable = false)
    private Date createDate;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = true)
    private String pictureURL;

    @Column(nullable = false)
    private String hashedPassword;

    @Column(nullable = false)
    private int followerCount;

    @Column(nullable = false)
    private int followingCount;

    @Column(nullable = false)
    private int postCount;

    @Column(nullable = true)
    private String pinnedPost;

    @Column(nullable = true)
    private String sessionToken;

    @Column(nullable = true)
    private Date sessionTokenExpiration;

    @Column(nullable = false)
    private String userColor;

    @Column(nullable = false)
    private int unreadNotifications;
    
    public User() {}
    
    public User(String username, String displayName, String hashedPassword) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
        this.hashedPassword = hashedPassword;

        this.pictureURL = "";

        this.displayName = displayName;
        this.createDate = new Date();

        this.pinnedPost = null;

        this.followerCount = 0;
        this.followingCount = 0;
        this.postCount = 0;

        this.sessionToken = null;
        this.sessionTokenExpiration = null;

        String[] defaultColors = { "#FFCCCC", "#FFE5CC", "#FFFFCC", "#E5FFCC", "#CCFFCC", "#CCFFE5", "#CCFFFF", "#CCE5FF", "#CCCCFF", "#E5CCFF", "#FFCCFF", "#FFCCE5", "#FF9999", "#FFCC99", "#FFFF99", "#CCFF99", "#99FF99", "#99FFCC", "#99FFFF", "#99CCFF" };
        this.userColor = defaultColors[(int) (Math.random() * defaultColors.length)];

        this.unreadNotifications = 0;
    }

    public String getId() { return id; }

    public Date getCreateDate() { return createDate; }

    public String getUsername() { return username; }

    public String getPictureURL() { return pictureURL; }
    public void setPictureURL(String pictureURL) { this.pictureURL = pictureURL; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }


    public int getFollowerCount() { return followerCount; }
    public void setFollowerCount(int followerCount) { this.followerCount = followerCount; }

    public int getFollowingCount() { return followingCount; }
    public void setFollowingCount(int followingCount) { this.followingCount = followingCount; }
    
    public int getPostCount() {return this.postCount; }
    public void setPostCount(int postCount) { this.postCount = postCount; }


    public String getPinnedPost() { return pinnedPost; }
    public void setPinnedPost(String pinnedPost) { this.pinnedPost = pinnedPost; }

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
        
        int ONE_DAY = 1000 * 60 * 60 * 24;
        int ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
        if (timeDiff < 0) {
            this.setSessionToken(null);
            this.setSessionTokenExpiration(null);
            userRepository.save(this);
            return false;
        } else if (timeDiff < ONE_DAY ) { 
            this.setSessionTokenExpiration(new Date( System.currentTimeMillis() + ONE_WEEK ));
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

    @Override
    public int hashCode() {
        return this.username.hashCode();
    }


    public int getUnreadNotifications() { return unreadNotifications; }
    public void setUnreadNotifications(int unreadNotifications) { this.unreadNotifications = unreadNotifications; }
    public int incrementUnreadNotifications() { return ++this.unreadNotifications; }

    public void readNotifications(int num) { 
        this.unreadNotifications -= num;
        if (this.unreadNotifications < 0)
            this.unreadNotifications = 0; 
    }
        
    public void notifyReply(String pinger, String post, NotificationRepository notificationRepository, UserRepository userRepository) {
        notificationRepository.save(new Notification("reply", this.getId(), pinger, post));

        this.unreadNotifications++;
        userRepository.save(this);
    }

}