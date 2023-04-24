package org.andrewtam.ChirpBoards.SQLModels;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;



@Entity
@Table(name = "posts")
public class Post implements Comparable<Post> {

    @Id
    private String id;
    
    @Column(nullable = false)
    private boolean isComment;

    @Column(nullable = false)
    private boolean isRechirp;

    @Column(nullable = true)
    private String parentPost;

    @Column(nullable = true)
    private String rootPost;

    @Column(nullable = false)
    private String text;

    @Column(nullable = true)
    private String imageURL;

    @Column(nullable = false)
    private String author; //reference to user id

    @Column(nullable = false)
    private long postDate; //milliseconds since epoch

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int commentCount;

    @Column(nullable = false)
    private boolean isEdited;

    public Post() {}

    public Post(String text, String imageURL, String author) {
        this.id = UUID.randomUUID().toString();
        this.text = text;
        this.imageURL = imageURL;
        this.author = author;

        this.isComment = false;
        this.isRechirp = false;
        this.parentPost = null;
        this.rootPost = null;

        //MM/dd/yy HH:mm:ss
        this.postDate = System.currentTimeMillis();

        this.score = 0;

        this.commentCount = 0;

        this.isEdited = false;
    }

    public void declareComment(Post parentPost) {
        this.isComment = true;
        this.parentPost = parentPost.id;

        if (parentPost.isComment)
            this.rootPost = parentPost.rootPost;
        else
            this.rootPost = parentPost.id;
    }

    public void declareRechirp(Post originalPost) {
        this.isRechirp = true;
        this.parentPost = originalPost.id;
        this.rootPost = originalPost.id;
    }

    public String getId() { return id; }

    public boolean isComment() { return isComment; }
    public boolean isRechirp() { return isRechirp; }

    public String getParentPost() { return parentPost; }

    public String getRootPost() { return rootPost; }

    public String getText() { return text; }
    public String setText(String text) { return this.text = text; }

    public String getImageURL() { return imageURL; }
    public String setImageURL(String imageURL) { return this.imageURL = imageURL; }

    public int getScore() { return score; }

    public void setScore(int score) { this.score = score; }
    
    public int adjustScore(int change) {
        this.score += change;
        return this.score;
     }

    
    public String getAuthor() { return author; }

    public long getPostDate() { return postDate; }

    public boolean isEdited() { return isEdited; }
    public boolean setEdited(boolean isEdited) { return this.isEdited = isEdited; }

    public int getCommentCount() { return commentCount; }
    public int adjustCommentCount(int change) {
        this.commentCount += change;
        return this.commentCount;
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    public boolean equals(Object other) {
        if (other instanceof Post) {
            return this.id.equals(((Post) other).id);
        }

        return false;
    }

    public int compareTo(Post other) {
        if (this.equals(other))
            return 0;
            
        if (this.score == other.score) {
            if (this.postDate > other.postDate) //earlier has higher priority
                return 1;
            else if (this.postDate == other.postDate) //almost impossible?
                return 0;
            else
                return -1;

        } else if (this.score > other.score)
            return 1;
        else
            return -1;
    }

    public String toString() {
        return id.toString();
    }
}
