package org.andrewtam.ChirpBoards.MongoDBModels;


import java.util.LinkedList;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("posts")
public class Post implements Comparable<Post> {

    @Id
    private ObjectId id;
    
    private boolean isComment;
    private boolean isRechirp;
    private ObjectId parentPost;
    private ObjectId rootPost;

    private String text;
    private String imageURL;
    private ObjectId author; //reference to user
    private long postDate; //milliseconds since epoch
    private int score;
    private LinkedList<ObjectId> upvotes; //references to users
    private LinkedList<ObjectId> downvotes; //references to users

    private int commentCount;
    private LinkedList<ObjectId> comments; //references to posts

    private boolean isEdited;


    public Post(String text, String imageURL, ObjectId author) {
        this.text = text;
        this.imageURL = imageURL;
        this.author = author;

        this.isComment = false;
        this.isRechirp = false;
        this.parentPost = null;
        this.rootPost = null;

        //MM/dd/yy HH:mm:ss
        this.postDate = System.currentTimeMillis();

        this.upvotes = new LinkedList<ObjectId>();
        this.downvotes = new LinkedList<ObjectId>();
        this.score = 0;

        this.commentCount = 0;
        this.comments = new LinkedList<ObjectId>();

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

    public ObjectId getId() { return id; }

    public boolean isComment() { return isComment; }
    public boolean isRechirp() { return isRechirp; }

    public ObjectId getParentPost() { return parentPost; }

    public ObjectId getRootPost() { return rootPost; }

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

    
    public ObjectId getAuthor() { return author; }

    public long getPostDate() { return postDate; }

    public LinkedList<ObjectId> getUpvotes() { return upvotes; }

    public LinkedList<ObjectId> getDownvotes() { return downvotes; }

    public LinkedList<ObjectId> getComments() { return comments; }

    public boolean isEdited() { return isEdited; }
    public boolean setEdited(boolean isEdited) { return this.isEdited = isEdited; }

    public int getCommentCount() { return commentCount; }
    public int adjustCommentCount(int change) {
        this.commentCount += change;
        return this.commentCount;
    }

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
